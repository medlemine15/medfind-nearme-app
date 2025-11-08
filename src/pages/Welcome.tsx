import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pill, MapPin, Search } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-lg">
            <Pill className="w-12 h-12 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-foreground mb-2">طالص</h1>
            <p className="text-xl text-muted-foreground">Tales</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-lg text-foreground/80">
          اعثر على دوائك في أقرب صيدلية بأفضل سعر
        </p>

        {/* Features */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur p-4 rounded-xl">
            <Search className="w-6 h-6 text-primary" />
            <span className="text-foreground">بحث سريع عن الأدوية</span>
          </div>
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur p-4 rounded-xl">
            <MapPin className="w-6 h-6 text-primary" />
            <span className="text-foreground">مواقع الصيدليات على الخريطة</span>
          </div>
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur p-4 rounded-xl">
            <Pill className="w-6 h-6 text-primary" />
            <span className="text-foreground">مقارنة الأسعار</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-6">
          <Button
            onClick={() => navigate("/auth?type=user")}
            className="w-full h-14 text-lg"
            size="lg"
          >
            تسجيل الدخول كمستخدم
          </Button>
          <Button
            onClick={() => navigate("/auth?type=pharmacy")}
            variant="secondary"
            className="w-full h-14 text-lg"
            size="lg"
          >
            تسجيل الدخول كصيدلية
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
