"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TravelStatus } from "@/types";

// Standard Leaflet Icon fix for Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Custom colored circle marker icons
function createTravelerIcon(status: TravelStatus) {
  const color = status === "waiting" ? "#EF4444" : status === "in-progress" ? "#F59E0B" : "#22C55E";
  const pulse = status !== "done" ? `
    <div style="
      position:absolute; inset:-6px; border-radius:50%;
      background:${color}33;
      animation:leaflet-ping 1.4s ease-in-out infinite;
    "></div>` : "";
  
  const html = `
    <div style="position:relative; width:28px; height:28px;">
      ${pulse}
      <div style="
        width:28px; height:28px; border-radius:50%;
        background:${color};
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex; align-items:center; justify-content:center;
        position:relative; z-index:1;
      ">
        <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.9);"></div>
      </div>
    </div>`;

  return L.divIcon({ 
    html, 
    className: "", 
    iconSize: [28, 28], 
    iconAnchor: [14, 14], 
    popupAnchor: [0, -16] 
  });
}

// Inner component to adjust bounds automatically when travelers update
function MapController({ travelers }: { travelers: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (travelers.length === 0) return;
    const bounds = L.latLngBounds(travelers.map(t => [t.lat, t.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
  }, [travelers, map]);

  return null;
}

interface IndonesiaMapProps {
  travelers: any[];
  onStatusChange: (id: number, currentStatus: TravelStatus) => void;
}

export default function IndonesiaMap({ travelers, onStatusChange }: IndonesiaMapProps) {
  const statusLabel = (s: TravelStatus) => s === "waiting" ? "Menunggu" : s === "in-progress" ? "In-Progress" : "Selesai";
  const statusColor = (s: TravelStatus) => s === "waiting" ? "#EF4444" : s === "in-progress" ? "#F59E0B" : "#22C55E";

  useEffect(() => {
    const id = "leaflet-ping-style";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `@keyframes leaflet-ping { 0%,100%{transform:scale(1);opacity:0.6;} 50%{transform:scale(1.8);opacity:0;} }`;
    document.head.appendChild(s);
  }, []);

  const center: [number, number] = [-2.5, 118.0]; // center of Indonesia

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-border shadow-md" style={{ isolation: "isolate" }}>
      {/* Active count overlay badge */}
      <div className="absolute top-3 left-14 bg-white/95 backdrop-blur-xs border border-border rounded-xl px-3 py-2.5 shadow-sm" style={{ zIndex: 1001 }}>
        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Perjalanan Aktif</div>
        <div className="text-2xl font-black leading-none mt-0.5" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>
          {travelers.filter(t => t.status !== "done").length}
        </div>
      </div>

      {/* LIVE status dot overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-border rounded-full px-3 py-1.5 shadow-sm" style={{ zIndex: 1001 }}>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-green-700 tracking-wider">LIVE MONITOR</span>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-3 bg-white/95 backdrop-blur-xs border border-border rounded-xl p-3.5 shadow-sm max-w-[200px]" style={{ zIndex: 1001 }}>
        <div className="text-[9px] font-black tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>STATUS PIN</div>
        <div className="space-y-1.5">
          {(["waiting", "in-progress", "done"] as TravelStatus[]).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColor(s) }} />
              <span className="text-[10px] text-muted-foreground font-medium capitalize">{statusLabel(s)}</span>
              <span className="ml-auto text-[10px] font-bold" style={{ color: statusColor(s) }}>
                {travelers.filter(t => t.status === s).length}
              </span>
            </div>
          ))}
        </div>
        <div className="text-[8px] text-muted-foreground/60 mt-2 border-t border-border pt-1.5 leading-normal">
          Klik pin marker untuk memperbarui status
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <>
          {/* Satellite-style tile layer from Esri */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {/* Labels on top of satellite */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            opacity={0.8}
          />

          <MapController travelers={travelers} />

          {travelers.map(t => (
            <Marker
              key={t.id}
              position={[t.lat, t.lng]}
              icon={createTravelerIcon(t.status)}
            >
              <Popup>
                <div style={{ minWidth: 170, fontFamily: "Montserrat, sans-serif" }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#111", marginBottom: 3 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 1 }}>{t.service}</div>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>📍 {t.location}</div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(t.status) }} />
                    <span style={{ fontWeight: 700, fontSize: 11, color: statusColor(t.status) }}>{statusLabel(t.status)}</span>
                  </div>

                  <button
                    onClick={() => onStatusChange(t.id, t.status)}
                    style={{
                      marginTop: 6, width: "100%", padding: "6px 0", borderRadius: 8,
                      background: "#800000", color: "white", border: "none",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  >
                    Ubah Status Perjalanan
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      </MapContainer>
    </div>
  );
}
