import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Pharmacy {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  drugName?: string;
  drugPrice?: number;
}

interface PharmacyMapProps {
  pharmacies: Pharmacy[];
  onPharmacyClick?: (pharmacy: Pharmacy) => void;
}

const PharmacyMap = ({ pharmacies, onPharmacyClick }: PharmacyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!token) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = token;

    // Default center (Mauritania)
    const defaultCenter: [number, number] = [-15.973059, 18.080682];
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (pharmacies.length === 0) return;

    // Add markers for each pharmacy
    pharmacies.forEach((pharmacy) => {
      if (!pharmacy.latitude || !pharmacy.longitude) return;

      const popupContent = `
        <div style="direction: rtl; text-align: right; padding: 8px; min-width: 150px;">
          <h3 style="font-weight: bold; margin-bottom: 4px; color: #1a1a1a;">${pharmacy.name}</h3>
          ${pharmacy.drugName ? `<p style="color: #666; margin: 2px 0;">الدواء: ${pharmacy.drugName}</p>` : ''}
          ${pharmacy.drugPrice ? `<p style="color: #059669; font-weight: bold; margin: 2px 0;">السعر: ${pharmacy.drugPrice}</p>` : ''}
          ${pharmacy.phone ? `<p style="color: #666; margin: 2px 0;">الهاتف: ${pharmacy.phone}</p>` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new mapboxgl.Marker({ color: '#059669' })
        .setLngLat([pharmacy.longitude, pharmacy.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        onPharmacyClick?.(pharmacy);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (pharmacies.length > 0) {
      const validPharmacies = pharmacies.filter(p => p.latitude && p.longitude);
      if (validPharmacies.length === 1) {
        map.current.flyTo({
          center: [validPharmacies[0].longitude, validPharmacies[0].latitude],
          zoom: 15,
        });
      } else if (validPharmacies.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        validPharmacies.forEach((pharmacy) => {
          bounds.extend([pharmacy.longitude, pharmacy.latitude]);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [pharmacies, onPharmacyClick]);

  return (
    <div className="relative w-full h-[300px] rounded-xl overflow-hidden shadow-lg border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default PharmacyMap;
