import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pill, Edit2, Trash2, Menu } from "lucide-react";
import { toast } from "sonner";

interface Drug {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const PharmacyDashboard = () => {
  const [drugs, setDrugs] = useState<Drug[]>([
    { id: 1, name: "باراسيتامول 500mg", price: 150, quantity: 50 },
    { id: 2, name: "أسبرين 100mg", price: 200, quantity: 30 },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newDrug: Drug = {
      id: Date.now(),
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      quantity: Number(formData.get("quantity")),
    };

    setDrugs([...drugs, newDrug]);
    setIsAddDialogOpen(false);
    toast.success("تمت إضافة الدواء بنجاح");
    form.reset();
  };

  const handleDelete = (id: number) => {
    setDrugs(drugs.filter(drug => drug.id !== id));
    toast.success("تم حذف الدواء");
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
              <p className="text-sm text-muted-foreground">صيدلية النور</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
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

          {/* Add Drug Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">قائمة الأدوية</h2>
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
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
