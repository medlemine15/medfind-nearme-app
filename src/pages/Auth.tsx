import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import LocationPicker from "@/components/LocationPicker";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "user";
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { t, language } = useLanguage();

  const [pharmacyAddress, setPharmacyAddress] = useState("");
  const [pharmacyLat, setPharmacyLat] = useState<string>("");
  const [pharmacyLng, setPharmacyLng] = useState<string>("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pharmacyLocationError, setPharmacyLocationError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(language === 'ar' ? 'خطأ في تسجيل الدخول. تحقق من بياناتك.' : 'Erreur de connexion. Vérifiez vos identifiants.');
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Connexion réussie!');
      
      if (profile?.user_type === "pharmacy") {
        navigate("/pharmacy-dashboard");
      } else {
        navigate("/home");
      }
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    // Validate phone number: 8 digits starting with 2, 3, or 4
    const phoneRegex = /^[234]\d{7}$/;
    if (!phoneRegex.test(phone)) {
      toast.error(language === 'ar' ? 'رقم الهاتف يجب أن يتكون من 8 أرقام ويبدأ بـ 2 أو 3 أو 4' : 'Le numéro de téléphone doit contenir 8 chiffres et commencer par 2, 3 ou 4');
      setIsLoading(false);
      return;
    }

    if (userType === "pharmacy") {
      if (!pharmacyAddress || !pharmacyLat || !pharmacyLng) {
        const message = language === 'ar'
          ? 'الرجاء تحديد موقع الصيدلية على الخريطة.'
          : 'Veuillez sélectionner l\'emplacement de la pharmacie sur la carte.';
        toast.error(message);
        setPharmacyLocationError(message);
        setIsLoading(false);
        return;
      }
    }

    const signupData: any = {
      name,
      phone,
      user_type: userType,
    };

    if (userType === "pharmacy") {
      signupData.address = pharmacyAddress;
      signupData.latitude = parseFloat(pharmacyLat);
      signupData.longitude = parseFloat(pharmacyLng);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: signupData,
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error(language === 'ar' ? 'البريد الإلكتروني مسجل مسبقاً' : 'Email déjà enregistré');
      } else {
        toast.error(language === 'ar' ? 'خطأ في التسجيل. حاول مرة أخرى.' : 'Erreur d\'inscription. Réessayez.');
      }
      setIsLoading(false);
      return;
    }

    if (data.user) {
      toast.success(language === 'ar' ? 'تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى التحقق منه لإكمال التسجيل.' : 'Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail pour compléter l\'inscription.');
      setIsLogin(true);
    }
    setIsLoading(false);
  };

  const handleLocationConfirm = (data: { address: string; latitude: number; longitude: number }) => {
    setPharmacyAddress(data.address);
    setPharmacyLat(data.latitude.toString());
    setPharmacyLng(data.longitude.toString());
    setPharmacyLocationError(null);
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary flex items-center justify-center p-6 relative">
      {/* Language and Theme toggles */}
      <div className={`absolute top-6 flex gap-2 ${language === 'ar' ? 'left-6' : 'right-6'}`}>
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-10 w-10"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg p-1">
              <img src={logo} alt="Tales Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">
              {userType === "pharmacy" ? (language === 'ar' ? "حساب الصيدلية" : "Compte pharmacie") : (language === 'ar' ? "حساب المستخدم" : "Compte utilisateur")}
            </CardTitle>
            <CardDescription>
              {isLogin ? (language === 'ar' ? "سجل دخولك للمتابعة" : "Connectez-vous pour continuer") : (language === 'ar' ? "أنشئ حساباً جديداً" : "Créer un nouveau compte")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('register')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm text-muted-foreground hover:text-primary"
                    onClick={() => navigate("/reset-password")}
                  >
                    {language === 'ar' ? 'نسيت كلمة السر؟' : 'Mot de passe oublié?'}
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (language === 'ar' ? 'جاري التحميل...' : 'Chargement...') : t('login')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {userType === "pharmacy" ? t('pharmacyName') : t('name')}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={language === 'ar' ? '2xxxxxxx أو 3xxxxxxx أو 4xxxxxxx' : '2xxxxxxx ou 3xxxxxxx ou 4xxxxxxx'}
                    pattern="[234]\d{7}"
                    title={language === 'ar' ? 'رقم الهاتف يجب أن يتكون من 8 أرقام ويبدأ بـ 2 أو 3 أو 4' : 'Le numéro doit contenir 8 chiffres et commencer par 2, 3 ou 4'}
                    required
                    dir="ltr"
                  />
                </div>
                {userType === "pharmacy" && (
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {language === 'ar' ? 'عنوان الصيدلية' : 'Adresse de la pharmacie'}
                    </Label>
                    <div className="space-y-1">
                      <div className="relative">
                        <Input
                          id="address"
                          name="address"
                          type="text"
                          readOnly
                          value={pharmacyAddress}
                          placeholder={language === 'ar' ? 'اضغط لاختيار العنوان من الخريطة' : 'Appuyez pour choisir l\'adresse sur la carte'}
                          onClick={() => setShowLocationPicker(true)}
                          className={pharmacyLocationError ? 'pr-10 border-destructive' : 'pr-10'}
                        />
                        <MapPin className="w-4 h-4 text-primary absolute inset-y-0 my-auto right-3" />
                      </div>
                      {pharmacyLocationError && (
                        <p className="text-xs text-destructive">{pharmacyLocationError}</p>
                      )}
                      {pharmacyAddress && pharmacyLat && pharmacyLng && (
                        <p className="text-xs text-muted-foreground">
                          {pharmacyLat}, {pharmacyLng}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email-signup">{t('email')}</Label>
                  <Input
                    id="email-signup"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">{t('password')}</Label>
                  <Input
                    id="password-signup"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (language === 'ar' ? 'جاري التحميل...' : 'Chargement...') : t('register')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirm}
      />
    </div>
  );
};

export default Auth;
