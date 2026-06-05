import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  auth,
  clerkClient,
} from "@clerk/nextjs/server";

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
      emailOrders,
      emailMarketing,
      emailUpdates,
    } = body;

    const clerk = await clerkClient();

    await clerk.users.updateUserMetadata(
      userId,
      {
        publicMetadata: {
          emailOrders,

          emailMarketing,

          emailUpdates,
        },
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error(
      "Error updating notification preferences:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update notification preferences",
      },
      { status: 500 }
    );
  }
}