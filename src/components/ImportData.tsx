import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Link as LinkIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      // Try to read as Excel first (works for xlsx, xls, csv, etc.)
      const arrayBuffer = await file.arrayBuffer();
      
      let rows: any[][] = [];
      
      try {
        // XLSX can read many formats including CSV
        const workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          raw: false,
          codepage: 65001, // UTF-8
        });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get raw data as array of arrays
        rows = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          defval: ''
        }) as any[][];
        
        console.log('XLSX parsed rows:', rows.slice(0, 5));
      } catch (xlsxError) {
        console.log('XLSX failed, trying as text:', xlsxError);
        
        // Fallback: read as text
        const text = await file.text();
        rows = parseTextToRows(text);
      }

      const drugs = extractDrugsFromRows(rows);
      await processImportedData(drugs);
      
    } catch (error) {
      console.error('File processing error:', error);
      toast.error("خطأ في قراءة الملف");
      setIsImporting(false);
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Convert text to rows with smart delimiter detection
  const parseTextToRows = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    // Find the best delimiter by checking which produces the most consistent column count
    const delimiters = ['\t', ',', ';', '|', ':'];
    let bestDelimiter = ',';
    let bestScore = 0;

    for (const delimiter of delimiters) {
      const escapedDelimiter = delimiter.replace(/[|]/g, '\\$&');
      const counts = lines.slice(0, Math.min(10, lines.length)).map(
        line => (line.match(new RegExp(escapedDelimiter, 'g')) || []).length
      );
      
      // Score based on count and consistency
      const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
      const variance = counts.reduce((sum, c) => sum + Math.abs(c - avgCount), 0) / counts.length;
      const score = avgCount * 10 - variance * 5;
      
      console.log(`Delimiter "${delimiter}": avgCount=${avgCount}, variance=${variance}, score=${score}`);
      
      if (score > bestScore && avgCount >= 1) {
        bestScore = score;
        bestDelimiter = delimiter;
      }
    }

    console.log('Selected delimiter:', JSON.stringify(bestDelimiter));

    // Parse each line with the best delimiter, handling quotes
    return lines.map(line => splitWithQuotes(line, bestDelimiter));
  };

  // Split a line respecting quoted values
  const splitWithQuotes = (line: string, delimiter: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  };

  // Extract drugs from parsed rows
  const extractDrugsFromRows = (rows: any[][]): ParsedDrug[] => {
    if (rows.length === 0) return [];

    // Clean rows - remove empty rows and ensure all are arrays
    const cleanRows = rows
      .filter(row => row && Array.isArray(row) && row.some(cell => String(cell).trim()))
      .map(row => row.map(cell => String(cell || '').trim()));

    console.log('Clean rows:', cleanRows.slice(0, 5));

    if (cleanRows.length === 0) return [];

    // Find column indices
    const columnMapping = findColumnMapping(cleanRows);
    console.log('Column mapping:', columnMapping);

    if (columnMapping.nameCol === -1) {
      // No header found - try to guess from data structure
      return extractDrugsWithoutHeader(cleanRows);
    }

    // Extract data rows (skip header)
    const drugs: ParsedDrug[] = [];
    const startRow = columnMapping.headerRow + 1;

    for (let i = startRow; i < cleanRows.length; i++) {
      const row = cleanRows[i];
      const drug = extractDrugFromRow(row, columnMapping);
      if (drug) {
        drugs.push(drug);
      }
    }

    return drugs;
  };

  // Find which columns contain name, price, quantity
  const findColumnMapping = (rows: string[][]): {
    headerRow: number;
    nameCol: number;
    priceCol: number;
    quantityCol: number;
  } => {
    const namePatterns = [
      'name', 'اسم', 'الاسم', 'اسم الدواء', 'drug', 'medicine', 'medication',
      'medication_name', 'drug_name', 'product', 'المنتج', 'الدواء', 'item', 'article'
    ];
    const pricePatterns = [
      'price', 'السعر', 'سعر', 'cost', 'amount', 'value', 'القيمة', 'التكلفة', 
      'ثمن', 'prix', 'unit_price', 'unitprice'
    ];
    const quantityPatterns = [
      'quantity', 'الكمية', 'كمية', 'qty', 'stock', 'count', 'العدد', 
      'المخزون', 'quantité', 'qte', 'units'
    ];

    // Check first 5 rows for header
    for (let rowIdx = 0; rowIdx < Math.min(5, rows.length); rowIdx++) {
      const row = rows[rowIdx];
      let nameCol = -1;
      let priceCol = -1;
      let quantityCol = -1;

      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cellValue = row[colIdx].toLowerCase();
        
        if (nameCol === -1 && namePatterns.some(p => cellValue.includes(p))) {
          nameCol = colIdx;
        }
        if (priceCol === -1 && pricePatterns.some(p => cellValue.includes(p))) {
          priceCol = colIdx;
        }
        if (quantityCol === -1 && quantityPatterns.some(p => cellValue.includes(p))) {
          quantityCol = colIdx;
        }
      }

      // If we found at least name column, use this as header
      if (nameCol !== -1) {
        return { headerRow: rowIdx, nameCol, priceCol, quantityCol };
      }
    }

    return { headerRow: -1, nameCol: -1, priceCol: -1, quantityCol: -1 };
  };

  // Extract drugs when no header is found - guess from data
  const extractDrugsWithoutHeader = (rows: string[][]): ParsedDrug[] => {
    const drugs: ParsedDrug[] = [];

    // Analyze first few rows to guess column types
    const columnTypes = analyzeColumnTypes(rows);
    console.log('Guessed column types:', columnTypes);

    const nameCol = columnTypes.findIndex(t => t === 'text');
    const priceCol = columnTypes.findIndex(t => t === 'decimal');
    const quantityCol = columnTypes.findIndex(t => t === 'integer');

    if (nameCol === -1 || priceCol === -1) {
      // Last resort: assume first column is name, look for numbers in other columns
      for (const row of rows) {
        if (row.length >= 2) {
          const name = row[0];
          const numbers = row.slice(1).map(cell => {
            const cleaned = cell.replace(/[^\d.,]/g, '').replace(',', '.');
            return parseFloat(cleaned);
          }).filter(n => !isNaN(n) && n > 0);

          if (name && numbers.length >= 1) {
            drugs.push({
              name,
              price: numbers[0],
              quantity: numbers.length > 1 ? Math.round(numbers[1]) : 0
            });
          }
        }
      }
      return drugs;
    }

    for (const row of rows) {
      const drug = extractDrugFromRow(row, { nameCol, priceCol, quantityCol });
      if (drug) {
        drugs.push(drug);
      }
    }

    return drugs;
  };

  // Analyze column types based on data
  const analyzeColumnTypes = (rows: string[][]): ('text' | 'decimal' | 'integer' | 'unknown')[] => {
    if (rows.length === 0) return [];
    
    const maxCols = Math.max(...rows.map(r => r.length));
    const types: ('text' | 'decimal' | 'integer' | 'unknown')[] = [];

    for (let col = 0; col < maxCols; col++) {
      const values = rows.map(r => r[col] || '').filter(v => v.trim());
      
      let isAllInteger = true;
      let isAllDecimal = true;
      let hasText = false;

      for (const val of values) {
        const cleaned = val.replace(/[,\s]/g, '');
        
        if (/^-?\d+$/.test(cleaned)) {
          // Pure integer
        } else if (/^-?\d*[.,]\d+$/.test(cleaned)) {
          isAllInteger = false;
        } else if (/\d/.test(val)) {
          // Has digits but also text
          hasText = true;
          isAllInteger = false;
          isAllDecimal = false;
        } else {
          hasText = true;
          isAllInteger = false;
          isAllDecimal = false;
        }
      }

      if (hasText) {
        types.push('text');
      } else if (isAllInteger) {
        types.push('integer');
      } else if (isAllDecimal) {
        types.push('decimal');
      } else {
        types.push('unknown');
      }
    }

    return types;
  };

  // Extract a single drug from a row
  const extractDrugFromRow = (
    row: string[],
    mapping: { nameCol: number; priceCol: number; quantityCol: number }
  ): ParsedDrug | null => {
    const name = mapping.nameCol >= 0 && mapping.nameCol < row.length 
      ? row[mapping.nameCol].trim() 
      : '';
    
    const priceStr = mapping.priceCol >= 0 && mapping.priceCol < row.length 
      ? row[mapping.priceCol] 
      : '';
    
    const quantityStr = mapping.quantityCol >= 0 && mapping.quantityCol < row.length 
      ? row[mapping.quantityCol] 
      : '0';

    // Parse price - handle various formats
    const priceClean = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
    const price = parseFloat(priceClean);

    // Parse quantity
    const quantityClean = quantityStr.replace(/[^\d]/g, '');
    const quantity = parseInt(quantityClean) || 0;

    // Validate: need name and valid price
    if (!name || name.length < 2 || isNaN(price) || price <= 0) {
      return null;
    }

    // Clamp quantity to valid integer range
    const safeQuantity = Math.min(Math.max(0, quantity), 2147483647);

    return { name, price, quantity: safeQuantity };
  };

  const processImportedData = async (drugs: ParsedDrug[]) => {
    try {
      console.log('Valid drugs to import:', drugs);
      
      if (drugs.length === 0) {
        toast.error("لم يتم العثور على بيانات صالحة في الملف");
        setIsImporting(false);
        return;
      }

      const drugsWithPharmacy = drugs.map(drug => ({
        name: drug.name,
        price: drug.price,
        quantity: drug.quantity,
        pharmacy_id: pharmacyId
      }));

      // Insert in batches to avoid timeout
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < drugsWithPharmacy.length; i += batchSize) {
        const batch = drugsWithPharmacy.slice(i, i + batchSize);
        const { error } = await supabase.from('drugs').insert(batch);
        
        if (error) throw error;
        inserted += batch.length;
      }

      toast.success(`تم استيراد ${inserted} دواء بنجاح`);
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
              <p className="mb-2 font-medium">يقبل جميع أنواع الملفات:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Excel, CSV, TSV, TXT</li>
                <li>أي ملف بفواصل (فاصلة، منقوطة، تاب)</li>
                <li>يكتشف الأعمدة تلقائياً</li>
              </ul>
            </div>
            <label htmlFor="file-upload">
              <input
                id="file-upload"
                type="file"
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
