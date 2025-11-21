import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Phone, Pill, Menu } from "lucide-react";
import { toast } from "sonner";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("الرجاء إدخال اسم الدواء");
      return;
    }
    
    // TODO: Implement search with real database
    setResults([]);
    toast.info("جاري البحث في قاعدة البيانات...");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">طالص</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-card rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">ابحث عن دوائك</h2>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب اسم الدواء..."
                className="text-lg h-12"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="lg" className="h-12 px-6">
                <Search className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              مثال: باراسيتامول، أسبرين، أموكسيسيلين
            </p>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                النتائج ({results.length})
              </h3>
              <Button variant="outline" size="sm">
                <MapPin className="w-4 h-4 ml-2" />
                عرض على الخريطة
              </Button>
            </div>

            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-1">
                        {result.pharmacyName}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{result.location}</span>
                        <span className="text-primary">• {result.distance}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-primary">
                        {result.price} دج
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <MapPin className="w-4 h-4 ml-2" />
                      الموقع
                    </Button>
                    <Button className="flex-1" size="sm">
                      <Phone className="w-4 h-4 ml-2" />
                      اتصال
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
              ابدأ البحث
            </h3>
            <p className="text-muted-foreground">
              اكتب اسم الدواء الذي تبحث عنه لعرض الصيدليات المتوفرة
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
