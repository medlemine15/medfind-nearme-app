import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface ImportDataProps {
  onImportComplete: () => void;
  pharmacyId: string;
}

export const ImportData = ({ onImportComplete, pharmacyId }: ImportDataProps) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv') || fileName.endsWith('.tsv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods');

    if (!isCSV && !isExcel) {
      toast.error("الرجاء تحميل ملف CSV أو Excel");
      return;
    }

    setIsImporting(true);

    if (isCSV) {
      // Handle CSV files
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await processImportedData(results.data);
        },
        error: (error) => {
          console.error('Parse error:', error);
          toast.error("خطأ في قراءة الملف");
          setIsImporting(false);
        }
      });
    } else {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          await processImportedData(jsonData);
        } catch (error) {
          console.error('Excel parse error:', error);
          toast.error("خطأ في قراءة ملف Excel");
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        toast.error("خطأ في قراءة الملف");
        setIsImporting(false);
      };
      reader.readAsBinaryString(file);
    }
  };

  const processImportedData = async (data: any[]) => {
    try {
      console.log('Raw imported data:', data);
      
      // Get all possible column names from the first row
      const firstRow = data[0];
      if (!firstRow) {
        toast.error("الملف فارغ");
        setIsImporting(false);
        return;
      }

      console.log('First row columns:', Object.keys(firstRow));

      // More flexible column name detection
      const findColumnValue = (row: any, possibleNames: string[]): string => {
        for (const name of possibleNames) {
          const value = row[name];
          if (value !== undefined && value !== null && value !== '') {
            return String(value).trim();
          }
        }
        return '';
      };

      const drugs = data
        .map((row: any, index: number) => {
          const name = findColumnValue(row, [
            'name', 'Name', 'NAME', 'اسم الدواء', 'اسم', 'الاسم',
            'Drug Name', 'drug_name', 'medicine', 'Medicine'
          ]);
          
          const priceStr = findColumnValue(row, [
            'price', 'Price', 'PRICE', 'السعر', 'سعر',
            'Cost', 'cost', 'Amount', 'amount'
          ]);
          
          const quantityStr = findColumnValue(row, [
            'quantity', 'Quantity', 'QUANTITY', 'الكمية', 'كمية',
            'Stock', 'stock', 'qty', 'QTY', 'amount'
          ]);

          const price = parseFloat(priceStr) || 0;
          const quantity = parseInt(quantityStr) || 0;

          console.log(`Row ${index + 1}:`, { name, price, quantity });

          return { name, price, quantity };
        })
        .filter(drug => {
          const isValid = drug.name && drug.price > 0;
          if (!isValid) {
            console.log('Filtered out invalid drug:', drug);
          }
          return isValid;
        });

      console.log('Valid drugs found:', drugs.length);

      if (drugs.length === 0) {
        toast.error("لم يتم العثور على بيانات صالحة في الملف. تأكد من وجود أعمدة: الاسم، السعر، والكمية");
        setIsImporting(false);
        return;
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
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            استيراد من ملف
          </CardTitle>
          <CardDescription>
            قم بتحميل ملف CSV أو Excel يحتوي على بيانات الأدوية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">تنسيق الملف المطلوب (أي من الأسماء التالية):</p>
              <ul className="list-disc list-inside space-y-1">
                <li>اسم الدواء أو name أو Name</li>
                <li>السعر أو price أو Price</li>
                <li>الكمية أو quantity أو Quantity</li>
              </ul>
              <p className="mt-2 text-xs">يدعم: CSV, Excel (.xlsx, .xls), OpenDocument (.ods)</p>
            </div>
            <label htmlFor="file-upload">
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls,.ods,.tsv"
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
                  {isImporting ? "جاري الاستيراد..." : "اختر ملف CSV أو Excel"}
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
