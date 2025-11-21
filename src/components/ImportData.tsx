import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

interface ImportDataProps {
  onImportComplete: () => void;
}

export const ImportData = ({ onImportComplete }: ImportDataProps) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("الرجاء تحميل ملف CSV");
      return;
    }

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const drugs = results.data.map((row: any) => ({
            name: row.name || row['اسم الدواء'],
            price: parseFloat(row.price || row['السعر']),
            quantity: parseInt(row.quantity || row['الكمية']),
          }));

          // Get pharmacy ID from localStorage or create new pharmacy
          let pharmacyId = localStorage.getItem('pharmacy_id');
          
          if (!pharmacyId) {
            const { data: pharmacy, error: pharmacyError } = await supabase
              .from('pharmacies')
              .insert({
                name: "صيدلية النور",
                address: "العنوان",
                phone: "0000000000"
              })
              .select()
              .single();

            if (pharmacyError) throw pharmacyError;
            pharmacyId = pharmacy.id;
            localStorage.setItem('pharmacy_id', pharmacyId);
          }

          const drugsWithPharmacy = drugs.map(drug => ({
            ...drug,
            pharmacy_id: pharmacyId
          }));

          const { error } = await supabase
            .from('drugs')
            .insert(drugsWithPharmacy);

          if (error) throw error;

          toast.success(`تم استيراد ${drugs.length} دواء بنجاح`);
          onImportComplete();
        } catch (error) {
          console.error('Import error:', error);
          toast.error("حدث خطأ أثناء الاستيراد");
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error('Parse error:', error);
        toast.error("خطأ في قراءة الملف");
        setIsImporting(false);
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            استيراد من ملف CSV
          </CardTitle>
          <CardDescription>
            قم بتحميل ملف CSV يحتوي على بيانات الأدوية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">تنسيق الملف المطلوب:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>name: اسم الدواء</li>
                <li>price: السعر</li>
                <li>quantity: الكمية</li>
              </ul>
            </div>
            <label htmlFor="file-upload">
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isImporting}
              />
              <Button 
                asChild
                disabled={isImporting}
                className="w-full cursor-pointer"
              >
                <span>
                  <Upload className="w-4 h-4 ml-2" />
                  {isImporting ? "جاري الاستيراد..." : "اختر ملف CSV"}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            ربط API مباشر
          </CardTitle>
          <CardDescription>
            اربط نظام الصيدلية الخاص بك مباشرة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">يمكنك إرسال البيانات مباشرة عبر API:</p>
              <code className="block bg-muted p-2 rounded text-xs mt-2 break-all">
                POST /api/drugs
              </code>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a href="https://docs.lovable.dev/features/cloud" target="_blank" rel="noopener noreferrer">
                عرض توثيق API
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
