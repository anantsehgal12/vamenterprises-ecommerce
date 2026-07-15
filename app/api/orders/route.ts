import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import {
  Cart,
  CartItem,
  Notification,
  OrderItem,
  Order,
  User,
} from "@/src/db/schema";
import { sendOrderConfirmationEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(request.url);
    const seller = url.searchParams.get("seller");

    if (seller === "true") {
      const clerk = await clerkClient();
      const userObj = await clerk.users.getUser(userId);
      if (userObj.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      const orders = await db.query.Order.findMany({
        orderBy: [desc(Order.createdAt)],
        with: { items: { with: { product: { with: { category: true, images: true } } } }, user: true },
      });
      return NextResponse.json(orders);
    } else {
      const orders = await db.query.Order.findMany({
        where: eq(Order.userId, userId),
        orderBy: [desc(Order.createdAt)],
        with: { items: { with: { product: { with: { category: true, images: true } } } }, user: true },
      });
      return NextResponse.json(orders);
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      totalAmount,
      customerDetails,
      isManual,
      items: manualItems,
      invoiceUrl,
      paymentMethod,
    } = body;

    // Fallback: Ensure the user exists in our local DB to prevent Foreign Key constraint errors
    const existingUser = await db.query.User.findFirst({
      where: eq(User.clerkId, userId),
    });

    if (!existingUser) {
      const clerk = await clerkClient();
      const userObj = await clerk.users.getUser(userId);
      await db.insert(User).values({
        clerkId: userId,
        email: userObj.emailAddresses[0]?.emailAddress || "no-email@example.com",
        name: `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim(),
        imageUrl: userObj.imageUrl || "",
        role: userObj.publicMetadata?.role === "admin" ? "admin" : "customer",
      });
    }

    if (isManual) {
      const clerk = await clerkClient();
      const userObj = await clerk.users.getUser(userId);
      const isAdmin = userObj.publicMetadata?.role === "admin";
      
      if (!isAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      if (!totalAmount || !customerDetails || !manualItems || manualItems.length === 0) {
        return NextResponse.json(
          { error: "Missing required fields for manual order" },
          { status: 400 }
        );
      }
    } else {
      if (!razorpayOrderId || !razorpayPaymentId || !totalAmount) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
    }

    let orderItems: any[] = [];
    let cartId = "";

    if (!isManual) {
      // Get user cart
      const cart = await db.query.Cart.findFirst({
        where: eq(Cart.userId, userId),
        with: {
          items: {
            with: {
              product: {
                with: {
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
      }
      
      cartId = cart.id;
      orderItems = cart.items.map((item) => ({
        productId: item.productId,
        variant: item.variant,
        quantity: item.quantity,
        price: String(item.product.price.replace(/[^\d.]/g, "")),
        product: item.product,
      }));
    } else {
      orderItems = manualItems;
    }

    const orderId = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");

    const normalizedAddress = {
      fullName: customerDetails?.fullName || "",
      phone: customerDetails?.contactNo || "",
      email: customerDetails?.email || "",
      addressLine1: customerDetails?.address || "",
      city: customerDetails?.city || "",
      state: customerDetails?.state || "",
      postalCode: customerDetails?.pincode || "",
      country: customerDetails?.country || "India",
    };

    const [order] = await db
      .insert(Order)
      .values({
        id: crypto.randomUUID(),
        orderId,
        userId: isManual ? null : userId,
        status: isManual ? "CONFIRMED" : "PENDING",
        totalAmount: String(totalAmount),
        razorpayOrderId: razorpayOrderId || "MANUAL",
        razorpayPaymentId: razorpayPaymentId || "MANUAL",
        paymentMethod: paymentMethod || (isManual ? "COD" : "Razorpay"),
        address: normalizedAddress,
        invoiceUrl: invoiceUrl || null,
      } as typeof Order.$inferInsert)
      .returning();

    // Create order items
    await db.insert(OrderItem).values(
      orderItems.map((item) => ({
        id: crypto.randomUUID(),
        orderId: order.id,
        productId: item.productId,
        variant: item.variant,
        quantity: item.quantity,
        price: String(item.price),
      } as typeof OrderItem.$inferInsert))
    );

    await db.insert(Notification).values({
      id: crypto.randomUUID(),
      message: `New order #${orderId} received for ₹${totalAmount}`,
      type: "order",
      isRead: false,
    } as typeof Notification.$inferInsert);

    if (!isManual && cartId) {
      await db.delete(CartItem).where(eq(CartItem.cartId, cartId));
    }

    if (!isManual && normalizedAddress.email) {
      await sendOrderConfirmationEmail(normalizedAddress.email, orderId, {
        totalAmount,
        createdAt: new Date().toISOString(),
        items: orderItems,
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}