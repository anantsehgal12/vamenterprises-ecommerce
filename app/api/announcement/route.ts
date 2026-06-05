import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db/index"; // Adjust this import based on your actual db connection file
import { Announcement } from "@/src/db/schema"; // Adjust based on your schema location
import { eq } from "drizzle-orm";

// GET: Fetch all announcements
export async function GET() {
  try {
    const announcements = await db.select().from(Announcement);
    return NextResponse.json(announcements, { status: 200 });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST: Create a new announcement
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and message are required" },
        { status: 400 }
      );
    }

    const newAnnouncement = await db
      .insert(Announcement)
      .values({ name, message })
      .returning();

    return NextResponse.json(newAnnouncement[0], { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing announcement
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, message } = body;

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    const updatedAnnouncement = await db
      .update(Announcement)
      .set({ name, message })
      .where(eq(Announcement.id, id))
      .returning();

    if (!updatedAnnouncement.length) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json(updatedAnnouncement[0], { status: 200 });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an announcement
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    const deletedAnnouncement = await db
      .delete(Announcement)
      .where(eq(Announcement.id, id))
      .returning();

    if (!deletedAnnouncement.length) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Announcement deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}