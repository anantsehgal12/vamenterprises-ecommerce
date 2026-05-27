import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";

import {
  CartItem,
  Cart,
  Notification,
  OrderItem,
  Order,
} from "@/src/db/schema";

import { sendOrderConfirmationEmail } from "@/lib/email";

function generateOrderId(): string {
  const randomNum = Math.floor(
    10000000 + Math.random() * 90000000
  );

  return randomNum.toString();
}

export async function POST(
  request: NextRequest
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      totalAmount,
      customerDetails,
    } = await request.json();

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !totalAmount
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Generate unique order ID
    let orderId = "";
    let isUnique = false;

    let attempts = 0;

    const maxAttempts = 10;

    do {
      orderId = generateOrderId();

      const existingOrder =
        await db.query.Order.findFirst({
          where: eq(
            Order.orderId,
            orderId
          ),
        });

      if (!existingOrder) {
        isUnique = true;
      }

      attempts++;
    } while (
      !isUnique &&
      attempts < maxAttempts
    );

    if (!isUnique) {
      return NextResponse.json(
        {
          error:
            "Failed to generate unique order ID",
        },
        { status: 500 }
      );
    }

    const normalizedAddress = {
      fullName:
        customerDetails?.fullName ||
        customerDetails?.name ||
        "",

      phone:
        customerDetails?.contactNo ||
        customerDetails?.phone ||
        "",

      email:
        customerDetails?.email || "",

      addressLine1:
        customerDetails?.address ||
        customerDetails?.addressLine1 ||
        "",

      city:
        customerDetails?.city || "",

      state:
        customerDetails?.state ||
        customerDetails?.State ||
        customerDetails?.region ||
        customerDetails?.province ||
        "",

      postalCode:
        customerDetails?.pincode ||
        customerDetails?.postalCode ||
        customerDetails?.zip ||
        "",

      country:
        customerDetails?.country || "",
    };

    console.log(
      "SAVING ORDER ADDRESS",
      normalizedAddress
    );

    // Create order
    const insertedOrder = await db
      .insert(Order)
      .values({
        id: crypto.randomUUID(),

        orderId,

        userId,
        
        status: "PENDING",

        totalAmount: String(totalAmount),

        razorpayOrderId,

        razorpayPaymentId,

        address: normalizedAddress,
      } as typeof Order.$inferInsert)
      .returning();

    const order = insertedOrder[0];

    // Create order items
    await db.insert(OrderItem).values(
      cart.items.map((item) => ({
        id: crypto.randomUUID(),

        orderId: order.id,

        productId: item.productId,

        variant: item.variant,

        quantity: item.quantity,

        price: String(
          item.product.price.replace(
            /[^\d.]/g,
            ""
          )
        ),
      } as typeof OrderItem.$inferInsert))
    );

    // Fetch full order
    const fullOrder =
      await db.query.Order.findFirst({
        where: eq(Order.id, order.id),

        with: {
          items: {
            with: {
              product: {
                with: {
                  category: true,

                  images: true,
                },
              },
            },
          },
        },
      });

    // Create notification
    await db.insert(Notification).values({
      id: crypto.randomUUID(),

      message: `New order received: ${order.orderId} for ₹${order.totalAmount}`,

      type: "ORDER",
    } as typeof Notification.$inferInsert);

    // Clear cart
    await db
      .delete(CartItem)
      .where(eq(CartItem.cartId, cart.id));

    // Send email
    if (customerDetails?.email) {
      try {
        await sendOrderConfirmationEmail(
          customerDetails.email,

          order.orderId,

          {
            totalAmount:
              order.totalAmount,

            createdAt:
              order.createdAt,

            items:
              fullOrder?.items.map(
                (item) => ({
                  product: {
                    name:
                      item.product.name,
                  },

                  quantity:
                    item.quantity,

                  price: item.price,
                })
              ) || [],
          }
        );
      } catch (emailError) {
        console.error(
          "Failed to send order confirmation email:",
          emailError
        );
      }
    }

    return NextResponse.json({
      orderId: order.orderId,

      id: order.id,

      totalAmount:
        order.totalAmount,

      items: fullOrder?.items || [],

      createdAt:
        order.createdAt,
    });
  } catch (error) {
    console.error(
      "Error creating order:",
      error
    );

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(
      request.url
    );

    const isSeller =
      searchParams.get("seller") ===
      "true";

    let allOrders;

    if (isSeller) {
      allOrders = await db.query.Order.findMany(
        {
          with: {
            items: {
              with: {
                product: {
                  with: {
                    category: true,

                    images: true,
                  },
                },
              },
            },
          },

          orderBy: desc(
            Order.createdAt
          ),
        }
      );
    } else {
      allOrders = await db.query.Order.findMany(
        {
          where: eq(
            Order.userId,
            userId
          ),

          with: {
            items: {
              with: {
                product: {
                  with: {
                    category: true,

                    images: true,
                  },
                },
              },
            },
          },

          orderBy: desc(
            Order.createdAt
          ),
        }
      );
    }

    return NextResponse.json(
      allOrders
    );
  } catch (error) {
    console.error(
      "Error fetching orders:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}