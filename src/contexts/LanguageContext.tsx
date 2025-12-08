import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'fr';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ar: {
    appName: 'طالص',
    appSubtitle: 'Tales',
    description: 'اعثر على دوائك في أقرب صيدلية بأفضل سعر',
    loginAsUser: 'تسجيل الدخول كمستخدم',
    loginAsPharmacy: 'تسجيل الدخول كصيدلية',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    phone: 'رقم الهاتف',
    pharmacyName: 'اسم الصيدلية',
    location: 'الموقع',
    login: 'تسجيل الدخول',
    register: 'تسجيل',
    searchMedicine: 'ابحث عن دواء...',
    nearbyPharmacies: 'الصيدليات القريبة',
    myDrugs: 'أدويتي',
    addDrug: 'إضافة دواء',
    drugName: 'اسم الدواء',
    price: 'السعر',
    quantity: 'الكمية',
    save: 'حفظ',
    edit: 'تعديل',
    delete: 'حذف',
    logout: 'تسجيل الخروج',
    // Home page
    searchYourMedicine: 'ابحث عن دوائك',
    typeMedicineName: 'اكتب اسم الدواء...',
    searchExample: 'مثال: باراسيتامول، أسبرين، أموكسيسيلين',
    results: 'النتائج',
    showOnMap: 'عرض على الخريطة',
    locationLabel: 'الموقع',
    call: 'اتصال',
    startSearch: 'ابدأ البحث',
    searchHint: 'اكتب اسم الدواء الذي تبحث عنه لعرض الصيدليات المتوفرة',
    loading: 'جاري التحميل...',
    pleaseEnterMedicineName: 'الرجاء إدخال اسم الدواء',
    searchingDatabase: 'جاري البحث في قاعدة البيانات...',
    // Pharmacy Dashboard
    dashboard: 'لوحة التحكم',
    pharmacyManagement: 'إدارة الصيدلية',
    totalDrugs: 'إجمالي الأدوية',
    totalQuantity: 'الكمية الإجمالية',
    drugsList: 'قائمة الأدوية',
    importData: 'استيراد البيانات',
    availableDrugs: 'الأدوية المتوفرة',
    addNewDrug: 'إضافة دواء جديد',
    add: 'إضافة',
    noDrugsRegistered: 'لا توجد أدوية مسجلة. استخدم زر "إضافة دواء" أو "استيراد البيانات"',
    pharmacyOnlyPage: 'هذه الصفحة للصيدليات فقط',
    pharmacyIdentificationError: 'خطأ في التعرف على الصيدلية',
    drugAddedSuccess: 'تمت إضافة الدواء بنجاح',
    drugDeletedSuccess: 'تم حذف الدواء',
    loadingError: 'حدث خطأ في تحميل البيانات',
    addError: 'حدث خطأ في إضافة الدواء',
    deleteError: 'حدث خطأ في حذف الدواء',
    availableQuantity: 'الكمية المتوفرة',
  },
  fr: {
    appName: 'Tales',
    appSubtitle: 'طالص',
    description: 'Trouvez vos médicaments dans la pharmacie la plus proche au meilleur prix',
    loginAsUser: 'Connexion en tant qu\'utilisateur',
    loginAsPharmacy: 'Connexion en tant que pharmacie',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom',
    phone: 'Téléphone',
    pharmacyName: 'Nom de la pharmacie',
    location: 'Emplacement',
    login: 'Connexion',
    register: 'S\'inscrire',
    searchMedicine: 'Rechercher un médicament...',
    nearbyPharmacies: 'Pharmacies à proximité',
    myDrugs: 'Mes médicaments',
    addDrug: 'Ajouter un médicament',
    drugName: 'Nom du médicament',
    price: 'Prix',
    quantity: 'Quantité',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    logout: 'Déconnexion',
    // Home page
    searchYourMedicine: 'Recherchez votre médicament',
    typeMedicineName: 'Tapez le nom du médicament...',
    searchExample: 'Exemple: Paracétamol, Aspirine, Amoxicilline',
    results: 'Résultats',
    showOnMap: 'Afficher sur la carte',
    locationLabel: 'Emplacement',
    call: 'Appeler',
    startSearch: 'Commencer la recherche',
    searchHint: 'Tapez le nom du médicament pour afficher les pharmacies disponibles',
    loading: 'Chargement...',
    pleaseEnterMedicineName: 'Veuillez entrer le nom du médicament',
    searchingDatabase: 'Recherche dans la base de données...',
    // Pharmacy Dashboard
    dashboard: 'Tableau de bord',
    pharmacyManagement: 'Gestion de la pharmacie',
    totalDrugs: 'Total des médicaments',
    totalQuantity: 'Quantité totale',
    drugsList: 'Liste des médicaments',
    importData: 'Importer des données',
    availableDrugs: 'Médicaments disponibles',
    addNewDrug: 'Ajouter un nouveau médicament',
    add: 'Ajouter',
    noDrugsRegistered: 'Aucun médicament enregistré. Utilisez le bouton "Ajouter" ou "Importer"',
    pharmacyOnlyPage: 'Cette page est réservée aux pharmacies',
    pharmacyIdentificationError: 'Erreur d\'identification de la pharmacie',
    drugAddedSuccess: 'Médicament ajouté avec succès',
    drugDeletedSuccess: 'Médicament supprimé',
    loadingError: 'Erreur lors du chargement des données',
    addError: 'Erreur lors de l\'ajout du médicament',
    deleteError: 'Erreur lors de la suppression du médicament',
    availableQuantity: 'Quantité disponible',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'fr' : 'ar';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.ar] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
