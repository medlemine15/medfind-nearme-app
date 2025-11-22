import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";

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
          <img src={logo} alt="Tales Logo" className="w-48 h-48 object-contain" />
        </div>

        {/* Description */}
        <p className="text-lg text-foreground/80">
          {t('description')}
        </p>


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
