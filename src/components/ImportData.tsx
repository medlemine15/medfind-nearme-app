import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Link as LinkIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface ImportDataProps {
  onImportComplete: () => void;
  pharmacyId: string;
}

interface ParsedDrug {
  name: string;
  price: number;
  quantity: number;
}

export const ImportData = ({ onImportComplete, pharmacyId }: ImportDataProps) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods');

    setIsImporting(true);

    if (isCSV) {
      // Try multiple delimiters for CSV/text files
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text) {
          toast.error("خطأ في قراءة الملف");
          setIsImporting(false);
          return;
        }
        
        // Detect and parse with the best delimiter
        const data = parseTextContent(text);
        await processImportedData(data);
      };
      reader.onerror = () => {
        toast.error("خطأ في قراءة الملف");
        setIsImporting(false);
      };
      reader.readAsText(file);
    } else if (isExcel) {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to array of arrays first to handle any format
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          const parsedData = parseRawArrayData(rawData);
          await processImportedData(parsedData);
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
    } else {
      // Try to read any file as text
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) {
            toast.error("خطأ في قراءة الملف");
            setIsImporting(false);
            return;
          }
          const data = parseTextContent(text);
          await processImportedData(data);
        } catch (error) {
          console.error('File parse error:', error);
          toast.error("خطأ في قراءة الملف");
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        toast.error("خطأ في قراءة الملف");
        setIsImporting(false);
      };
      reader.readAsText(file);
    }
  };

  // Parse text content with auto-detection of delimiter and format
  const parseTextContent = (text: string): ParsedDrug[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    // Detect delimiter from the first line
    const firstLine = lines[0];
    const delimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxCount = 0;

    for (const delimiter of delimiters) {
      const count = (firstLine.match(new RegExp(delimiter === '|' ? '\\|' : delimiter, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    console.log('Detected delimiter:', bestDelimiter, 'Count:', maxCount);

    // Parse lines
    const rows: string[][] = lines.map(line => {
      // Handle quoted values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === bestDelimiter && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });

    return parseRawArrayData(rows);
  };

  // Parse raw array data (works for both Excel and CSV)
  const parseRawArrayData = (rows: any[][]): ParsedDrug[] => {
    if (rows.length === 0) return [];

    console.log('Raw rows:', rows);

    // Find header row and column indices
    let headerRowIndex = 0;
    let nameColIndex = -1;
    let priceColIndex = -1;
    let quantityColIndex = -1;

    const namePatterns = ['name', 'اسم', 'الاسم', 'اسم الدواء', 'drug', 'medicine', 'medication', 'medication_name', 'drug_name', 'product', 'المنتج', 'الدواء'];
    const pricePatterns = ['price', 'السعر', 'سعر', 'cost', 'amount', 'value', 'القيمة', 'التكلفة', 'ثمن'];
    const quantityPatterns = ['quantity', 'الكمية', 'كمية', 'qty', 'stock', 'count', 'العدد', 'المخزون', 'amount'];

    // Search for header row in first 5 rows
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;

      for (let j = 0; j < row.length; j++) {
        const cellValue = String(row[j] || '').toLowerCase().trim();
        
        if (namePatterns.some(p => cellValue.includes(p.toLowerCase()))) {
          nameColIndex = j;
          headerRowIndex = i;
        }
        if (pricePatterns.some(p => cellValue.includes(p.toLowerCase()))) {
          priceColIndex = j;
          headerRowIndex = i;
        }
        if (quantityPatterns.some(p => cellValue.includes(p.toLowerCase()))) {
          quantityColIndex = j;
          headerRowIndex = i;
        }
      }

      // If we found at least name and price columns, use this row as header
      if (nameColIndex !== -1 && priceColIndex !== -1) {
        break;
      }
    }

    console.log('Header detection:', { headerRowIndex, nameColIndex, priceColIndex, quantityColIndex });

    // If no header found, assume first column is name, second is price, third is quantity
    if (nameColIndex === -1) {
      nameColIndex = 0;
      priceColIndex = 1;
      quantityColIndex = 2;
      headerRowIndex = -1; // No header row, start from 0
    }

    const drugs: ParsedDrug[] = [];
    const startRow = headerRowIndex + 1;

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const name = String(row[nameColIndex] || '').trim();
      const priceStr = String(row[priceColIndex] || '').replace(/[^\d.,]/g, '').replace(',', '.');
      const quantityStr = String(row[quantityColIndex !== -1 ? quantityColIndex : 2] || '').replace(/[^\d]/g, '');

      const price = parseFloat(priceStr) || 0;
      const quantity = parseInt(quantityStr) || 0;

      console.log(`Row ${i}:`, { name, price, quantity, raw: row });

      // Only require name and price > 0
      if (name && name.length > 0 && price > 0) {
        drugs.push({ name, price, quantity });
      }
    }

    return drugs;
  };

  const processImportedData = async (drugs: ParsedDrug[]) => {
    try {
      console.log('Valid drugs to import:', drugs);
      
      if (drugs.length === 0) {
        toast.error("لم يتم العثور على بيانات صالحة في الملف. تأكد من وجود: اسم الدواء والسعر");
        setIsImporting(false);
        return;
      }

      const drugsWithPharmacy = drugs.map(drug => ({
        name: drug.name,
        price: drug.price,
        quantity: drug.quantity,
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
            قم بتحميل أي ملف يحتوي على بيانات الأدوية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2 font-medium">التنسيقات المدعومة:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Excel: xlsx, xls, ods</li>
                <li>نصي: csv, tsv, txt</li>
                <li>أي ملف نصي بفواصل</li>
              </ul>
              <div className="mt-3 p-2 bg-muted rounded-md">
                <p className="font-medium mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  يجب أن يحتوي الملف على:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>عمود الاسم (name أو اسم الدواء)</li>
                  <li>عمود السعر (price أو السعر)</li>
                  <li>عمود الكمية اختياري (quantity أو الكمية)</li>
                </ul>
              </div>
            </div>
            <label htmlFor="file-upload">
              <input
                id="file-upload"
                type="file"
                accept="*/*"
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
                  {isImporting ? "جاري الاستيراد..." : "اختر ملف للاستيراد"}
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
