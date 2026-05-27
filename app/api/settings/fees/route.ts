import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  auth,
  clerkClient,
} from "@clerk/nextjs/server";

import { db } from "@/src/db";
import { StoreSettings } from "@/src/db/schema";

export async function GET() {
  try {
    const settings = await db.query.StoreSettings.findFirst();

    if (!settings) {
      return NextResponse.json({
        standardDeliveryFee: "50",
        freeDeliveryThreshold: "500",
        freeDeliveryCoupon: true,
      });
    }

    return NextResponse.json({
      standardDeliveryFee:
        settings.standardDeliveryFee,

      freeDeliveryThreshold:
        settings.freeDeliveryThreshold,

      freeDeliveryCoupon:
        settings.freeDeliveryCoupon,
    });
  } catch (error) {
    console.error(
      "Error fetching delivery fees:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch delivery fees",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body =
      await request.json();

    const {
      standardDeliveryFee,
      freeDeliveryThreshold,
      freeDeliveryCoupon,
    } = body;

    const clerk = await clerkClient();

    const user = await clerk.users.getUser(userId);

    if (user.publicMetadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const settings = await db.query.StoreSettings.findFirst();

    if (settings) {
      await db.update(StoreSettings).set({
        standardDeliveryFee: String(standardDeliveryFee),
        freeDeliveryThreshold: String(freeDeliveryThreshold),
        freeDeliveryCoupon,
        updatedAt: new Date(),
      });
    } else {
      await db.insert(StoreSettings).values({
        standardDeliveryFee: String(standardDeliveryFee),
        freeDeliveryThreshold: String(freeDeliveryThreshold),
        freeDeliveryCoupon,
      });
    }

    return NextResponse.json({
      success: true,

      message:
        "Delivery fees updated successfully",
    });
  } catch (error) {
    console.error(
      "Error updating delivery fees:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update delivery fees",
      },
      { status: 500 }
    );
  }
}