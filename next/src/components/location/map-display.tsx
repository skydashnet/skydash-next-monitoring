'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Asset } from './asset-list';

delete (L.Icon.Default.prototype as any)._getIconUrl;

const getAssetIcon = (type: Asset['type']) => {
  const colorMap = {
    ODC: '#f59e0b',
    ODP: '#10b981',
    JoinBox: '#3b82f6', 
    Server: '#ef4444',
  };
  const color = colorMap[type] || '#6b7280';

  const iconHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
      <path fill="${color}" stroke="#fff" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      <circle cx="12" cy="9.5" r="2.5" fill="white" />
    </svg>`;

  return L.divIcon({
    html: iconHtml,
    className: 'leaflet-custom-icon',
    iconSize: [36, 36],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};


interface MapDisplayProps {
  assets: Asset[];
  onMarkerClick: (asset: Asset) => void;
}

const MapDisplay = ({ assets, onMarkerClick }: MapDisplayProps) => {
  const mapCenter: [number, number] = assets.length > 0 ? [assets[0].latitude, assets[0].longitude] : [-7.821, 112.016];

  return (
    <MapContainer center={mapCenter} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {assets.map(asset => (
        <Marker 
            key={asset.id} 
            position={[asset.latitude, asset.longitude]} 
            eventHandlers={{ click: () => onMarkerClick(asset) }}
            icon={getAssetIcon(asset.type)}
        >
          <Popup><div className="font-sans"><p className="font-bold">{asset.name}</p><p>{asset.type}</p></div></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
export default MapDisplay;