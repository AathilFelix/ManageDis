import { NextResponse } from "next/server";
import { fetchAllDisasters } from "@/lib/real-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const disasters = await fetchAllDisasters();
    return NextResponse.json({ disasters, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ disasters: [], timestamp: Date.now() }, { status: 500 });
  }
}
