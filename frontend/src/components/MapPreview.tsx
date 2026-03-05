import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with Webpack/Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
}

interface MapPreviewProps {
    lat: number;
    lng: number;
    zoom?: number;
}

export default function MapPreview({ lat, lng, zoom = 15 }: MapPreviewProps) {
    return (
        <div style={{ height: '250px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
            <MapContainer
                center={[lat, lng]}
                zoom={zoom}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} />
                <RecenterMap lat={lat} lng={lng} />
            </MapContainer>
        </div>
    );
}
