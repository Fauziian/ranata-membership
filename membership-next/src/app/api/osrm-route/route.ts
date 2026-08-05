import { NextRequest, NextResponse } from "next/server";

// Decode Valhalla/Google precision-6 encoded polyline → [lat, lng][]
function decodePolyline6(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e6, lng / 1e6]);
  }
  return coords;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(tid);
    return res;
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startLng = searchParams.get("startLng");
  const startLat = searchParams.get("startLat");
  const endLng = searchParams.get("endLng");
  const endLat = searchParams.get("endLat");

  if (!startLng || !startLat || !endLng || !endLat) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const sLat = parseFloat(startLat), sLng = parseFloat(startLng);
  const eLat = parseFloat(endLat), eLng = parseFloat(endLng);

  // ── 1. Valhalla (OpenStreetMap.de) – reliable, no API key, great Indonesia coverage ──
  try {
    const valhallaBody = {
      locations: [
        { lon: sLng, lat: sLat },
        { lon: eLng, lat: eLat },
      ],
      costing: "auto",
      directions_options: { units: "kilometers" },
    };
    const res = await fetchWithTimeout("https://valhalla.openstreetmap.de/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valhallaBody),
    }, 8000);

    if (res.ok) {
      const data = await res.json();
      const shape = data?.trip?.legs?.[0]?.shape;
      if (shape) {
        const coords = decodePolyline6(shape);
        // Return in OSRM-compatible GeoJSON format so client code stays the same
        return NextResponse.json({
          routes: [{
            geometry: {
              type: "LineString",
              coordinates: coords.map(([lat, lng]) => [lng, lat]),
            },
            distance: data.trip.summary?.length ?? 0,
            duration: data.trip.summary?.time ?? 0,
          }]
        }, { headers: { "Cache-Control": "public, max-age=30" } });
      }
    }
  } catch (e) {
    console.warn("[route] Valhalla failed:", (e as Error).message);
  }

  // ── 2. OSRM project-osrm.org fallback ──
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
    const res = await fetchWithTimeout(osrmUrl, { headers: { "User-Agent": "RanataTour/1.0" } }, 7000);
    if (res.ok) {
      const data = await res.json();
      if (data.routes?.length > 0) {
        return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=30" } });
      }
    }
  } catch (e) {
    console.warn("[route] OSRM project-osrm.org failed:", (e as Error).message);
  }

  // ── 3. OSRM OpenStreetMap.de fallback ──
  try {
    const osrmUrl2 = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
    const res = await fetchWithTimeout(osrmUrl2, {}, 7000);
    if (res.ok) {
      const data = await res.json();
      if (data.routes?.length > 0) {
        return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=30" } });
      }
    }
  } catch (e) {
    console.warn("[route] OSRM openstreetmap.de failed:", (e as Error).message);
  }

  return NextResponse.json({ error: "All routing engines failed" }, { status: 502 });
}
