import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Check, Locate } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  interface Window {
    initLocationPicker: () => void;
    google: any;
  }
}

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { address: string; latitude: number; longitude: number }) => void;
}

const LocationPicker = ({ open, onClose, onConfirm }: LocationPickerProps) => {
  const { language } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const translations = {
    ar: {
      title: 'اختر موقع الصيدلية',
      selectedAddress: 'العنوان المحدد',
      confirm: 'تأكيد الموقع',
      cancel: 'إلغاء',
      tapToSelect: 'اضغط على الخريطة لتحديد الموقع',
      getLocation: 'موقعي الحالي',
      gettingLocation: 'جاري التحديد...',
      loadingAddress: 'جاري تحميل العنوان...',
      noAddressFound: 'لم يتم العثور على عنوان',
    },
    fr: {
      title: 'Sélectionnez l\'emplacement de la pharmacie',
      selectedAddress: 'Adresse sélectionnée',
      confirm: 'Confirmer l\'emplacement',
      cancel: 'Annuler',
      tapToSelect: 'Appuyez sur la carte pour sélectionner un emplacement',
      getLocation: 'Ma position',
      gettingLocation: 'Localisation...',
      loadingAddress: 'Chargement de l\'adresse...',
      noAddressFound: 'Aucune adresse trouvée',
    },
  };

  const t = translations[language];

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    return new Promise<string>((resolve) => {
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            resolve(t.noAddressFound);
          }
        }
      );
    });
  };

  const updateMarker = async (lat: number, lng: number) => {
    setIsLoading(true);
    
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else if (mapInstanceRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      markerRef.current.addListener('dragend', async () => {
        const pos = markerRef.current.getPosition();
        const newLat = pos.lat();
        const newLng = pos.lng();
        const address = await reverseGeocode(newLat, newLng);
        setSelectedLocation({ lat: newLat, lng: newLng, address });
      });
    }

    mapInstanceRef.current?.panTo({ lat, lng });
    const address = await reverseGeocode(lat, lng);
    setSelectedLocation({ lat, lng, address });
    setIsLoading(false);
  };

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const mauritania = { lat: 18.0735, lng: -15.9582 };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: mauritania,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current.addListener('click', async (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      await updateMarker(lat, lng);
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        await updateMarker(lat, lng);
        setIsGettingLocation(false);
      },
      () => {
        setIsGettingLocation(false);
      }
    );
  };

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setSelectedLocation(null);
      markerRef.current = null;
      mapInstanceRef.current = null;
      return;
    }

    // Small delay to ensure dialog is rendered
    const timer = setTimeout(() => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      window.initLocationPicker = initMap;

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        if (window.google && window.google.maps) {
          initMap();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyASLdiHfiic1WiXwDEhSfLZW8X5qcjnT8A&callback=initLocationPicker';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }, 100);

    return () => clearTimeout(timer);
  }, [open]);

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm({
        address: selectedLocation.address,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t.title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full gap-2"
          >
            <Locate className={`w-4 h-4 ${isGettingLocation ? 'animate-pulse' : ''}`} />
            {isGettingLocation ? t.gettingLocation : t.getLocation}
          </Button>
        </div>

        <div
          ref={mapRef}
          className="w-full h-[300px] bg-muted"
        />

        <div className="p-4 space-y-3 border-t border-border">
          {!selectedLocation && (
            <p className="text-sm text-muted-foreground text-center">
              {t.tapToSelect}
            </p>
          )}

          {selectedLocation && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t.selectedAddress}:</p>
              <p className="text-sm font-medium bg-muted p-2 rounded-md">
                {isLoading ? t.loadingAddress : selectedLocation.address}
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Lat: {selectedLocation.lat.toFixed(6)}</span>
                <span>Lng: {selectedLocation.lng.toFixed(6)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedLocation || isLoading}
              className="flex-1 gap-2"
            >
              <Check className="w-4 h-4" />
              {t.confirm}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPicker;
