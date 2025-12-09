import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Phone, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import PharmacyMap from "@/components/PharmacyMap";
import logo from "@/assets/logo.png";

interface SearchResult {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  location: string;
  latitude: number;
  longitude: number;
  phone: string;
  drugName: string;
  price: number;
  quantity: number;
}

const Home = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth?type=user");
      return;
    }
    
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error(t('pleaseEnterMedicineName'));
      return;
    }

    toast.info(t('searchingDatabase'));

    // Search drugs by name
    const { data: drugs, error } = await supabase
      .from('drugs')
      .select(`
        id,
        name,
        price,
        quantity,
        pharmacy_id,
        pharmacies (
          id,
          name,
          address,
          latitude,
          longitude,
          phone
        )
      `)
      .ilike('name', `%${searchQuery}%`);

    if (error) {
      console.error('Search error:', error);
      toast.error(language === 'ar' ? 'حدث خطأ في البحث' : 'Erreur de recherche');
      return;
    }

    if (!drugs || drugs.length === 0) {
      setResults([]);
      toast.info(language === 'ar' ? 'لم يتم العثور على نتائج' : 'Aucun résultat trouvé');
      return;
    }

    const searchResults: SearchResult[] = drugs
      .filter(drug => drug.pharmacies)
      .map(drug => ({
        id: drug.id,
        pharmacyId: drug.pharmacy_id,
        pharmacyName: (drug.pharmacies as any).name,
        location: (drug.pharmacies as any).address,
        latitude: (drug.pharmacies as any).latitude,
        longitude: (drug.pharmacies as any).longitude,
        phone: (drug.pharmacies as any).phone || '',
        drugName: drug.name,
        price: Number(drug.price),
        quantity: drug.quantity,
      }));

    setResults(searchResults);
    setShowMap(searchResults.length > 0);
    toast.success(language === 'ar' ? `تم العثور على ${searchResults.length} نتيجة` : `${searchResults.length} résultats trouvés`);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.error(language === 'ar' ? 'رقم الهاتف غير متوفر' : 'Numéro non disponible');
    }
  };

  const pharmaciesForMap = results.map(r => ({
    id: r.pharmacyId,
    name: r.pharmacyName,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.location,
    phone: r.phone,
    drugName: r.drugName,
    drugPrice: r.price,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">{t('loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md p-1.5">
                <img src={logo} alt="Tales Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{t('appName')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-card rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('searchYourMedicine')}</h2>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('typeMedicineName')}
                className="text-lg h-12"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="lg" className="h-12 px-6">
                <Search className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('searchExample')}
            </p>
          </div>
        </div>

        {/* Map Section */}
        {showMap && results.length > 0 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {language === 'ar' ? 'موقع الصيدليات' : 'Emplacement des pharmacies'}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
                {showMap ? (language === 'ar' ? 'إخفاء الخريطة' : 'Masquer la carte') : (language === 'ar' ? 'عرض الخريطة' : 'Afficher la carte')}
              </Button>
            </div>
            <PharmacyMap pharmacies={pharmaciesForMap} />
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {t('results')} ({results.length})
              </h3>
              {!showMap && (
                <Button variant="outline" size="sm" onClick={() => setShowMap(true)}>
                  <MapPin className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('showOnMap')}
                </Button>
              )}
            </div>

            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-1">
                        {result.pharmacyName}
                      </h4>
                      <p className="text-sm text-primary mb-1">{result.drugName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{result.location}</span>
                      </div>
                    </div>
                    <div className={language === 'ar' ? 'text-left' : 'text-right'}>
                      <div className="text-2xl font-bold text-primary">
                        {result.price}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? `الكمية: ${result.quantity}` : `Qté: ${result.quantity}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => setShowMap(true)}
                    >
                      <MapPin className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {t('locationLabel')}
                    </Button>
                    <Button 
                      className="flex-1" 
                      size="sm"
                      onClick={() => handleCall(result.phone)}
                    >
                      <Phone className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {t('call')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('startSearch')}
            </h3>
            <p className="text-muted-foreground">
              {t('searchHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
