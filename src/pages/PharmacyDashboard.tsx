import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pill, Edit2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImportData } from "@/components/ImportData";

interface Drug {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const PharmacyDashboard = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    try {
      const pharmacyId = localStorage.getItem('pharmacy_id');
      
      if (!pharmacyId) {
        setDrugs([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrugs(data || []);
    } catch (error) {
      console.error('Error loading drugs:', error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const pharmacyId = localStorage.getItem('pharmacy_id');
      
      const { error } = await supabase
        .from('drugs')
        .insert({
          pharmacy_id: pharmacyId,
          name: formData.get("name") as string,
          price: Number(formData.get("price")),
          quantity: Number(formData.get("quantity")),
        });

      if (error) throw error;

      setIsAddDialogOpen(false);
      toast.success("تمت إضافة الدواء بنجاح");
      form.reset();
      loadDrugs();
    } catch (error) {
      console.error('Error adding drug:', error);
      toast.error("حدث خطأ في إضافة الدواء");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drugs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("تم حذف الدواء");
      loadDrugs();
    } catch (error) {
      console.error('Error deleting drug:', error);
      toast.error("حدث خطأ في حذف الدواء");
    }
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
            <div>
              <h1 className="text-xl font-bold text-foreground">لوحة التحكم</h1>
              <p className="text-sm text-muted-foreground">إدارة الصيدلية</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{drugs.length}</div>
                <div className="text-sm text-muted-foreground">إجمالي الأدوية</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-success">
                  {drugs.reduce((acc, drug) => acc + drug.quantity, 0)}
                </div>
                <div className="text-sm text-muted-foreground">الكمية الإجمالية</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-medical-blue">245</div>
                <div className="text-sm text-muted-foreground">عدد الزيارات اليوم</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="list">قائمة الأدوية</TabsTrigger>
              <TabsTrigger value="import">
                <Upload className="w-4 h-4 ml-2" />
                استيراد البيانات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              {/* Add Drug Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">الأدوية المتوفرة</h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة دواء
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة دواء جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDrug} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">اسم الدواء</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">السعر (دج)</Label>
                        <Input id="price" name="price" type="number" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">الكمية المتوفرة</Label>
                        <Input id="quantity" name="quantity" type="number" required />
                      </div>
                      <Button type="submit" className="w-full">
                        إضافة
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Drugs List */}
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : drugs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>لا توجد أدوية مسجلة. استخدم زر "إضافة دواء" أو "استيراد البيانات"</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {drugs.map((drug) => (
              <Card key={drug.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {drug.name}
                      </h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>السعر: {drug.price} دج</span>
                        <span>الكمية: {drug.quantity}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDelete(drug.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="import">
              <ImportData onImportComplete={loadDrugs} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
