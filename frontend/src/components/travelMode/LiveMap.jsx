import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom pulsing GPS marker for User Location
const userGpsIcon = L.divIcon({
  className: 'custom-gps-marker',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <div class="absolute w-6 h-6 rounded-full bg-blue-500/40 animate-ping"></div>
      <div class="absolute w-4 h-4 rounded-full bg-blue-400/60 animate-pulse"></div>
      <div class="relative w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Custom glowing marker for Destination
const destinationIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-pulse"></div>
      <div class="absolute w-6 h-6 rounded-full bg-emerald-400/40"></div>
      <div class="relative w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-black shadow-[0_0_15px_rgba(16,185,129,0.9)] flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Helper component to handle map movement/zooming smoothly
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, zoom || 13, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  return null;
};

export default function LiveMap({ userCoords, destCoords, destinationName }) {
  // Fallback map center (Delhi coordinates) if location is not resolved
  const defaultCenter = [28.6139, 77.2090];
  const mapCenter = destCoords ? [destCoords.lat, destCoords.lng] : (userCoords ? [userCoords.lat, userCoords.lng] : defaultCenter);
  
  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#0c0c0e]">
      <MapContainer
        center={mapCenter}
        zoom={13}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User Current Location Marker */}
        {userCoords && userCoords.lat && userCoords.lng && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userGpsIcon}>
            <Popup className="custom-map-popup">
              <div className="p-1 text-xs font-semibold text-white bg-neutral-900 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  My Current Location
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Location Marker */}
        {destCoords && destCoords.lat && destCoords.lng && (
          <Marker position={[destCoords.lat, destCoords.lng]} icon={destinationIcon}>
            <Popup className="custom-map-popup">
              <div className="p-2 text-xs text-white bg-neutral-900 rounded-lg">
                <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[10px]">Destination</span>
                <span className="text-sm font-semibold">{destinationName}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Sync Map center when coords change */}
        <MapController center={mapCenter} zoom={destCoords ? 14 : 13} />
      </MapContainer>

      {/* Dark overlay vignette to blend map with UI */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-background/40 z-[1]" />
    </div>
  );
}
