"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
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

// Coordinate map for major cities in Indonesia
const cityCoordinatesMap: Record<string, { lat: number; lng: number }> = {
  jakarta: { lat: -6.2088, lng: 106.8456 },
  bogor: { lat: -6.5971, lng: 106.8060 },
  depok: { lat: -6.4025, lng: 106.7942 },
  tangerang: { lat: -6.1783, lng: 106.6319 },
  bekasi: { lat: -6.2383, lng: 106.9756 },
  bandung: { lat: -6.9175, lng: 107.6191 },
  surabaya: { lat: -7.2575, lng: 112.7521 },
  semarang: { lat: -6.9667, lng: 110.4167 },
  yogyakarta: { lat: -7.7956, lng: 110.3695 },
  jogja: { lat: -7.7956, lng: 110.3695 },
  solo: { lat: -7.5755, lng: 110.8243 },
  malang: { lat: -7.9666, lng: 112.6326 },
  denpasar: { lat: -8.6705, lng: 115.2126 },
  bali: { lat: -8.4095, lng: 115.1889 },
  medan: { lat: 3.5952, lng: 98.6722 },
  makassar: { lat: -5.1477, lng: 119.4327 },
  palembang: { lat: -2.9909, lng: 104.7567 },
  balikpapan: { lat: -1.2654, lng: 116.8312 },
  samarinda: { lat: -0.5022, lng: 117.1536 },
  banjarmasin: { lat: -3.3186, lng: 114.5944 },
  pontianak: { lat: -0.0263, lng: 109.3425 },
  manado: { lat: 1.4748, lng: 124.8428 },
  padang: { lat: -0.9471, lng: 100.4172 },
  pekanbaru: { lat: 0.5071, lng: 101.4478 },
  lampung: { lat: -5.4498, lng: 105.2664 },
  batam: { lat: 1.0901, lng: 104.0301 },
};

// Resolve customer coordinates: prefer exact GPS, fall back to city lookup
const getCustomerCoords = (t: any) => {
  // 1. Use exact GPS coordinates if available
  if (t.userLat && t.userLng) {
    return { lat: t.userLat, lng: t.userLng, isGPS: true };
  }
  // 2. Fall back to city/address name lookup
  const coords = getCoordinatesForCity(t.userCity || "", t.userAddress || "");
  return { ...coords, isGPS: false };
};

const getCoordinatesForCity = (city: string, address: string) => {
  const defaultCoords = { lat: -6.2088, lng: 106.8456 }; // Jakarta
  const cleanCity = (city || "").toLowerCase().trim();
  const cleanAddress = (address || "").toLowerCase().trim();
  
  if (cleanCity && cityCoordinatesMap[cleanCity]) {
    return cityCoordinatesMap[cleanCity];
  }
  for (const [cityName, coords] of Object.entries(cityCoordinatesMap)) {
    if (cleanAddress.includes(cityName)) {
      return coords;
    }
  }
  return defaultCoords;
};

const getCoordinatesForHub = (city: string) => {
  const clean = (city || "").toLowerCase().trim();
  if (clean.includes("bali") || clean.includes("denpasar")) {
    return { lat: -8.748, lng: 115.167 }; // DPS Airport
  }
  // Default to CGK Airport for Jakarta and nearby regions
  return { lat: -6.125, lng: 106.656 };
};

// Custom colored circle marker icons
function createHomeIcon() {
  const html = `
    <div style="position:relative; width:34px; height:34px;">
      <div style="
        position:absolute; inset:-4px; border-radius:50%;
        background:#EF444422;
        animation:leaflet-ping 2s ease-in-out infinite;
      "></div>
      <div style="
        width:34px; height:34px; border-radius:50%;
        background:#EF4444;
        border:3px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
        color: white; font-size: 15px;
        position:relative; z-index:1;
      ">
        🏠
      </div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
}

function createVehicleIcon(type: "shuttle" | "flight" = "shuttle") {
  const emoji = type === "flight" ? "✈️" : "🚗";
  const html = `
    <div style="position:relative; width:36px; height:36px;">
      <div style="
        position:absolute; inset:-6px; border-radius:50%;
        background:#F59E0B33;
        animation:leaflet-ping 1.2s ease-in-out infinite;
      "></div>
      <div style="
        width:36px; height:36px; border-radius:50%;
        background:#F59E0B;
        border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.4);
        display:flex; align-items:center; justify-content:center;
        color: white; font-size: 17px;
        position:relative; z-index:1;
      ">
        ${emoji}
      </div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20] });
}

function createAirportIcon() {
  const html = `
    <div style="position:relative; width:34px; height:34px;">
      <div style="
        width:34px; height:34px; border-radius:50%;
        background:#3B82F6;
        border:3px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
        color: white; font-size: 15px;
        position:relative; z-index:1;
      ">
        🛫
      </div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
}

function createHotelIcon() {
  const html = `
    <div style="position:relative; width:34px; height:34px;">
      <div style="
        width:34px; height:34px; border-radius:50%;
        background:#8B5CF6;
        border:3px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
        color: white; font-size: 15px;
        position:relative; z-index:1;
      ">
        🏨
      </div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
}

// Inner component to adjust bounds automatically when travelers update
function MapController({ travelers, progress }: { travelers: any[]; progress: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (travelers.length === 0) return;
    
    // Use exact GPS coordinates when available, fall back to city lookup
    const points: [number, number][] = travelers.map(t => {
      const coords = getCustomerCoords(t);
      return [coords.lat, coords.lng];
    });

    // Also include airport hub if traveler step is in-progress
    travelers.forEach(t => {
      if (t.activeStep && t.activeStep.status === "in-progress") {
        const hub = getCoordinatesForHub(t.userCity || "");
        points.push([hub.lat, hub.lng]);
        if (t.activeStep.label?.includes("Flight")) {
          points.push([-8.748, 115.167]); // Include Bali airport too
        }
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      // Use tighter zoom (15) when we have exact GPS, looser (13) for city approximation
      const hasGPS = travelers.some(t => t.userLat && t.userLng);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: hasGPS ? 15 : 13 });
    }
  }, [travelers, map]);

  return null;
}

interface IndonesiaMapProps {
  travelers: any[];
  onStatusChange: (id: number, currentStatus: TravelStatus) => void;
}

export default function IndonesiaMap({ travelers, onStatusChange }: IndonesiaMapProps) {
  const [progress, setProgress] = useState<number>(0);

  // Set up vehicle move animation interval if there is an active tracking step in progress
  useEffect(() => {
    const hasActiveProgress = travelers.some(
      t => t.activeStep && t.activeStep.status === "in-progress"
    );

    if (!hasActiveProgress) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0; // Loop back
        return prev + 1; // 1% steps
      });
    }, 250);

    return () => clearInterval(interval);
  }, [travelers]);

  useEffect(() => {
    const id = "leaflet-ping-style";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `@keyframes leaflet-ping { 0%,100%{transform:scale(1);opacity:0.6;} 50%{transform:scale(1.8);opacity:0;} }`;
    document.head.appendChild(s);
  }, []);

  const center: [number, number] = [-6.2088, 106.8456]; // default centered on Jakarta

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-border shadow-md" style={{ isolation: "isolate" }}>
      {/* Active count overlay badge */}
      <div className="absolute top-3 left-14 bg-white/95 backdrop-blur-xs border border-border rounded-xl px-3 py-2 shadow-xs" style={{ zIndex: 1001 }}>
        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Perjalanan Aktif</div>
        <div className="text-2xl font-black leading-none mt-0.5" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>
          {travelers.filter(t => t.status !== "done").length}
        </div>
      </div>

      {/* LIVE status dot overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-border rounded-full px-3 py-1 shadow-xs" style={{ zIndex: 1001 }}>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-green-700 tracking-wider">LIVE MONITOR</span>
      </div>

      {/* ETA overlay panel for active tracking */}
      {travelers.some(t => t.activeStep && t.activeStep.status === "in-progress") && (
        <div className="absolute bottom-4 right-3 bg-white/95 backdrop-blur-xs border border-border rounded-xl p-3 shadow-sm max-w-[240px]" style={{ zIndex: 1001 }}>
          <div className="text-[9px] font-black tracking-widest text-amber-600 mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
            ESTIMASI PENJEMPUTAN
          </div>
          <div className="text-xs font-bold text-foreground leading-normal">
            Driver sedang meluncur ke lokasi Anda.
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <span>⏱️ ETA: {Math.max(5, 30 - Math.floor(progress * 0.3))} menit</span>
            <span>•</span>
            <span>📍 Jarak: {Math.max(1, 15 - Math.floor(progress * 0.15))} km</span>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={12}
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
            opacity={0.85}
          />

          <MapController travelers={travelers} progress={progress} />

          {travelers.map(t => {
            const stepLabel = t.activeStep?.label || "";
            const stepStatus = t.activeStep?.status || "waiting";
            
            // Use real GPS coordinates if available, fallback to city lookup
            const customerCoordsRaw = getCustomerCoords(t);
            const customerCoords = { lat: customerCoordsRaw.lat, lng: customerCoordsRaw.lng };
            const isGPSAccurate = customerCoordsRaw.isGPS;
            
            // Determine coordinate states
            let hubCoords = getCoordinatesForHub(t.userCity || "");
            let destinationCoords = customerCoords;
            let drawRoute = false;
            let trackType: "shuttle" | "flight" = "shuttle";
            let vehicleCoords = hubCoords;

            if (stepLabel.includes("Rumah")) {
              // Shuttle picks up user at home and takes them to the local Hub
              hubCoords = getCoordinatesForHub(t.userCity || "");
              destinationCoords = customerCoords;
              drawRoute = stepStatus === "in-progress";
              trackType = "shuttle";
              
              if (stepStatus === "in-progress") {
                // Vehicle moves from local Hub to Customer home
                vehicleCoords = {
                  lat: hubCoords.lat + (destinationCoords.lat - hubCoords.lat) * (progress / 100),
                  lng: hubCoords.lng + (destinationCoords.lng - hubCoords.lng) * (progress / 100),
                };
              }
            } else if (stepLabel.includes("CGK") || stepLabel.includes("Flight") || stepLabel.includes("Penerbangan")) {
              // Airplane goes from CGK (Jakarta) to DPS (Bali)
              hubCoords = { lat: -6.125, lng: 106.656 }; // CGK Airport
              destinationCoords = { lat: -8.748, lng: 115.167 }; // DPS Airport
              drawRoute = true;
              trackType = "flight";
              
              if (stepStatus === "in-progress") {
                vehicleCoords = {
                  lat: hubCoords.lat + (destinationCoords.lat - hubCoords.lat) * (progress / 100),
                  lng: hubCoords.lng + (destinationCoords.lng - hubCoords.lng) * (progress / 100),
                };
              } else {
                vehicleCoords = hubCoords;
              }
            } else if (stepLabel.includes("DPS") || stepLabel.includes("Jemput")) {
              // Shuttle picks up from DPS Airport and drives to Hotel Partner
              hubCoords = { lat: -8.748, lng: 115.167 }; // DPS Airport
              destinationCoords = { lat: -8.798, lng: 115.228 }; // Hotel Partner
              drawRoute = true;
              trackType = "shuttle";
              
              if (stepStatus === "in-progress") {
                vehicleCoords = {
                  lat: hubCoords.lat + (destinationCoords.lat - hubCoords.lat) * (progress / 100),
                  lng: hubCoords.lng + (destinationCoords.lng - hubCoords.lng) * (progress / 100),
                };
              } else {
                vehicleCoords = hubCoords;
              }
            } else if (stepLabel.includes("Hotel") || stepLabel.includes("Check-in")) {
              // Reached Hotel Partner
              hubCoords = { lat: -8.798, lng: 115.228 };
              destinationCoords = { lat: -8.798, lng: 115.228 };
              drawRoute = false;
              trackType = "shuttle";
            }

            return (
              <div key={t.id}>
                {/* 1. Customer Location Marker */}
                <Marker
                  position={[customerCoords.lat, customerCoords.lng]}
                  icon={stepLabel.includes("Hotel") ? createHotelIcon() : createHomeIcon()}
                >
                  <Popup>
                    <div style={{ minWidth: 200, fontFamily: "Montserrat, sans-serif" }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#111", marginBottom: 4 }}>{t.name} (Customer)</div>
                      <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>🏠 {t.userAddress || "Belum diatur"}</div>
                      <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>🏙️ {t.userCity || "Belum diatur"}</div>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: isGPSAccurate ? "#dcfce7" : "#fff7ed",
                        color: isGPSAccurate ? "#15803d" : "#c2410c",
                        border: `1px solid ${isGPSAccurate ? "#86efac" : "#fed7aa"}`,
                        borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700,
                      }}>
                        {isGPSAccurate ? "📍 GPS Akurat" : "📍 Perkiraan Kota"}
                      </div>
                      {isGPSAccurate && (
                        <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
                          {t.userLat?.toFixed(6)}, {t.userLng?.toFixed(6)}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* 2. Start Hub Marker (Only show if tracking or active route) */}
                {drawRoute && (
                  <Marker
                    position={[hubCoords.lat, hubCoords.lng]}
                    icon={trackType === "flight" ? createAirportIcon() : createAirportIcon()}
                  >
                    <Popup>
                      <div style={{ minWidth: 160, fontFamily: "Montserrat, sans-serif" }}>
                        <div style={{ fontWeight: 800, fontSize: 12, color: "#111" }}>Titk Asal Hub</div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                          {trackType === "flight" ? "Terminal 3 Bandara CGK" : "Hub Operasional Ranata Tour"}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* 3. Polyline Route between Hub and Destination */}
                {drawRoute && (
                  <Polyline
                    positions={[
                      [hubCoords.lat, hubCoords.lng],
                      [destinationCoords.lat, destinationCoords.lng]
                    ]}
                    color="#F59E0B"
                    weight={4}
                    opacity={0.8}
                    dashArray="8, 8"
                  />
                )}

                {/* 4. Active Vehicle Marker (Only show if step is in-progress) */}
                {stepStatus === "in-progress" && (
                  <Marker
                    position={[vehicleCoords.lat, vehicleCoords.lng]}
                    icon={createVehicleIcon(trackType)}
                  >
                    <Popup>
                      <div style={{ minWidth: 180, fontFamily: "Montserrat, sans-serif" }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#d97706", marginBottom: 4 }}>
                          {trackType === "flight" ? "✈️ Penerbangan Live" : "🚗 Driver Ranata Tour"}
                        </div>
                        <div style={{ fontSize: 11, color: "#333", fontWeight: 600 }}>{stepLabel}</div>
                        <div style={{ fontSize: 11, color: "#666" }}>Petugas: {t.activeStep?.officer || "Driver Lapangan"}</div>
                        <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>Estimasi: {Math.max(5, 30 - Math.floor(progress * 0.3))} menit lagi</div>
                        
                        <button
                          onClick={() => onStatusChange(t.id, t.status)}
                          style={{
                            marginTop: 8, width: "100%", padding: "6px 0", borderRadius: 8,
                            background: "#800000", color: "white", border: "none",
                            fontSize: 11, fontWeight: 700, cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                          }}
                        >
                          Ubah Status Operasional
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </div>
            );
          })}
        </>
      </MapContainer>
    </div>
  );
}
