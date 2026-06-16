import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const awb = searchParams.get('awb');

  if (!awb) {
    return NextResponse.json({ error: 'AWB number is required' }, { status: 400 });
  }

  if (!process.env.SHIPROCKET_API_TOKEN) {
    console.error('SHIPROCKET_API_TOKEN is not set in .env.local');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // This is the standard Shiprocket v2 tracking endpoint.
    const shiprocketResponse = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SHIPROCKET_API_TOKEN}`,
      },
      // Revalidate data every 5 minutes to avoid hitting API limits.
      next: { revalidate: 300 },
    });

    if (!shiprocketResponse.ok) {
      const errorData = await shiprocketResponse.json();
      console.error('Shiprocket API Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch tracking details from Shiprocket', details: errorData }, { status: shiprocketResponse.status });
    }

    const data = await shiprocketResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Shiprocket tracking data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
