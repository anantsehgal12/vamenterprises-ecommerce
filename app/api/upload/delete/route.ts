import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { r2, R2_BUCKET } from "@/lib/r2";
import { useIsAdmin } from "@/app/extras/useIsAdmin";

export async function POST(req: NextRequest) {
  const user = await currentUser();

  if (!user || user.publicMetadata.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { key } = await req.json();

  if (!key) {
    return NextResponse.json(
      { error: "key is required" },
      { status: 400 }
    );
  }

  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );

  return NextResponse.json({
    success: true,
  });
}