import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ne" | "ur" | "zh" | "ja" | "bn" | "hi";

interface LangOption {
  code: Language;
  label: string;
  flag: string;
}

export const languages: LangOption[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard", products: "Products", myKeys: "My Keys", transactions: "Transactions",
    profile: "Profile", signOut: "Sign Out", welcome: "Welcome back", overview: "Here's your account overview.",
    walletPoints: "Wallet Points", totalPurchases: "Total Purchases", availableProducts: "Available Products",
    recentTransactions: "Recent Transactions", browseProducts: "Browse Products", viewAll: "View All Products →",
    settings: "Settings", theme: "Theme", language: "Language", dark: "Dark", light: "Light", eyeProtect: "Eye Protect",
    buyNow: "Buy Now", selectDuration: "Select Duration", confirmPurchase: "Confirm Purchase", cancel: "Cancel",
    keysAvailable: "keys available", outOfStock: "Out of Stock", noProducts: "No products available yet.",
    pts: "pts", points: "Points", days: "days", left: "left",
    profileUpdated: "Profile updated!", yourPhoto: "Your Photo", clickToChangePhoto: "Click to change photo",
    accountDetails: "Account Details", displayName: "Display Name", phoneNumber: "Phone Number",
    saveChanges: "Save Changes", yourPurchasedKeys: "Your purchased access keys.", noKeysPurchased: "No keys purchased yet.",
    purchased: "Purchased", topUp: "Top Up",
  },
  ne: {
    dashboard: "ड्यासबोर्ड", products: "उत्पादनहरू", myKeys: "मेरा कुञ्जीहरू", transactions: "लेनदेनहरू",
    profile: "प्रोफाइल", signOut: "साइन आउट", welcome: "फेरि स्वागत छ", overview: "तपाईंको खाताको सारांश।",
    walletPoints: "वालेट पोइन्ट", totalPurchases: "कुल खरिदहरू", availableProducts: "उपलब्ध उत्पादनहरू",
    recentTransactions: "हालका लेनदेनहरू", browseProducts: "उत्पादनहरू हेर्नुहोस्", viewAll: "सबै उत्पादनहरू हेर्नुहोस् →",
    settings: "सेटिङ्स", theme: "थिम", language: "भाषा", dark: "डार्क", light: "लाइट", eyeProtect: "आँखा सुरक्षा",
    buyNow: "किन्नुहोस्", selectDuration: "अवधि छान्नुहोस्", confirmPurchase: "खरिद पुष्टि", cancel: "रद्द",
    keysAvailable: "कुञ्जीहरू उपलब्ध", outOfStock: "स्टक सकियो", noProducts: "अहिलेसम्म कुनै उत्पादन छैन।",
    pts: "पोइन्ट", points: "पोइन्ट", days: "दिन", left: "बाँकी",
    profileUpdated: "प्रोफाइल अपडेट भयो!", yourPhoto: "तपाईंको फोटो", clickToChangePhoto: "फोटो परिवर्तन गर्नुहोस्",
    accountDetails: "खाता विवरण", displayName: "प्रदर्शन नाम", phoneNumber: "फोन नम्बर",
    saveChanges: "परिवर्तन सेभ गर्नुहोस्", yourPurchasedKeys: "तपाईंले किनेका कुञ्जीहरू।", noKeysPurchased: "अहिलेसम्म कुनै कुञ्जी किनिएको छैन।",
    purchased: "किनिएको",
  },
  ur: {
    dashboard: "ڈیش بورڈ", products: "مصنوعات", myKeys: "میری چابیاں", transactions: "لین دین",
    profile: "پروفائل", signOut: "سائن آؤٹ", welcome: "واپسی پر خوش آمدید", overview: "آپ کے اکاؤنٹ کا جائزہ۔",
    walletPoints: "والیٹ پوائنٹس", totalPurchases: "کل خریداری", availableProducts: "دستیاب مصنوعات",
    recentTransactions: "حالیہ لین دین", browseProducts: "مصنوعات دیکھیں", viewAll: "تمام مصنوعات دیکھیں →",
    settings: "ترتیبات", theme: "تھیم", language: "زبان", dark: "ڈارک", light: "لائٹ", eyeProtect: "آنکھوں کی حفاظت",
    buyNow: "ابھی خریدیں", selectDuration: "مدت منتخب کریں", confirmPurchase: "خریداری کی تصدیق", cancel: "منسوخ",
    keysAvailable: "چابیاں دستیاب", outOfStock: "اسٹاک ختم", noProducts: "ابھی تک کوئی مصنوعات دستیاب نہیں۔",
    pts: "پوائنٹس", points: "پوائنٹس", days: "دن", left: "باقی",
  },
  zh: {
    dashboard: "仪表板", products: "产品", myKeys: "我的密钥", transactions: "交易记录",
    profile: "个人资料", signOut: "退出", welcome: "欢迎回来", overview: "这是您的账户概览。",
    walletPoints: "钱包积分", totalPurchases: "总购买量", availableProducts: "可用产品",
    recentTransactions: "最近交易", browseProducts: "浏览产品", viewAll: "查看所有产品 →",
    settings: "设置", theme: "主题", language: "语言", dark: "深色", light: "浅色", eyeProtect: "护眼模式",
    buyNow: "立即购买", selectDuration: "选择时长", confirmPurchase: "确认购买", cancel: "取消",
    keysAvailable: "个密钥可用", outOfStock: "缺货", noProducts: "暂无可用产品。",
    pts: "积分", points: "积分", days: "天", left: "剩余",
  },
  ja: {
    dashboard: "ダッシュボード", products: "製品", myKeys: "マイキー", transactions: "取引履歴",
    profile: "プロフィール", signOut: "サインアウト", welcome: "おかえりなさい", overview: "アカウントの概要です。",
    walletPoints: "ウォレットポイント", totalPurchases: "購入総数", availableProducts: "利用可能な製品",
    recentTransactions: "最近の取引", browseProducts: "製品を見る", viewAll: "すべての製品を見る →",
    settings: "設定", theme: "テーマ", language: "言語", dark: "ダーク", light: "ライト", eyeProtect: "目の保護",
    buyNow: "今すぐ購入", selectDuration: "期間を選択", confirmPurchase: "購入確認", cancel: "キャンセル",
    keysAvailable: "キー利用可能", outOfStock: "在庫切れ", noProducts: "まだ製品がありません。",
    pts: "ポイント", points: "ポイント", days: "日", left: "残り",
  },
  bn: {
    dashboard: "ড্যাশবোর্ড", products: "পণ্য", myKeys: "আমার কী", transactions: "লেনদেন",
    profile: "প্রোফাইল", signOut: "সাইন আউট", welcome: "স্বাগতম", overview: "আপনার অ্যাকাউন্টের সারসংক্ষেপ।",
    walletPoints: "ওয়ালেট পয়েন্ট", totalPurchases: "মোট কেনাকাটা", availableProducts: "উপলব্ধ পণ্য",
    recentTransactions: "সাম্প্রতিক লেনদেন", browseProducts: "পণ্য দেখুন", viewAll: "সব পণ্য দেখুন →",
    settings: "সেটিংস", theme: "থিম", language: "ভাষা", dark: "ডার্ক", light: "লাইট", eyeProtect: "চোখ সুরক্ষা",
    buyNow: "এখনই কিনুন", selectDuration: "সময়কাল নির্বাচন", confirmPurchase: "কেনাকাটা নিশ্চিত", cancel: "বাতিল",
    keysAvailable: "কী উপলব্ধ", outOfStock: "স্টক শেষ", noProducts: "এখনও কোনো পণ্য নেই।",
    pts: "পয়েন্ট", points: "পয়েন্ট", days: "দিন", left: "বাকি",
  },
  hi: {
    dashboard: "डैशबोर्ड", products: "उत्पाद", myKeys: "मेरी कुंजियाँ", transactions: "लेन-देन",
    profile: "प्रोफ़ाइल", signOut: "साइन आउट", welcome: "वापसी पर स्वागत है", overview: "आपके खाते का सारांश।",
    walletPoints: "वॉलेट पॉइंट", totalPurchases: "कुल खरीदारी", availableProducts: "उपलब्ध उत्पाद",
    recentTransactions: "हाल के लेन-देन", browseProducts: "उत्पाद ब्राउज़ करें", viewAll: "सभी उत्पाद देखें →",
    settings: "सेटिंग्स", theme: "थीम", language: "भाषा", dark: "डार्क", light: "लाइट", eyeProtect: "आँख सुरक्षा",
    buyNow: "अभी खरीदें", selectDuration: "अवधि चुनें", confirmPurchase: "खरीदारी की पुष्टि", cancel: "रद्द करें",
    keysAvailable: "कुंजियाँ उपलब्ध", outOfStock: "स्टॉक में नहीं", noProducts: "अभी तक कोई उत्पाद उपलब्ध नहीं।",
    pts: "पॉइंट", points: "पॉइंट", days: "दिन", left: "बाकी",
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("app-language") as Language | null;
    if (saved) setLangState(saved);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("app-language", l);
  };

  const t = (key: string) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
