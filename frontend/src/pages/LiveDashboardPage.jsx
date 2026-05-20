import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import { ArrowLeft, Building2, Expand, MapPin, PackageCheck, PackageSearch, Play, Radar, Square, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { officeName } from "../utils/logistics.js";
import { BrandHeader } from "../components/BrandHeader.jsx";
import { Metric } from "../components/Metric.jsx";
import { getGpsPositions, postGpsPosition } from "../api.js";

const BULGARIA_CENTER = [25.4858, 42.7339];
const BULGARIA_BOUNDS = [
  [22.137451, 41.211722],
  [28.839111, 44.465151],
];
const MAP_MIN_ZOOM = 5.6;
const MAP_MAX_ZOOM = 10.25;
const BG_CITIES = [
  [23.3219, 42.6977], // Sofia
  [24.7453, 42.1354], // Plovdiv
  [27.9147, 43.2141], // Varna
  [27.4626, 42.5048], // Burgas
  [25.9534, 43.8356], // Ruse
  [26.3228, 43.4997], // Shumen
  [25.6503, 42.4993], // Stara Zagora
  [25.3858, 43.8745], // Pleven
  [23.0976, 42.5030], // Pernik
  [27.8327, 43.5576], // Dobrich
];
const ACTIVE_STATUSES = new Set(["REGISTERED", "IN_TRANSIT", "READY_FOR_PICKUP"]);
const CITY_COORDINATES = {
  sofia: [23.3219, 42.6977],
  "софия": [23.3219, 42.6977],
  plovdiv: [24.7453, 42.1354],
  "пловдив": [24.7453, 42.1354],
  varna: [27.9147, 43.2141],
  "варна": [27.9147, 43.2141],
  burgas: [27.4626, 42.5048],
  "бургас": [27.4626, 42.5048],
  ruse: [25.9534, 43.8356],
  "русе": [25.9534, 43.8356],
};

let pmtilesProtocol;

function ensurePmtilesProtocol() {
  if (!pmtilesProtocol) {
    pmtilesProtocol = new Protocol();
    maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile);
  }
}

export function LiveDashboardPage({ data, session }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const mapWrapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const officeMarkersRef = useRef([]);
  const driverMarkersRef = useRef(new Map());
  const simPositionsRef = useRef({});
  const simRoutesRef = useRef({});
  const [mapError, setMapError] = useState("");
  const [gpsPositions, setGpsPositions] = useState({});
  const [simulating, setSimulating] = useState(false);
  const today = localDateKey();

  const live = useMemo(() => buildLiveData(data, today), [data, today]);

  // Map initialisation
  useEffect(() => {
    ensurePmtilesProtocol();
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: bulgariaStyle(),
      center: BULGARIA_CENTER,
      zoom: 6.65,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      maxBounds: BULGARIA_BOUNDS,
      attributionControl: false,
      renderWorldCopies: false,
    });
    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current.on("error", (event) => {
      setMapError(event.error?.message ?? t("live.mapError"));
    });

    return () => {
      officeMarkersRef.current.forEach((m) => m.remove());
      officeMarkersRef.current = [];
      driverMarkersRef.current.forEach((m) => m.remove());
      driverMarkersRef.current = new Map();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const resizeMap = () => mapRef.current?.resize();
    window.addEventListener("resize", resizeMap);
    document.addEventListener("fullscreenchange", resizeMap);

    let pixelRatioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const refreshPixelRatio = () => {
      resizeMap();
      pixelRatioQuery.removeEventListener("change", refreshPixelRatio);
      pixelRatioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      pixelRatioQuery.addEventListener("change", refreshPixelRatio);
    };
    pixelRatioQuery.addEventListener("change", refreshPixelRatio);

    return () => {
      window.removeEventListener("resize", resizeMap);
      document.removeEventListener("fullscreenchange", resizeMap);
      pixelRatioQuery.removeEventListener("change", refreshPixelRatio);
    };
  }, []);

  // Office markers — recreate when offices change
  useEffect(() => {
    if (!mapRef.current) return;
    officeMarkersRef.current.forEach((m) => m.remove());
    officeMarkersRef.current = live.offices.map((office) =>
      officeMarker(office).addTo(mapRef.current)
    );
  }, [live.offices]);

  // Driver markers — recreate when drivers change, positioned at last known GPS or computed coords
  useEffect(() => {
    if (!mapRef.current) return;
    driverMarkersRef.current.forEach((m) => m.remove());
    driverMarkersRef.current = new Map();
    live.drivers.forEach((driver) => {
      const gps = gpsPositions[driver.id];
      const coords = gps ? [gps.lng, gps.lat] : driver.coordinates;
      const marker = createDriverMarker(driver).setLngLat(coords).addTo(mapRef.current);
      driverMarkersRef.current.set(driver.id, marker);
    });
  }, [live.drivers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Move existing driver markers when GPS positions change — no marker recreation
  useEffect(() => {
    Object.entries(gpsPositions).forEach(([idStr, pos]) => {
      const marker = driverMarkersRef.current.get(Number(idStr));
      if (marker) marker.setLngLat([pos.lng, pos.lat]);
    });
  }, [gpsPositions]);

  // GPS polling every second
  useEffect(() => {
    const poll = async () => {
      try {
        const positions = await getGpsPositions();
        if (!Array.isArray(positions) || positions.length === 0) return;
        const byId = {};
        positions.forEach((p) => { byId[p.employeeId] = p; });
        setGpsPositions(byId);
      } catch { /* silent — GPS is optional */ }
    };
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, []);

  // Simulator: navigate each courier along real OSRM road routes
  useEffect(() => {
    if (!simulating || live.drivers.length === 0) return;

    const tick = async () => {
      await Promise.all(live.drivers.map(async (driver) => {
        const route = simRoutesRef.current[driver.id];

        if (!route || route.index >= route.coords.length - 1) {
          // Route exhausted — fetch a new one to a random Bulgarian city
          const current = simPositionsRef.current[driver.id] ?? {
            lat: driver.coordinates[1],
            lng: driver.coordinates[0],
          };
          const dest = BG_CITIES[Math.floor(Math.random() * BG_CITIES.length)];
          try {
            const coords = await fetchRoute(current.lng, current.lat, dest[0], dest[1]);
            const stepsPerTick = Math.max(1, Math.ceil(coords.length / 40));
            simRoutesRef.current[driver.id] = { coords, index: 0, stepsPerTick };
          } catch { /* OSRM unavailable — skip this tick */ }
          return;
        }

        route.index = Math.min(route.index + route.stepsPerTick, route.coords.length - 1);
        const [lng, lat] = route.coords[route.index];
        simPositionsRef.current[driver.id] = { lat, lng };
        try {
          await postGpsPosition(driver.id, lat, lng);
        } catch { /* silent */ }
      }));
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [simulating, live.drivers]);

  const toggleSimulation = () => {
    if (!simulating) {
      simPositionsRef.current = {};
      simRoutesRef.current = {};
    }
    setSimulating((s) => !s);
  };

  const fullscreenMap = async () => {
    if (!mapWrapRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await mapWrapRef.current.requestFullscreen();
    }
    setTimeout(() => mapRef.current?.resize(), 100);
  };

  return (
    <div>
      <header className="topbar">
        <BrandHeader eyebrow={t("live.eyebrow")} title={t("live.title")} />
        <div className="session-badge">
          <span>{session?.role}</span>
          <strong>{session?.username}</strong>
          <button type="button" className="secondary" onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> {t("common.back")}
          </button>
        </div>
      </header>

      <main className="shell live-shell">
        <section className="metrics">
          <Metric value={live.totals.todayReceived} label={t("live.receivedToday")} />
          <Metric value={live.totals.todayToReceive} label={t("live.toReceiveToday")} />
          <Metric value={live.totals.totalInStorage} label={t("live.inStorage")} />
          <Metric value={live.drivers.length} label={t("live.drivers")} />
        </section>

        <section className="live-grid">
          <div className="live-map-wrap" ref={mapWrapRef}>
            <button type="button" className="map-fullscreen" onClick={fullscreenMap} aria-label={t("live.fullscreenLabel")}>
              <Expand size={16} /> {t("live.fullscreen")}
            </button>
            <div className="live-map" ref={mapContainerRef} aria-label={t("live.mapLabel")} />
            {mapError && <div className="map-error">{mapError}</div>}
          </div>

          <div className="live-side">
            <LivePanel title={t("live.offices")} icon={Building2}>
              {live.offices.map((office) => (
                <article className="live-office" key={office.id}>
                  <div>
                    <strong>{office.address}</strong>
                    <span>{office.city}</span>
                  </div>
                  <div className="live-counts">
                    <span><PackageCheck size={14} /> {office.todayReceived}</span>
                    <span><PackageSearch size={14} /> {office.todayToReceive}</span>
                    <span><MapPin size={14} /> {office.totalInStorage}</span>
                  </div>
                </article>
              ))}
            </LivePanel>

            <LivePanel title={t("live.drivers")} icon={Truck}>
              {live.drivers.map((driver) => {
                const gps = gpsPositions[driver.id];
                return (
                  <article className="live-driver" key={driver.id}>
                    <div>
                      <strong>{driver.name}</strong>
                      <span>{officeName(data, driver.officeId)}</span>
                    </div>
                    <div className="live-counts">
                      <span><Radar size={14} /> {driver.activeDeliveries}</span>
                      <span><PackageCheck size={14} /> {driver.deliveredToday}</span>
                    </div>
                    {gps && (
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                        {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
                      </span>
                    )}
                  </article>
                );
              })}
            </LivePanel>

            <LivePanel title={t("live.simulator")} icon={Radar}>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
                {live.drivers.length === 0
                  ? t("live.simNoDrivers")
                  : simulating
                    ? t("live.simRunning", { count: live.drivers.length })
                    : t("live.simDescription")}
              </p>
              <button
                onClick={toggleSimulation}
                disabled={live.drivers.length === 0}
                className={simulating ? "secondary" : ""}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {simulating ? <><Square size={14} /> {t("live.simStop")}</> : <><Play size={14} /> {t("live.simStart")}</>}
              </button>
            </LivePanel>
          </div>
        </section>
      </main>
    </div>
  );
}

function LivePanel({ title, icon: Icon, children }) {
  return (
    <section className="panel live-panel">
      <h3><Icon size={18} /> {title}</h3>
      <div className="live-list">{children}</div>
    </section>
  );
}

function buildLiveData(data, today) {
  const offices = data.offices.map((office, index) => {
    const related = data.shipments.filter((s) => s.sourceOfficeId === office.id || s.destinationOfficeId === office.id);
    const incoming = data.shipments.filter((s) => s.destinationOfficeId === office.id);
    return {
      ...office,
      coordinates: coordinatesForOffice(office, index),
      todayReceived: incoming.filter((s) => s.receivedDate === today).length,
      todayToReceive: incoming.filter((s) => ACTIVE_STATUSES.has(s.status)).length,
      totalInStorage: related.filter((s) => ACTIVE_STATUSES.has(s.status)).length,
    };
  });

  const drivers = data.employees
    .filter((e) => e.employeeType === "COURIER")
    .map((employee, index) => {
      const assigned = data.shipments.filter((s) => s.courierId === employee.id);
      const office = offices.find((o) => o.id === employee.officeId);
      return {
        id: employee.id,
        officeId: employee.officeId,
        name: `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || `#${employee.id}`,
        coordinates: offsetCoordinate(office?.coordinates ?? BULGARIA_CENTER, index),
        activeDeliveries: assigned.filter((s) => ACTIVE_STATUSES.has(s.status)).length,
        deliveredToday: assigned.filter((s) => s.receivedDate === today).length,
      };
    });

  return {
    offices,
    drivers,
    totals: {
      todayReceived: offices.reduce((sum, o) => sum + o.todayReceived, 0),
      todayToReceive: offices.reduce((sum, o) => sum + o.todayToReceive, 0),
      totalInStorage: offices.reduce((sum, o) => sum + o.totalInStorage, 0),
    },
  };
}

function coordinatesForOffice(office, index) {
  const key = String(office.city ?? "").trim().toLowerCase();
  return offsetCoordinate(CITY_COORDINATES[key] ?? BULGARIA_CENTER, index, 0.08);
}

function offsetCoordinate([lng, lat], index, radius = 0.045) {
  const angle = index * 1.9;
  return [lng + Math.cos(angle) * radius, lat + Math.sin(angle) * radius];
}

async function fetchRoute(fromLng, fromLat, toLng, toLat) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route");
  return data.routes[0].geometry.coordinates; // [[lng, lat], ...]
}

function localDateKey() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function officeMarker(office) {
  const element = document.createElement("div");
  element.className = "map-marker office-marker";
  element.innerHTML = `<strong>${office.totalInStorage}</strong><span>${escapeHtml(office.address ?? office.city)}</span>`;
  return new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(office.coordinates);
}

function createDriverMarker(driver) {
  const element = document.createElement("div");
  element.className = "map-marker driver-marker";
  element.innerHTML = `<strong>${driver.activeDeliveries}</strong><span>${escapeHtml(driver.name)}</span>`;
  return new maplibregl.Marker({ element, anchor: "bottom" });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function bulgariaStyle() {
  const pmtilesUrl = `${window.location.origin}/maps/bulgaria.pmtiles`;
  return {
    version: 8,
    sources: {
      bulgaria: {
        type: "vector",
        url: `pmtiles://${pmtilesUrl}`,
        minzoom: 0,
        maxzoom: 15,
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#dbeafe" } },
      { id: "earth", type: "fill", source: "bulgaria", "source-layer": "earth", paint: { "fill-color": "#f7fee7" } },
      { id: "landcover", type: "fill", source: "bulgaria", "source-layer": "landcover", paint: { "fill-color": "#bbf7d0", "fill-opacity": 0.75 } },
      { id: "landuse", type: "fill", source: "bulgaria", "source-layer": "landuse", paint: { "fill-color": "#fde68a", "fill-opacity": 0.35 } },
      { id: "water", type: "fill", source: "bulgaria", "source-layer": "water", paint: { "fill-color": "#60a5fa", "fill-opacity": 0.82 } },
      { id: "roads-casing", type: "line", source: "bulgaria", "source-layer": "roads", paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 4], "line-opacity": 0.9 } },
      { id: "roads", type: "line", source: "bulgaria", "source-layer": "roads", paint: { "line-color": "#475569", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.45, 10, 1.8], "line-opacity": 0.62 } },
      { id: "boundaries", type: "line", source: "bulgaria", "source-layer": "boundaries", paint: { "line-color": "#0f172a", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.2, 10, 2.4], "line-opacity": 0.7 } },
      { id: "places", type: "circle", source: "bulgaria", "source-layer": "places", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2.4, 10, 5], "circle-color": "#1e293b", "circle-stroke-color": "#ffffff", "circle-stroke-width": 1, "circle-opacity": 0.72 } },
    ],
  };
}
