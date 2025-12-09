import { useEffect, useRef } from 'react';

interface GoogleMapProps {
  className?: string;
}

declare global {
  interface Window {
    initGoogleMap: () => void;
    google: any;
  }
}

const GoogleMap = ({ className }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const mauritania = { lat: 21.0079, lng: -10.9408 };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 5,
        center: mauritania,
      });

      markerRef.current = new window.google.maps.Marker({
        position: mauritania,
        map: mapInstanceRef.current,
        title: "Mauritania"
      });
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    // Set up callback for when script loads
    window.initGoogleMap = initMap;

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyASLdiHfiic1WiXwDEhSfLZW8X5qcjnT8A&callback=initGoogleMap';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ width: '100%', height: '400px' }}
    />
  );
};

export default GoogleMap;
