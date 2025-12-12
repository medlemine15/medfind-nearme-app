import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Upload, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImportData } from "@/components/ImportData";
import { MedicineUpload } from "@/components/MedicineUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";

interface Drug {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth?type=pharmacy");
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    if (profile?.user_type !== 'pharmacy') {
      toast.error(t('pharmacyOnlyPage'));
      navigate("/home");
      return;
    }

    setPharmacyId(session.user.id);
    loadDrugs(session.user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const loadDrugs = async (userId?: string) => {
    try {
      const id = userId || pharmacyId;
      
      if (!id) {
        setDrugs([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .eq('pharmacy_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrugs(data || []);
    } catch (error) {
      console.error('Error loading drugs:', error);
      toast.error(t('loadingError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      if (!pharmacyId) {
        toast.error(t('pharmacyIdentificationError'));
        return;
      }

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
      toast.success(t('drugAddedSuccess'));
      form.reset();
      loadDrugs();
    } catch (error) {
      console.error('Error adding drug:', error);
      toast.error(t('addError'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drugs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success(t('drugDeletedSuccess'));
      loadDrugs();
    } catch (error) {
      console.error('Error deleting drug:', error);
      toast.error(t('deleteError'));
    }
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md p-1">
              <img src={logo} alt="Tales Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('dashboard')}</h1>
              <p className="text-sm text-muted-foreground">{t('pharmacyManagement')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{drugs.length}</div>
                <div className="text-sm text-muted-foreground">{t('totalDrugs')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-success">
                  {drugs.reduce((acc, drug) => acc + drug.quantity, 0)}
                </div>
                <div className="text-sm text-muted-foreground">{t('totalQuantity')}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="list">{t('drugsList')}</TabsTrigger>
              <TabsTrigger value="import">
                <Upload className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t('importData')}
              </TabsTrigger>
              <TabsTrigger value="medicines">
                {language === 'ar' ? 'رفع الأدوية' : 'Médicaments'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              {/* Add Drug Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">{t('availableDrugs')}</h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {t('addDrug')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('addNewDrug')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDrug} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('drugName')}</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">{t('price')} (MRU)</Label>
                        <Input id="price" name="price" type="number" step="0.01" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">{t('availableQuantity')}</Label>
                        <Input id="quantity" name="quantity" type="number" required />
                      </div>
                      <Button type="submit" className="w-full">
                        {t('add')}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Drugs List */}
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('loading')}
                </div>
              ) : drugs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>{t('noDrugsRegistered')}</p>
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
                              <span>{t('price')}: {drug.price}</span>
                              <span>{t('quantity')}: {drug.quantity}</span>
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
              <ImportData onImportComplete={loadDrugs} pharmacyId={pharmacyId || ''} />
            </TabsContent>

            <TabsContent value="medicines">
              <MedicineUpload pharmacyId={pharmacyId || ''} onUploadComplete={() => loadDrugs()} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;