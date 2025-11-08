import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Pill } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "user";
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual authentication with Lovable Cloud
    toast.success(isLogin ? "تم تسجيل الدخول بنجاح!" : "تم إنشاء الحساب بنجاح!");
    
    if (userType === "pharmacy") {
      navigate("/pharmacy-dashboard");
    } else {
      navigate("/home");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary flex items-center justify-center p-6">
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
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
              <Pill className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">
              {userType === "pharmacy" ? "حساب الصيدلية" : "حساب المستخدم"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "سجل دخولك للمتابعة" : "أنشئ حساباً جديداً"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">حساب جديد</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleAuth} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  تسجيل الدخول
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleAuth} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {userType === "pharmacy" ? "اسم الصيدلية" : "الاسم الكامل"}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    required
                  />
                </div>
                {userType === "pharmacy" && (
                  <div className="space-y-2">
                    <Label htmlFor="location">العنوان</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="المدينة، الحي"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0XX XXX XXXX"
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">البريد الإلكتروني</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">كلمة المرور</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  إنشاء الحساب
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
