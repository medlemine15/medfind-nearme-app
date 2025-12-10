import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MapPin, Phone, Building2, Navigation, Locate } from 'lucide-react';
import logoImage from '@/assets/logo.png';

const PharmacyRegistration = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const translations = {
    ar: {
      title: 'تسجيل صيدلية جديدة',
      pharmacyName: 'اسم الصيدلية',
      phone: 'رقم الهاتف',
      location: 'موقع الصيدلية',
      address: 'العنوان',
      latitude: 'خط العرض',
      longitude: 'خط الطول',
      getLocation: 'تحديد موقعي',
      gettingLocation: 'جاري التحديد...',
      register: 'تسجيل الصيدلية',
      success: 'تم تسجيل الصيدلية بنجاح',
      error: 'حدث خطأ في التسجيل',
      latRequired: 'خط العرض مطلوب',
      lngRequired: 'خط الطول مطلوب',
      latRange: 'خط العرض يجب أن يكون بين -90 و 90',
      lngRange: 'خط الطول يجب أن يكون بين -180 و 180',
      nameRequired: 'اسم الصيدلية مطلوب',
      phoneRequired: 'رقم الهاتف مطلوب',
      addressRequired: 'العنوان مطلوب',
      phoneInvalid: 'رقم الهاتف يجب أن يكون 8 أرقام ويبدأ بـ 2 أو 3 أو 4',
      locationError: 'تعذر الحصول على الموقع',
    },
    fr: {
      title: 'Enregistrer une nouvelle pharmacie',
      pharmacyName: 'Nom de la pharmacie',
      phone: 'Téléphone',
      location: 'Emplacement de la pharmacie',
      address: 'Adresse',
      latitude: 'Latitude',
      longitude: 'Longitude',
      getLocation: 'Ma position',
      gettingLocation: 'Localisation...',
      register: 'Enregistrer la pharmacie',
      success: 'Pharmacie enregistrée avec succès',
      error: 'Erreur lors de l\'enregistrement',
      latRequired: 'La latitude est requise',
      lngRequired: 'La longitude est requise',
      latRange: 'La latitude doit être entre -90 et 90',
      lngRange: 'La longitude doit être entre -180 et 180',
      nameRequired: 'Le nom de la pharmacie est requis',
      phoneRequired: 'Le téléphone est requis',
      addressRequired: 'L\'adresse est requise',
      phoneInvalid: 'Le téléphone doit avoir 8 chiffres et commencer par 2, 3 ou 4',
      locationError: 'Impossible d\'obtenir la position',
    },
  };

  const tr = translations[language];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = tr.nameRequired;
    }

    if (!phone.trim()) {
      newErrors.phone = tr.phoneRequired;
    } else if (!/^[234]\d{7}$/.test(phone)) {
      newErrors.phone = tr.phoneInvalid;
    }

    if (!address.trim()) {
      newErrors.address = tr.addressRequired;
    }

    if (!latitude.trim()) {
      newErrors.latitude = tr.latRequired;
    } else {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = tr.latRange;
      }
    }

    if (!longitude.trim()) {
      newErrors.longitude = tr.lngRequired;
    } else {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = tr.lngRange;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: tr.locationError,
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsGettingLocation(false);
      },
      () => {
        toast({
          title: tr.locationError,
          variant: 'destructive',
        });
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .insert([
          {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          }
        ]);

      if (error) throw error;

      toast({
        title: tr.success,
        variant: 'default',
      });

      navigate('/home');
    } catch (error: any) {
      toast({
        title: tr.error,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden">
            <img src={logoImage} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-lg font-bold text-foreground">{t('appName')}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">{tr.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pharmacy Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {tr.pharmacyName}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tr.pharmacyName}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {tr.phone}
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="2XXXXXXX"
                  maxLength={8}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              {/* Location Section */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <MapPin className="w-5 h-5 text-primary" />
                    {tr.location}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="gap-2"
                  >
                    <Locate className={`w-4 h-4 ${isGettingLocation ? 'animate-pulse' : ''}`} />
                    {isGettingLocation ? tr.gettingLocation : tr.getLocation}
                  </Button>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm text-muted-foreground">
                    {tr.address}
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={tr.address}
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Navigation className="w-3 h-3" />
                      {tr.latitude}
                    </Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="18.0735"
                      className={errors.latitude ? 'border-destructive' : ''}
                    />
                    {errors.latitude && <p className="text-sm text-destructive">{errors.latitude}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Navigation className="w-3 h-3 rotate-90" />
                      {tr.longitude}
                    </Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="-15.9582"
                      className={errors.longitude ? 'border-destructive' : ''}
                    />
                    {errors.longitude && <p className="text-sm text-destructive">{errors.longitude}</p>}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '...' : tr.register}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PharmacyRegistration;
