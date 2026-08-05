"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TripStep {
  id: number;
  label: string;
  status: "waiting" | "in-progress" | "done";
  officer?: string;
  time?: string;
  driver_lat?: number | string | null;
  driver_lng?: number | string | null;
}

export interface TripTraveler {
  id: number;
  name: string;
  service: string;
  status: "waiting" | "in-progress" | "done";
  activeStep?: {
    label: string;
    status: string;
    officer?: string;
    time?: string;
    driverLat?: number | string | null;
    driverLng?: number | string | null;
  } | null;
  lat: number;
  lng: number;
  userLat?: number | null;
  userLng?: number | null;
  userCity?: string;
  userAddress?: string;
  steps?: TripStep[];
}

interface RouteResult {
  path: [number, number][];
  distanceM: number;
  durationS: number;
  fetchedAt: number;
}

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bearing in degrees from point A to point B */
function bearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Find nearest index in path array to given lat/lng */
function nearestPathIdx(path: [number, number][], lat: number, lng: number) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(path[i][0], path[i][1], lat, lng);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

function formatETA(seconds: number) {
  if (seconds <= 60) return "< 1 menit";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} menit`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h} jam ${rem} menit` : `${h} jam`;
}

function formatDist(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

// ─── City coords lookup ───────────────────────────────────────────────────────

const CITIES: Record<string, [number, number]> = {
  jakarta: [-6.2088, 106.8456], bogor: [-6.5971, 106.806], depok: [-6.4025, 106.7942],
  tangerang: [-6.1783, 106.6319], bekasi: [-6.2383, 106.9756], bandung: [-6.9175, 107.6191],
  surabaya: [-7.2575, 112.7521], semarang: [-6.9667, 110.4167], yogyakarta: [-7.7956, 110.3695],
  jogja: [-7.7956, 110.3695], solo: [-7.5755, 110.8243], malang: [-7.9666, 112.6326],
  denpasar: [-8.6705, 115.2126], bali: [-8.4095, 115.1889], medan: [3.5952, 98.6722],
  makassar: [-5.1477, 119.4327], palembang: [-2.9909, 104.7567], balikpapan: [-1.2654, 116.8312],
  pontianak: [-0.0263, 109.3425], manado: [1.4748, 124.8428], padang: [-0.9471, 100.4172],
  batam: [1.0901, 104.0301],
};

function cityCoords(city?: string, address?: string): [number, number] {
  const k = (city || "").toLowerCase().trim();
  if (k && CITIES[k]) return CITIES[k];
  for (const [name, c] of Object.entries(CITIES)) {
    if ((address || "").toLowerCase().includes(name)) return c;
  }
  return [-6.2088, 106.8456];
}

function destCoords(t: TripTraveler): [number, number] {
  if (t.userLat && t.userLng) return [Number(t.userLat), Number(t.userLng)];
  return cityCoords(t.userCity, t.userAddress);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function makeDriverIcon(brg: number, label: string, etaS: number, distM: number) {
  const html = `
  <div style="position:relative;width:44px;height:44px;">
    <div style="position:absolute;bottom:52px;left:50%;transform:translateX(-50%);
      background:#fff;border:2px solid #DC2626;border-radius:10px;
      padding:5px 10px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.18);
      font-family:'Inter',sans-serif;text-align:center;z-index:200;">
      <div style="font-weight:800;font-size:10px;color:#DC2626;text-transform:uppercase;letter-spacing:.5px">${label}</div>
      <div style="font-size:9px;color:#555;font-weight:600;margin-top:2px">⏱ ${formatETA(etaS)} · ${formatDist(distM)}</div>
      <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
        border:5px solid transparent;border-top-color:#fff;"></div>
      <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);
        border:6px solid transparent;border-top-color:#DC2626;"></div>
    </div>
    <div style="position:absolute;inset:-8px;border-radius:50%;background:#DC262622;animation:drv-pulse 1.4s ease-in-out infinite;"></div>
    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#DC2626,#B91C1C);
      border:3px solid #fff;box-shadow:0 4px 14px rgba(220,38,38,.5);
      display:flex;align-items:center;justify-content:center;position:relative;z-index:1;">
      <div style="font-size:20px;transform:rotate(${brg}deg);transition:transform .4s ease;">🚌</div>
    </div>
  </div>`;
  return L.divIcon({ html, className: "", iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -28] });
}

function makeDestIcon(label: string) {
  const html = `
  <div style="position:relative;width:36px;height:36px;">
    <div style="position:absolute;bottom:44px;left:50%;transform:translateX(-50%);
      background:#1D4ED8;color:#fff;border-radius:8px;padding:4px 8px;
      white-space:nowrap;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;
      box-shadow:0 2px 8px rgba(0,0,0,.2);z-index:200;">
      📍 ${label}
      <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);
        border:4px solid transparent;border-top-color:#1D4ED8;"></div>
    </div>
    <div style="width:36px;height:36px;border-radius:50%;background:#1D4ED8;
      border:3px solid #fff;box-shadow:0 3px 10px rgba(29,78,216,.4);
      display:flex;align-items:center;justify-content:center;font-size:16px;position:relative;z-index:1;">🏠</div>
  </div>`;
  return L.divIcon({ html, className: "", iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22] });
}

function injectStyles() {
  const id = "atm-styles";
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
    @keyframes drv-pulse{0%,100%{transform:scale(1);opacity:.5;}50%{transform:scale(1.9);opacity:0;}}
    @keyframes atm-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  `;
  document.head.appendChild(s);
}

// ─── Map auto-fit ─────────────────────────────────────────────────────────────

function MapFit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) { map.setView(points[0], 14); return; }
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 15, animate: true });
  }, [map, JSON.stringify(points)]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  travelers: TripTraveler[];
  selectedId?: number | null;
}

export default function AdminTrackingMap({ travelers, selectedId }: Props) {
  const [routes, setRoutes] = useState<Record<string, RouteResult>>({});
  const routeFetching = useRef<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

  // Inject animation keyframes once
  useEffect(() => { injectStyles(); }, []);

  // Tick every 3s to refresh ETA display
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  // Fetch snap-to-road route via server-side proxy
  const fetchRoute = useCallback(async (key: string, sLat: number, sLng: number, dLat: number, dLng: number) => {
    if (routeFetching.current.has(key)) return;
    routeFetching.current.add(key);
    try {
      const url = `/api/osrm-route?startLat=${sLat}&startLng=${sLng}&endLat=${dLat}&endLng=${dLng}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`proxy ${res.status}`);
      const data = await res.json();
      const coords: [number, number][] = data.routes?.[0]?.geometry?.coordinates?.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number]
      ) ?? [];
      if (coords.length < 2) throw new Error("empty geometry");
      setRoutes(prev => ({
        ...prev,
        [key]: {
          path: coords,
          distanceM: (data.routes[0].distance ?? 0) * 1000,
          durationS: data.routes[0].duration ?? 0,
          fetchedAt: Date.now(),
        }
      }));
    } catch (e) {
      console.warn("[AdminTrackingMap] route fetch failed:", e);
    } finally {
      routeFetching.current.delete(key);
    }
  }, []);

  // For each in-progress traveler, fetch/refresh route when driver moves >50m
  useEffect(() => {
    for (const t of travelers) {
      if (t.activeStep?.status !== "in-progress") continue;
      const [dLat, dLng] = destCoords(t);
      const driverLat = t.activeStep.driverLat ? Number(t.activeStep.driverLat) : null;
      const driverLng = t.activeStep.driverLng ? Number(t.activeStep.driverLng) : null;

      // Round to 3dp (~111m) so key changes when driver moves ~50m
      const sLat = driverLat ? Math.round(driverLat * 1000) / 1000 : -6.9025;
      const sLng = driverLng ? Math.round(driverLng * 1000) / 1000 : 107.5754;
      const key = `${t.id}:${sLat},${sLng}→${dLat.toFixed(4)},${dLng.toFixed(4)}`;

      if (!routes[key]) {
        fetchRoute(key, sLat, sLng, dLat, dLng);
      }
    }
  }, [travelers, fetchRoute]);

  // Build all fit points
  const fitPoints: [number, number][] = [];
  const target = selectedId ? travelers.find(t => t.id === selectedId) : null;
  const display = target ? [target] : travelers.filter(t => t.status !== "done");
  if (!display.length && travelers.length) display.push(...travelers.slice(0, 1));

  for (const t of display) {
    const [dLat, dLng] = destCoords(t);
    fitPoints.push([dLat, dLng]);
    if (t.activeStep?.driverLat && t.activeStep?.driverLng) {
      fitPoints.push([Number(t.activeStep.driverLat), Number(t.activeStep.driverLng)]);
    }
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: 480 }}>
      {/* LIVE badge */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur border border-border rounded-full px-3 py-1 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-emerald-700 tracking-wider">LIVE</span>
      </div>

      {/* Active trips count */}
      <div className="absolute top-3 left-14 z-[1000] bg-white/95 backdrop-blur border border-border rounded-xl px-3 py-2 shadow-sm">
        <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Aktif</div>
        <div className="text-xl font-black leading-none" style={{ color: "#800000", fontFamily: "Montserrat,sans-serif" }}>
          {travelers.filter(t => t.status !== "done").length}
        </div>
      </div>

      <MapContainer
        center={[-6.9025, 107.5754]}
        zoom={12}
        style={{ width: "100%", height: "100%" }}
        zoomControl
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapFit points={fitPoints} />

        {display.map(t => {
          const [dLat, dLng] = destCoords(t);
          const stepLabel = t.activeStep?.label || "";
          const isActive = t.activeStep?.status === "in-progress";
          const driverLat = t.activeStep?.driverLat ? Number(t.activeStep.driverLat) : null;
          const driverLng = t.activeStep?.driverLng ? Number(t.activeStep.driverLng) : null;

          const sLat = driverLat ? Math.round(driverLat * 1000) / 1000 : -6.9025;
          const sLng = driverLng ? Math.round(driverLng * 1000) / 1000 : 107.5754;
          const key = `${t.id}:${sLat},${sLng}→${dLat.toFixed(4)},${dLng.toFixed(4)}`;
          const route = routes[key];

          // Vehicle actual position (real GPS or route start)
          const vLat = driverLat ?? sLat;
          const vLng = driverLng ?? sLng;

          // Progress split: traveled (grey) vs remaining (red)
          let traveledPath: [number, number][] = [];
          let remainingPath: [number, number][] = [[vLat, vLng], [dLat, dLng]];
          let remainingDistM = haversineKm(vLat, vLng, dLat, dLng) * 1000;
          let remainingDurS = remainingDistM / (40 / 3.6);

          if (route && route.path.length > 1) {
            const nearestIdx = driverLat ? nearestPathIdx(route.path, vLat, vLng) : 0;
            traveledPath = route.path.slice(0, nearestIdx + 1);
            remainingPath = route.path.slice(nearestIdx);

            // Recalc ETA from remaining road distance
            let rd = 0;
            for (let i = nearestIdx; i < route.path.length - 1; i++) {
              rd += haversineKm(route.path[i][0], route.path[i][1], route.path[i+1][0], route.path[i+1][1]) * 1000;
            }
            remainingDistM = rd;
            remainingDurS = rd / (40 / 3.6);
          }

          // Vehicle heading: use last 2 path points or driver→dest
          let brg = 0;
          if (remainingPath.length >= 2) {
            brg = bearing(remainingPath[0][0], remainingPath[0][1], remainingPath[1][0], remainingPath[1][1]);
          }

          const vLabel = stepLabel.includes("Rumah") || stepLabel.includes("Jemput")
            ? "DALAM PERJALANAN" : "DALAM PERJALANAN";

          return (
            <div key={t.id}>
              {/* Destination pin */}
              <Marker position={[dLat, dLng]} icon={makeDestIcon(t.name)} />

              {/* Traveled segment (dimmed) */}
              {traveledPath.length > 1 && (
                <Polyline positions={traveledPath} color="#DC2626" weight={5} opacity={0.2} />
              )}

              {/* Remaining road route (bright red) */}
              {isActive && remainingPath.length > 1 && (
                <Polyline positions={remainingPath} color="#DC2626" weight={5} opacity={0.85} />
              )}

              {/* Driver vehicle marker */}
              {isActive && (
                <Marker
                  position={[vLat, vLng]}
                  icon={makeDriverIcon(brg, vLabel, remainingDurS, remainingDistM)}
                />
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
