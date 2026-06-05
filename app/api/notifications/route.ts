import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";

import { Notification } from "@/src/db/schema";

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

    // Global notifications for seller/admin
    const allNotifications = await db
      .select()
      .from(Notification)
      .orderBy(
        desc(Notification.createdAt)
      );

    return NextResponse.json(
      allNotifications
    );
  } catch (error) {
    console.error(
      "Error fetching notifications:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
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

    const body = await request.json();

    const { message, type } = body;

    if (!message || !type) {
      return NextResponse.json(
        {
          error:
            "Message and type are required",
        },
        { status: 400 }
      );
    }

    const insertedNotification =
      await db
        .insert(Notification)
        .values({
          id: crypto.randomUUID(),

          message,

          type,
        } as typeof Notification.$inferInsert)
        .returning();

    return NextResponse.json(
      insertedNotification[0],
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error creating notification:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create notification",
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

    const body = await request.json();

    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Notification ID is required",
        },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case "mark_read":
        updateData.isRead = true;
        break;

      case "mark_unread":
        updateData.isRead = false;
        break;

      case "pin":
        updateData.isRead = true;
        updateData.isPinned = true;
        break;

      case "unpin":
        updateData.isPinned = false;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const updatedNotification =
      await db
        .update(Notification)
        .set(updateData)
        .where(eq(Notification.id, id))
        .returning();

    return NextResponse.json(
      updatedNotification[0]
    );
  } catch (error) {
    console.error(
      "Error updating notification:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update notification",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Notification ID is required",
        },
        { status: 400 }
      );
    }

    await db
      .delete(Notification)
      .where(eq(Notification.id, id));

    return NextResponse.json({
      message:
        "Notification deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error deleting notification:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete notification",
      },
      { status: 500 }
    );
  }
}