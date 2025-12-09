import { useEffect, useRef } from 'react';

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

declare global {
  interface Window {
    initPharmacyMap: () => void;
    google: any;
  }
}

const PharmacyMap = ({ pharmacies, onPharmacyClick }: PharmacyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const initMap = () => {
    if (!mapRef.current) return;

    // Default center (Mauritania)
    const defaultCenter = { lat: 18.080682, lng: -15.973059 };

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Calculate center based on pharmacies
    let center = defaultCenter;
    if (pharmacies.length > 0) {
      const validPharmacies = pharmacies.filter(p => p.latitude && p.longitude);
      if (validPharmacies.length > 0) {
        center = {
          lat: validPharmacies[0].latitude,
          lng: validPharmacies[0].longitude
        };
      }
    }

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: center,
      });
    } else {
      mapInstanceRef.current.setCenter(center);
    }

    // Add markers for each pharmacy
    pharmacies.forEach((pharmacy) => {
      if (!pharmacy.latitude || !pharmacy.longitude) return;

      const marker = new window.google.maps.Marker({
        position: { lat: pharmacy.latitude, lng: pharmacy.longitude },
        map: mapInstanceRef.current,
        title: pharmacy.name,
      });

      // Create info window content
      const infoContent = `
        <div style="direction: rtl; text-align: right; padding: 8px; min-width: 150px;">
          <h3 style="font-weight: bold; margin-bottom: 4px; color: #1a1a1a;">${pharmacy.name}</h3>
          ${pharmacy.drugName ? `<p style="color: #666; margin: 2px 0;">الدواء: ${pharmacy.drugName}</p>` : ''}
          ${pharmacy.drugPrice ? `<p style="color: #059669; font-weight: bold; margin: 2px 0;">السعر: ${pharmacy.drugPrice}</p>` : ''}
          ${pharmacy.phone ? `<p style="color: #666; margin: 2px 0;">الهاتف: ${pharmacy.phone}</p>` : ''}
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        onPharmacyClick?.(pharmacy);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple pharmacies
    if (pharmacies.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      pharmacies.forEach((pharmacy) => {
        if (pharmacy.latitude && pharmacy.longitude) {
          bounds.extend({ lat: pharmacy.latitude, lng: pharmacy.longitude });
        }
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    // Set up callback for when script loads
    window.initPharmacyMap = initMap;

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyASLdiHfiic1WiXwDEhSfLZW8X5qcjnT8A&callback=initPharmacyMap';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, []);

  useEffect(() => {
    if (window.google && window.google.maps && mapInstanceRef.current) {
      initMap();
    }
  }, [pharmacies]);

  return (
    <div className="relative w-full h-[300px] rounded-xl overflow-hidden shadow-lg border border-border">
      <div ref={mapRef} className="absolute inset-0" />
    </div>
  );
};

export default PharmacyMap;
