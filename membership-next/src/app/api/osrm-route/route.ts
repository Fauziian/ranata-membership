import { NextRequest, NextResponse } from "next/server";

// ─── Polyline decoders ────────────────────────────────────────────────────────

/** Decode Valhalla precision-6 encoded polyline → [lat, lng][] */
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

async function withTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(tid);
    return r;
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}

// ─── Standard response shape ──────────────────────────────────────────────────
// routes[0].geometry.coordinates = [[lng,lat],…] (GeoJSON)
// routes[0].distance = meters
// routes[0].duration = seconds

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const sLat = parseFloat(sp.get("startLat") ?? "");
  const sLng = parseFloat(sp.get("startLng") ?? "");
  const eLat = parseFloat(sp.get("endLat") ?? "");
  const eLng = parseFloat(sp.get("endLng") ?? "");

  if ([sLat, sLng, eLat, eLng].some(isNaN)) {
    return NextResponse.json({ error: "Missing/invalid coordinates" }, { status: 400 });
  }

  // ── 1. Valhalla (OSM.de) ──────────────────────────────────────────────────
  try {
    const body = {
      locations: [{ lon: sLng, lat: sLat }, { lon: eLng, lat: eLat }],
      costing: "auto",
      directions_options: { units: "kilometers" },
    };
    const res = await withTimeout("https://valhalla.openstreetmap.de/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, 9000);

    if (res.ok) {
      const data = await res.json();
      const shape = data?.trip?.legs?.[0]?.shape;
      if (shape) {
        const coords = decodePolyline6(shape);
        const distM = (data.trip.summary?.length ?? 0) * 1000; // km→m
        const durS = data.trip.summary?.time ?? 0;
        return NextResponse.json({
          routes: [{
            geometry: { type: "LineString", coordinates: coords.map(([lat, lng]) => [lng, lat]) },
            distance: distM,   // meters
            duration: durS,    // seconds
          }]
        }, { headers: { "Cache-Control": "public, max-age=60" } });
      }
    }
  } catch (e) {
    console.warn("[osrm-route] Valhalla failed:", (e as Error).message);
  }

  // ── 2. OSRM project-osrm.org ──────────────────────────────────────────────
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
    const res = await withTimeout(url, { headers: { "User-Agent": "RanataTour/1.0" } }, 8000);
    if (res.ok) {
      const data = await res.json();
      if (data.routes?.length) {
        // OSRM returns distance in meters and duration in seconds natively
        return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=60" } });
      }
    }
  } catch (e) {
    console.warn("[osrm-route] OSRM project-osrm.org failed:", (e as Error).message);
  }

  // ── 3. OSRM openstreetmap.de ─────────────────────────────────────────────
  try {
    const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
    const res = await withTimeout(url, {}, 8000);
    if (res.ok) {
      const data = await res.json();
      if (data.routes?.length) {
        return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=60" } });
      }
    }
  } catch (e) {
    console.warn("[osrm-route] OSRM openstreetmap.de failed:", (e as Error).message);
  }

  return NextResponse.json({ error: "All routing engines failed" }, { status: 502 });
}
