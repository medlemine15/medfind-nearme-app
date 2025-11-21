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
