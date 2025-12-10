import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const translations = {
    ar: {
      title: 'إعادة تعيين كلمة السر',
      description: 'أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين',
      updateTitle: 'كلمة السر الجديدة',
      updateDescription: 'أدخل كلمة السر الجديدة',
      email: 'البريد الإلكتروني',
      password: 'كلمة السر الجديدة',
      confirmPassword: 'تأكيد كلمة السر',
      sendLink: 'إرسال رابط إعادة التعيين',
      updatePassword: 'تحديث كلمة السر',
      loading: 'جاري الإرسال...',
      updating: 'جاري التحديث...',
      successSent: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني',
      successUpdated: 'تم تحديث كلمة السر بنجاح',
      error: 'حدث خطأ. حاول مرة أخرى.',
      passwordMismatch: 'كلمتا السر غير متطابقتين',
      passwordTooShort: 'كلمة السر يجب أن تكون 6 أحرف على الأقل',
      backToLogin: 'العودة لتسجيل الدخول',
    },
    fr: {
      title: 'Réinitialiser le mot de passe',
      description: 'Entrez votre email pour recevoir le lien de réinitialisation',
      updateTitle: 'Nouveau mot de passe',
      updateDescription: 'Entrez votre nouveau mot de passe',
      email: 'Email',
      password: 'Nouveau mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      sendLink: 'Envoyer le lien',
      updatePassword: 'Mettre à jour',
      loading: 'Envoi en cours...',
      updating: 'Mise à jour...',
      successSent: 'Un lien de réinitialisation a été envoyé à votre email',
      successUpdated: 'Mot de passe mis à jour avec succès',
      error: 'Une erreur s\'est produite. Réessayez.',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
      backToLogin: 'Retour à la connexion',
    },
  };

  const tr = translations[language];

  useEffect(() => {
    // Check if we're in password update mode (user clicked the email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setIsUpdateMode(true);
    }
  }, []);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(tr.error);
    } else {
      toast.success(tr.successSent);
    }
    
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error(tr.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(tr.passwordMismatch);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error(tr.error);
    } else {
      toast.success(tr.successUpdated);
      navigate("/auth");
    }
    
    setIsLoading(false);
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
              onClick={() => navigate("/auth")}
              className="h-10 w-10"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg p-1">
              <img src={logo} alt="Tales Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {isUpdateMode ? tr.updateTitle : tr.title}
              </CardTitle>
              <CardDescription>
                {isUpdateMode ? tr.updateDescription : tr.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isUpdateMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{tr.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{tr.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? tr.updating : tr.updatePassword}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{tr.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? tr.loading : tr.sendLink}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                {tr.backToLogin}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
