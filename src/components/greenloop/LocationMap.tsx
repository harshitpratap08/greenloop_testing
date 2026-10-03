import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/domain/types";

const INDIA: L.LatLngExpression = [20.5937, 78.9629];

type MapProps = { geo?: GeoPoint; className?: string; onChange?: (geo: GeoPoint) => void };

export function LocationMap({ geo, className = "", onChange }: MapProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, { scrollWheelZoom: false }).setView(geo ? [geo.lat, geo.lng] : INDIA, geo ? 12 : 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instance);
    map.current = instance;
    if (geo) marker.current = L.circleMarker([geo.lat, geo.lng], { radius: 7, color: "#315f3d", fillColor: "#6d9a73", fillOpacity: 0.9 }).addTo(instance);
    if (onChangeRef.current) instance.on("click", (event: L.LeafletMouseEvent) => onChangeRef.current?.({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) }));
    return () => { instance.remove(); map.current = null; marker.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    if (!geo) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    const point: L.LatLngExpression = [geo.lat, geo.lng];
    if (marker.current) marker.current.setLatLng(point);
    else marker.current = L.circleMarker(point, { radius: 7, color: "#315f3d", fillColor: "#6d9a73", fillOpacity: 0.9 }).addTo(map.current);
    map.current.setView(point, Math.max(map.current.getZoom(), 12));
  }, [geo?.lat, geo?.lng]);

  return <div ref={element} className={`h-56 w-full border border-steel-200 bg-steel-100 dark:border-steel-700 ${className}`} role="application" aria-label={onChange ? "Choose a location on the map" : "Location map"} />;
}

export function LocationPicker({ geo, onChange, className }: { geo?: GeoPoint; onChange: (geo: GeoPoint) => void; className?: string }) {
  return <div className={className}>
    <LocationMap geo={geo} onChange={onChange} />
    <p className="mt-2 text-xs text-steel-600 dark:text-gray-400">{geo ? `Selected coordinates: ${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}` : "Tap the map to add optional coordinates. Your written location remains the primary address."}</p>
  </div>;
}
