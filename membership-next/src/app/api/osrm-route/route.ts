import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for OSRM — avoids CORS issues when called from browser
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startLng = searchParams.get("startLng");
  const startLat = searchParams.get("startLat");
  const endLng = searchParams.get("endLng");
  const endLat = searchParams.get("endLat");

  if (!startLng || !startLat || !endLng || !endLat) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(osrmUrl, {
      headers: { "User-Agent": "RanataTour/1.0" },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!res.ok) {
      return NextResponse.json({ error: `OSRM error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60", // cache 60s per route segment
      },
    });
  } catch (err: any) {
    console.error("[OSRM proxy] fetch failed:", err?.message);
    return NextResponse.json({ error: "OSRM unreachable" }, { status: 502 });
  }
}
