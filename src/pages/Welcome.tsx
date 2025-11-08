import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pill, MapPin, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

const Welcome = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary flex flex-col items-center justify-center p-6 relative">
      {/* Language and Theme toggles */}
      <div className={`absolute top-6 flex gap-2 ${language === 'ar' ? 'left-6' : 'right-6'}`}>
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-lg">
            <Pill className="w-12 h-12 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-foreground mb-2">{t('appName')}</h1>
            <p className="text-xl text-muted-foreground">{t('appSubtitle')}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-lg text-foreground/80">
          {t('description')}
        </p>

        {/* Features */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur p-4 rounded-xl">
            <Search className="w-6 h-6 text-primary" />
            <span className="text-foreground">{t('quickSearch')}</span>
          </div>
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur p-4 rounded-xl">
            <MapPin className="w-6 h-6 text-primary" />
            <span className="text-foreground">{t('pharmacyLocations')}</span>
          </div>
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur p-4 rounded-xl">
            <Pill className="w-6 h-6 text-primary" />
            <span className="text-foreground">{t('priceComparison')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-6">
          <Button
            onClick={() => navigate("/auth?type=user")}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {t('loginAsUser')}
          </Button>
          <Button
            onClick={() => navigate("/auth?type=pharmacy")}
            variant="secondary"
            className="w-full h-14 text-lg"
            size="lg"
          >
            {t('loginAsPharmacy')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
