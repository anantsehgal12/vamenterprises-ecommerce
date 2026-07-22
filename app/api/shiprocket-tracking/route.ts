import { NextRequest, NextResponse } from "next/server";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry = 0;
let authPromise: Promise<string> | null = null;

async function getShiprocketToken(): Promise<string> {
  // Return active cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  // Deduplicate simultaneous auth requests
  if (authPromise) {
    return authPromise;
  }

  authPromise = (async () => {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new Error("Shiprocket credentials missing in environment variables.");
    }

    const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = data?.message || "Shiprocket authentication failed";
      throw new Error(message);
    }

    if (!data?.token) {
      throw new Error("Shiprocket authentication did not return a valid token");
    }

    cachedToken = data.token as string;
    // Cache for 9 days (token valid for 10 days)
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
    return cachedToken;
  })().finally(() => {
    authPromise = null;
  });

  return authPromise;
}

export async function GET(req: NextRequest) {
  const awb = req.nextUrl.searchParams.get("awb");

  if (!awb) {
    return NextResponse.json(
      { error: "AWB number parameter is required" },
      { status: 400 }
    );
  }

  try {
    let token = await getShiprocketToken();

    let trackingRes = await fetch(
      `${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awb)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    // If token expired on Shiprocket side, invalidate cache and retry once
    if (trackingRes.status === 401) {
      cachedToken = null;
      tokenExpiry = 0;
      token = await getShiprocketToken();

      trackingRes = await fetch(
        `${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awb)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
    }

    const data = await trackingRes.json().catch(() => null);

    if (!trackingRes.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to fetch tracking data" },
        { status: trackingRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Shiprocket tracking error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}