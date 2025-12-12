import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MedicineRow {
  name: string;
  dosage: string;
  form: string;
  price: number;
  quantity: number;
}

interface MedicineUploadProps {
  pharmacyId: string;
  onUploadComplete?: () => void;
}

export const MedicineUpload = ({ pharmacyId, onUploadComplete }: MedicineUploadProps) => {
  const [parsedData, setParsedData] = useState<MedicineRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  const tr = {
    ar: {
      title: 'رفع ملف الأدوية',
      uploadBtn: 'اختر ملف',
      selectFile: 'اختر ملف CSV أو Excel',
      fileName: 'الملف المختار:',
      saveBtn: 'حفظ في قاعدة البيانات',
      saving: 'جاري الحفظ...',
      invalidType: 'يُسمح فقط بملفات CSV و Excel.',
      parseError: 'تعذر قراءة هذا الملف. يرجى رفع ملف CSV أو Excel صالح.',
      noData: 'لم يتم العثور على بيانات في الملف.',
      success: 'تم حفظ البيانات بنجاح!',
      error: 'حدث خطأ أثناء الحفظ',
      preview: 'معاينة البيانات',
      rows: 'صف',
      name: 'الاسم',
      dosage: 'الجرعة',
      form: 'الشكل',
      price: 'السعر',
      quantity: 'الكمية',
      clear: 'مسح',
    },
    fr: {
      title: 'Télécharger le fichier des médicaments',
      uploadBtn: 'Choisir un fichier',
      selectFile: 'Sélectionnez un fichier CSV ou Excel',
      fileName: 'Fichier sélectionné:',
      saveBtn: 'Enregistrer dans la base de données',
      saving: 'Enregistrement...',
      invalidType: 'Seuls les fichiers CSV et Excel sont autorisés.',
      parseError: 'Impossible de lire ce fichier. Veuillez télécharger un fichier CSV ou Excel valide.',
      noData: 'Aucune donnée trouvée dans le fichier.',
      success: 'Données enregistrées avec succès!',
      error: 'Erreur lors de l\'enregistrement',
      preview: 'Aperçu des données',
      rows: 'lignes',
      name: 'Nom',
      dosage: 'Dosage',
      form: 'Forme',
      price: 'Prix',
      quantity: 'Quantité',
      clear: 'Effacer',
    },
  };

  const t = tr[language] || tr.ar;

  const parseCSV = (text: string): MedicineRow[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[,;\t|]/).map(h => h.trim().toLowerCase());
    const rows: MedicineRow[] = [];

    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('اسم') || h.includes('nom'));
    const dosageIdx = headers.findIndex(h => h.includes('dosage') || h.includes('جرعة') || h.includes('dose'));
    const formIdx = headers.findIndex(h => h.includes('form') || h.includes('شكل') || h.includes('forme'));
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('سعر') || h.includes('prix'));
    const qtyIdx = headers.findIndex(h => h.includes('quantity') || h.includes('qty') || h.includes('كمية') || h.includes('quantité'));

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;\t|]/).map(v => v.trim());
      if (values.length < 2) continue;

      rows.push({
        name: nameIdx >= 0 ? values[nameIdx] || '' : values[0] || '',
        dosage: dosageIdx >= 0 ? values[dosageIdx] || '' : values[1] || '',
        form: formIdx >= 0 ? values[formIdx] || '' : values[2] || '',
        price: parseFloat(values[priceIdx >= 0 ? priceIdx : 3]) || 0,
        quantity: parseInt(values[qtyIdx >= 0 ? qtyIdx : 4]) || 0,
      });
    }

    return rows;
  };

  const parseXLSX = (data: ArrayBuffer): MedicineRow[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

    return jsonData.map((row) => {
      const keys = Object.keys(row);
      const findKey = (patterns: string[]) => keys.find(k => patterns.some(p => k.toLowerCase().includes(p)));

      const nameKey = findKey(['name', 'اسم', 'nom']);
      const dosageKey = findKey(['dosage', 'جرعة', 'dose']);
      const formKey = findKey(['form', 'شكل', 'forme']);
      const priceKey = findKey(['price', 'سعر', 'prix']);
      const qtyKey = findKey(['quantity', 'qty', 'كمية', 'quantité']);

      return {
        name: String(nameKey ? row[nameKey] : row[keys[0]] || ''),
        dosage: String(dosageKey ? row[dosageKey] : row[keys[1]] || ''),
        form: String(formKey ? row[formKey] : row[keys[2]] || ''),
        price: parseFloat(String(priceKey ? row[priceKey] : row[keys[3]])) || 0,
        quantity: parseInt(String(qtyKey ? row[qtyKey] : row[keys[4]])) || 0,
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setParsedData([]);
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext !== 'csv' && ext !== 'xlsx') {
      setError(t.invalidType);
      setFileName('');
      return;
    }

    setIsLoading(true);

    try {
      if (ext === 'csv') {
        const text = await file.text();
        const data = parseCSV(text);
        if (data.length === 0) {
          setError(t.noData);
        } else {
          setParsedData(data);
        }
      } else {
        const buffer = await file.arrayBuffer();
        const data = parseXLSX(buffer);
        if (data.length === 0) {
          setError(t.noData);
        } else {
          setParsedData(data);
        }
      }
    } catch {
      setError(t.parseError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (parsedData.length === 0) return;

    setIsSaving(true);

    try {
      const medicinesData = parsedData.map(row => ({
        name: row.name,
        dosage: row.dosage,
        form: row.form,
        price: row.price,
        quantity: row.quantity,
        pharmacy_id: pharmacyId,
      }));

      const { error: insertError } = await supabase
        .from('medicines')
        .insert(medicinesData);

      if (insertError) throw insertError;

      toast({
        title: t.success,
        description: `${parsedData.length} ${t.rows}`,
      });

      setParsedData([]);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadComplete?.();
    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: t.error,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setParsedData([]);
    setFileName('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
            id="medicine-file-input"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {t.uploadBtn}
          </Button>

          {fileName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t.fileName}</span>
              <span className="font-medium text-foreground">{fileName}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {!fileName && !error && (
            <span className="text-sm text-muted-foreground">{t.selectFile}</span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Data Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {t.preview} ({parsedData.length} {t.rows})
              </h3>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-muted">{t.name}</TableHead>
                      <TableHead className="sticky top-0 bg-muted">{t.dosage}</TableHead>
                      <TableHead className="sticky top-0 bg-muted">{t.form}</TableHead>
                      <TableHead className="sticky top-0 bg-muted">{t.price}</TableHead>
                      <TableHead className="sticky top-0 bg-muted">{t.quantity}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.dosage}</TableCell>
                        <TableCell>{row.form}</TableCell>
                        <TableCell>{row.price}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t.saving : t.saveBtn}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
