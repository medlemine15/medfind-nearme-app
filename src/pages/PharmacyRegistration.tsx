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
import { MapPin, Phone, Building2 } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import LocationPicker from '@/components/LocationPicker';

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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const translations = {
    ar: {
      title: 'تسجيل صيدلية جديدة',
      pharmacyName: 'اسم الصيدلية',
      phone: 'رقم الهاتف',
      location: 'موقع الصيدلية',
      address: 'العنوان',
      selectLocation: 'اضغط لتحديد الموقع على الخريطة',
      register: 'تسجيل الصيدلية',
      success: 'تم تسجيل الصيدلية بنجاح',
      error: 'حدث خطأ في التسجيل',
      nameRequired: 'اسم الصيدلية مطلوب',
      phoneRequired: 'رقم الهاتف مطلوب',
      locationRequired: 'الرجاء تحديد موقع الصيدلية على الخريطة',
      phoneInvalid: 'رقم الهاتف يجب أن يكون 8 أرقام ويبدأ بـ 2 أو 3 أو 4',
    },
    fr: {
      title: 'Enregistrer une nouvelle pharmacie',
      pharmacyName: 'Nom de la pharmacie',
      phone: 'Téléphone',
      location: 'Emplacement de la pharmacie',
      address: 'Adresse',
      selectLocation: 'Appuyez pour sélectionner l\'emplacement sur la carte',
      register: 'Enregistrer la pharmacie',
      success: 'Pharmacie enregistrée avec succès',
      error: 'Erreur lors de l\'enregistrement',
      nameRequired: 'Le nom de la pharmacie est requis',
      phoneRequired: 'Le téléphone est requis',
      locationRequired: 'Veuillez sélectionner l\'emplacement de la pharmacie sur la carte',
      phoneInvalid: 'Le téléphone doit avoir 8 chiffres et commencer par 2, 3 ou 4',
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

    if (!latitude || !longitude || !address) {
      newErrors.location = tr.locationRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationConfirm = (data: { address: string; latitude: number; longitude: number }) => {
    setAddress(data.address);
    setLatitude(data.latitude.toString());
    setLongitude(data.longitude.toString());
    setErrors((prev) => ({ ...prev, location: '' }));
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
                <Label className="flex items-center gap-2 text-base font-medium">
                  <MapPin className="w-5 h-5 text-primary" />
                  {tr.location}
                </Label>

                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className={`w-full p-3 rounded-md border text-start transition-colors ${
                    address
                      ? 'border-primary bg-primary/5'
                      : errors.location
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {address ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{address}</p>
                      <p className="text-xs text-muted-foreground">
                        {latitude}, {longitude}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{tr.selectLocation}</span>
                    </div>
                  )}
                </button>

                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
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

      <LocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirm}
      />
    </div>
  );
};

export default PharmacyRegistration;
