import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pincode = searchParams.get("pincode");

  if (!pincode) {
    return NextResponse.json({ error: "Pincode is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://indian-pincode-2024.p.rapidapi.com/pincode?pincode=${pincode}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": process.env.RAPIDAPI_HOST as string,
          "x-rapidapi-key": process.env.RAPIDAPI_KEY as string,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching pincode:", error);
    return NextResponse.json(
      { error: "Failed to fetch pincode data" },
      { status: 500 }
    );
  }
}