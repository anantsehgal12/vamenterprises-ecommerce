import { NextResponse } from "next/server";
import { db } from "@/src/db"; // Update this import path if your db instance is located elsewhere
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Dynamically fetch the enum values from the PostgreSQL database
    const result = await db.execute(
      sql`SELECT unnest(enum_range(NULL::tax_rate_enum))::text AS rate`
    );

    // Extract the rate values into a simple array of strings.
    // (Handles both 'pg' and 'postgres.js' driver response formats)
    const taxRates = result.rows ? result.rows.map((row: any) => row.rate) : result.map((row: any) => row.rate);

    return NextResponse.json(taxRates);
  } catch (error) {
    console.error("Error fetching tax rates from DB:", error);
    
    // Safe fallback in case the enum isn't created yet or there's a DB connection issue
    const fallbackRates = ["5", "12", "18", "20", "40"];
    return NextResponse.json(fallbackRates);
  }
}