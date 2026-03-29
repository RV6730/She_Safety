import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const guardianIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const guardianUnmatchedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const alertIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const placeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  center: [number, number];
  markers?: Array<{ id: string; position: [number, number]; type: 'guardian' | 'guardian-matched' | 'guardian-unmatched' | 'traveler' | 'alert' | 'destination' | 'place'; label: React.ReactNode }>;
  routes?: Array<{ id: string; positions: [number, number][]; color: string; dashArray?: string; weight?: number }>;
  onMarkerClick?: (id: string, type: string) => void;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({ center, markers = [], routes = [], onMarkerClick }: MapProps) {
  return (
    <MapContainer center={center} zoom={14} className="w-full h-full z-0">
      <ChangeView center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {/* Routes */}
      {routes.map(route => (
        <Polyline 
          key={route.id}
          positions={route.positions}
          pathOptions={{ 
            color: route.color, 
            dashArray: route.dashArray, 
            weight: route.weight || 4,
            opacity: 0.8
          }}
        />
      ))}

      {/* Current User Marker */}
      <Marker position={center}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Aura Glow for Guardians (Not Clustered) */}
      {markers.map(marker => (
        <React.Fragment key={`aura-${marker.id}`}>
          {(marker.type === 'guardian' || marker.type === 'guardian-matched') && (
            <Circle 
              center={marker.position} 
              radius={300} 
              pathOptions={{ 
                color: '#10b981', 
                fillColor: '#34d399', 
                fillOpacity: marker.type === 'guardian-matched' ? 0.25 : 0.15, 
                weight: marker.type === 'guardian-matched' ? 3 : 2,
                dashArray: '5, 10'
              }} 
            />
          )}
          {marker.type === 'guardian-unmatched' && (
            <Circle 
              center={marker.position} 
              radius={300} 
              pathOptions={{ 
                color: '#94a3b8', 
                fillColor: '#cbd5e1', 
                fillOpacity: 0.1, 
                weight: 1,
                dashArray: '4, 8'
              }} 
            />
          )}
        </React.Fragment>
      ))}

      {/* Clustered Markers */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
      >
        {markers.map(marker => (
          <Marker 
            key={marker.id}
            position={marker.position}
            icon={
              (marker.type === 'guardian' || marker.type === 'guardian-matched') ? guardianIcon : 
              marker.type === 'guardian-unmatched' ? guardianUnmatchedIcon :
              marker.type === 'alert' ? alertIcon : 
              marker.type === 'destination' ? destIcon : 
              marker.type === 'place' ? placeIcon :
              new L.Icon.Default()
            }
            eventHandlers={{
              click: () => {
                if (onMarkerClick) onMarkerClick(marker.id, marker.type);
              }
            }}
          >
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
