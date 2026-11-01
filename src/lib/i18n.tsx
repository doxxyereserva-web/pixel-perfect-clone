import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createAutoTranslator } from './autoTranslate';
import { translateBatch } from './translate.functions';

export type Key = 'projects' | 'workspaces' | 'mascot' | 'access' | 'eyebrow' | 'title1' | 'title2' | 'sub' | 'cta' | 'soon' | 'enter';
type Row = [code: string, name: string, ...values: string[]];

// Order: projects, workspaces, mascot, access, eyebrow, title1, title2, sub, cta, soon, enter
const rows: Row[] = [
  ['en', 'English', 'Projects', 'Workspaces', 'Meet Ágata', 'Sign in', 'The Roblox development platform', 'Create beyond', 'limits.', 'Projects, tools and AI — organised for the worlds you build.', 'Get started', 'In development', 'Open your space'],
  ['pt', 'Português', 'Projetos', 'Workspaces', 'Conheça a Ágata', 'Entrar', 'A plataforma de desenvolvimento Roblox', 'Crie além dos', 'limites.', 'Projetos, ferramentas e IA — organizados para os mundos que você cria.', 'Começar', 'Em desenvolvimento', 'Abrir meu espaço'],
  ['es', 'Español', 'Proyectos', 'Espacios', 'Conoce a Ágata', 'Iniciar sesión', 'La plataforma de desarrollo Roblox', 'Crea más allá de los', 'límites.', 'Proyectos, herramientas e IA, organizados para los mundos que creas.', 'Empezar', 'En desarrollo', 'Abrir tu espacio'],
  ['fr', 'Français', 'Projets', 'Espaces', 'Découvrez Ágata', 'Se connecter', 'La plateforme de développement Roblox', 'Créez au-delà des', 'limites.', 'Projets, outils et IA, organisés pour les mondes que vous créez.', 'Commencer', 'En développement', 'Ouvrir ton espace'],
  ['de', 'Deutsch', 'Projekte', 'Workspaces', 'Lerne Ágata kennen', 'Anmelden', 'Die Roblox-Entwicklungsplattform', 'Erschaffe über alle', 'Grenzen.', 'Projekte, Werkzeuge und KI – geordnet für deine Welten.', 'Loslegen', 'In Entwicklung', 'Deinen Bereich öffnen'],
  ['it', 'Italiano', 'Progetti', 'Workspace', 'Scopri Ágata', 'Accedi', 'La piattaforma di sviluppo Roblox', 'Crea oltre i', 'limiti.', 'Progetti, strumenti e IA, organizzati per i mondi che crei.', 'Inizia', 'In sviluppo', 'Apri il tuo spazio'],
  ['nl', 'Nederlands', 'Projecten', 'Werkruimtes', 'Maak kennis met Ágata', 'Inloggen', 'Het Roblox-ontwikkelplatform', 'Creëer voorbij', 'grenzen.', 'Projecten, tools en AI — geordend voor de werelden die je bouwt.', 'Beginnen', 'In ontwikkeling', 'Open je ruimte'],
  ['pl', 'Polski', 'Projekty', 'Przestrzenie', 'Poznaj Ágatę', 'Zaloguj się', 'Platforma do tworzenia w Roblox', 'Twórz bez', 'granic.', 'Projekty, narzędzia i AI — uporządkowane dla twoich światów.', 'Zacznij', 'W budowie', 'Otwórz swoją przestrzeń'],
  ['ru', 'Русский', 'Проекты', 'Пространства', 'Знакомьтесь, Ágata', 'Войти', 'Платформа разработки для Roblox', 'Создавайте без', 'границ.', 'Проекты, инструменты и ИИ — для миров, которые вы строите.', 'Начать', 'В разработке', 'Открыть своё пространство'],
  ['uk', 'Українська', 'Проєкти', 'Простори', 'Знайомтеся, Ágata', 'Увійти', 'Платформа розробки для Roblox', 'Створюйте без', 'меж.', 'Проєкти, інструменти та ШІ — для світів, які ви будуєте.', 'Почати', 'У розробці', 'Відкрити свій простір'],
  ['tr', 'Türkçe', 'Projeler', 'Çalışma alanları', 'Ágata ile tanışın', 'Giriş yap', 'Roblox geliştirme platformu', 'Sınırların ötesinde', 'yarat.', 'Projeler, araçlar ve yapay zekâ — kurduğun dünyalar için.', 'Başla', 'Geliştiriliyor', 'Alanını aç'],
  ['ar', 'العربية', 'المشاريع', 'مساحات العمل', 'تعرّف على Ágata', 'تسجيل الدخول', 'منصة تطوير Roblox', 'اصنع ما وراء', 'الحدود.', 'مشاريع وأدوات وذكاء اصطناعي منظمة للعوالم التي تبنيها.', 'ابدأ', 'قيد التطوير', 'افتح مساحتك'],
  ['he', 'עברית', 'פרויקטים', 'סביבות עבודה', 'הכירו את Ágata', 'התחברות', 'פלטפורמת הפיתוח ל-Roblox', 'צרו מעבר', 'לגבולות.', 'פרויקטים, כלים ובינה מלאכותית — לעולמות שאתם בונים.', 'התחילו', 'בפיתוח', 'פתחו את המרחב שלכם'],
  ['fa', 'فارسی', 'پروژه\u200cها', 'فضاهای کاری', 'با Ágata آشنا شوید', 'ورود', 'پلتفرم توسعه Roblox', 'فراتر از', 'مرزها بساز.', 'پروژه\u200cها، ابزارها و هوش مصنوعی برای دنیاهایی که می\u200cسازی.', 'شروع کنید', 'در حال توسعه', 'فضای خودت را باز کن'],
  ['hi', 'हिन्दी', 'प्रोजेक्ट', 'वर्कस्पेस', 'मिलिए Ágata से', 'साइन इन', 'Roblox डेवलपमेंट प्लेटफ़ॉर्म', 'सीमाओं से परे', 'रचें।', 'प्रोजेक्ट, टूल और AI — आपकी दुनिया के लिए व्यवस्थित।', 'शुरू करें', 'विकास में', 'अपनी जगह खोलें'],
  ['bn', 'বাংলা', 'প্রজেক্ট', 'ওয়ার্কস্পেস', 'Ágata-র সাথে পরিচিত হন', 'সাইন ইন', 'Roblox ডেভেলপমেন্ট প্ল্যাটফর্ম', 'সীমার বাইরে', 'সৃষ্টি করুন।', 'প্রজেক্ট, টুল ও AI — আপনার জগতের জন্য সাজানো।', 'শুরু করুন', 'নির্মাণাধীন', 'আপনার স্পেস খুলুন'],
  ['ur', 'اردو', 'پروجیکٹس', 'ورک اسپیس', 'Ágata سے ملیں', 'سائن ان', 'Roblox ڈیولپمنٹ پلیٹ فارم', 'حدوں سے آگے', 'تخلیق کریں۔', 'پروجیکٹس، ٹولز اور AI — آپ کی دنیاؤں کے لیے۔', 'شروع کریں', 'زیرِ تعمیر', 'اپنی جگہ کھولیں'],
  ['zh', '中文', '项目', '工作区', '认识 Ágata', '登录', 'Roblox 开发平台', '创造，', '无限可能。', '项目、工具与 AI——为你构建的世界而整理。', '开始使用', '开发中', '进入你的空间'],
  ['zh-TW', '繁體中文', '專案', '工作區', '認識 Ágata', '登入', 'Roblox 開發平台', '創造，', '無限可能。', '專案、工具與 AI——為你打造的世界而整理。', '開始使用', '開發中', '進入你的空間'],
  ['ja', '日本語', 'プロジェクト', 'ワークスペース', 'Ágata に会う', 'ログイン', 'Roblox 開発プラットフォーム', '限界を超えて', '創ろう。', 'プロジェクト、ツール、AI を、あなたの世界のために。', 'はじめる', '開発中', '自分のスペースを開く'],
  ['ko', '한국어', '프로젝트', '워크스페이스', 'Ágata를 만나보세요', '로그인', 'Roblox 개발 플랫폼', '한계를 넘어', '창조하세요.', '프로젝트, 도구, AI — 당신이 만드는 세계를 위해.', '시작하기', '개발 중', '내 공간 열기'],
  ['vi', 'Tiếng Việt', 'Dự án', 'Không gian', 'Gặp Ágata', 'Đăng nhập', 'Nền tảng phát triển Roblox', 'Sáng tạo vượt', 'giới hạn.', 'Dự án, công cụ và AI — cho những thế giới bạn xây dựng.', 'Bắt đầu', 'Đang phát triển', 'Mở không gian của bạn'],
  ['th', 'ไทย', 'โปรเจกต์', 'เวิร์กสเปซ', 'พบกับ Ágata', 'เข้าสู่ระบบ', 'แพลตฟอร์มพัฒนา Roblox', 'สร้างสรรค์เหนือ', 'ขีดจำกัด', 'โปรเจกต์ เครื่องมือ และ AI สำหรับโลกที่คุณสร้าง', 'เริ่มต้น', 'กำลังพัฒนา', 'เปิดพื้นที่ของคุณ'],
  ['id', 'Bahasa Indonesia', 'Proyek', 'Ruang kerja', 'Kenalan dengan Ágata', 'Masuk', 'Platform pengembangan Roblox', 'Berkarya melampaui', 'batas.', 'Proyek, alat, dan AI — untuk dunia yang kamu bangun.', 'Mulai', 'Dalam pengembangan', 'Buka ruangmu'],
  ['ms', 'Bahasa Melayu', 'Projek', 'Ruang kerja', 'Kenali Ágata', 'Log masuk', 'Platform pembangunan Roblox', 'Cipta melangkaui', 'batasan.', 'Projek, alat dan AI — untuk dunia yang anda bina.', 'Mula', 'Dalam pembangunan', 'Buka ruang anda'],
  ['fil', 'Filipino', 'Mga proyekto', 'Workspace', 'Kilalanin si Ágata', 'Mag-sign in', 'Ang Roblox development platform', 'Lumikha nang lampas sa', 'hangganan.', 'Mga proyekto, tool at AI — para sa mga mundong binubuo mo.', 'Magsimula', 'Ginagawa pa', 'Buksan ang iyong space'],
  ['sv', 'Svenska', 'Projekt', 'Arbetsytor', 'Möt Ágata', 'Logga in', 'Plattformen för Roblox-utveckling', 'Skapa bortom', 'gränserna.', 'Projekt, verktyg och AI — ordnat för världarna du bygger.', 'Kom igång', 'Under utveckling', 'Öppna ditt utrymme'],
  ['no', 'Norsk', 'Prosjekter', 'Arbeidsområder', 'Møt Ágata', 'Logg inn', 'Plattformen for Roblox-utvikling', 'Skap forbi', 'grensene.', 'Prosjekter, verktøy og KI — for verdenene du bygger.', 'Kom i gang', 'Under utvikling', 'Åpne ditt område'],
  ['da', 'Dansk', 'Projekter', 'Arbejdsområder', 'Mød Ágata', 'Log ind', 'Platformen til Roblox-udvikling', 'Skab ud over', 'grænserne.', 'Projekter, værktøjer og AI — til de verdener, du bygger.', 'Kom i gang', 'Under udvikling', 'Åbn dit område'],
  ['fi', 'Suomi', 'Projektit', 'Työtilat', 'Tapaa Ágata', 'Kirjaudu', 'Roblox-kehitysalusta', 'Luo yli', 'rajojen.', 'Projektit, työkalut ja tekoäly — rakentamiisi maailmoihin.', 'Aloita', 'Kehitteillä', 'Avaa tilasi'],
  ['cs', 'Čeština', 'Projekty', 'Pracovní prostory', 'Seznamte se s Ágatou', 'Přihlásit se', 'Platforma pro vývoj v Roblox', 'Tvořte bez', 'hranic.', 'Projekty, nástroje a AI — pro světy, které stavíte.', 'Začít', 'Ve vývoji', 'Otevřít tvůj prostor'],
  ['sk', 'Slovenčina', 'Projekty', 'Pracovné priestory', 'Spoznajte Ágatu', 'Prihlásiť sa', 'Platforma na vývoj v Roblox', 'Tvorte bez', 'hraníc.', 'Projekty, nástroje a AI — pre svety, ktoré staviate.', 'Začať', 'Vo vývoji', 'Otvoriť svoj priestor'],
  ['hu', 'Magyar', 'Projektek', 'Munkaterek', 'Ismerd meg Ágatát', 'Bejelentkezés', 'A Roblox fejlesztői platform', 'Alkoss határok', 'nélkül.', 'Projektek, eszközök és MI — az általad épített világokhoz.', 'Kezdjük el', 'Fejlesztés alatt', 'Nyisd meg a területed'],
  ['ro', 'Română', 'Proiecte', 'Spații de lucru', 'Cunoaște-o pe Ágata', 'Conectare', 'Platforma de dezvoltare Roblox', 'Creează dincolo de', 'limite.', 'Proiecte, unelte și AI — pentru lumile pe care le construiești.', 'Începe', 'În dezvoltare', 'Deschide spațiul tău'],
  ['el', 'Ελληνικά', 'Έργα', 'Χώροι εργασίας', 'Γνωρίστε την Ágata', 'Σύνδεση', 'Η πλατφόρμα ανάπτυξης Roblox', 'Δημιούργησε πέρα από τα', 'όρια.', 'Έργα, εργαλεία και AI — για τους κόσμους που χτίζεις.', 'Ξεκίνα', 'Σε ανάπτυξη', 'Άνοιξε τον χώρο σου'],
  ['bg', 'Български', 'Проекти', 'Работни пространства', 'Запознайте се с Ágata', 'Вход', 'Платформата за разработка в Roblox', 'Създавай отвъд', 'границите.', 'Проекти, инструменти и ИИ — за световете, които градиш.', 'Започни', 'В разработка', 'Отвори своето пространство'],
  ['hr', 'Hrvatski', 'Projekti', 'Radni prostori', 'Upoznajte Ágatu', 'Prijava', 'Platforma za razvoj u Robloxu', 'Stvaraj iznad', 'granica.', 'Projekti, alati i AI — za svjetove koje gradiš.', 'Počni', 'U razvoju', 'Otvori svoj prostor'],
  ['sw', 'Kiswahili', 'Miradi', 'Nafasi za kazi', 'Mjue Ágata', 'Ingia', 'Jukwaa la kutengeneza Roblox', 'Unda zaidi ya', 'mipaka.', 'Miradi, zana na AI — kwa ulimwengu unaoujenga.', 'Anza', 'Inaendelezwa', 'Fungua nafasi yako'],
  ['ca', 'Català', 'Projectes', 'Espais de treball', 'Coneix l’Ágata', 'Inicia la sessió', 'La plataforma de desenvolupament Roblox', 'Crea més enllà dels', 'límits.', 'Projectes, eines i IA — per als mons que construeixes.', 'Comença', 'En desenvolupament', 'Obre el teu espai'],
];

export const languages = rows.map(([code, name]) => ({ code, name }));
const keys: Key[] = ['projects','workspaces','mascot','access','eyebrow','title1','title2','sub','cta','soon','enter'];
const dict: Record<string, Record<Key, string>> & { en: Record<Key, string> } = Object.fromEntries(rows.map(([code, , ...v]) => [code, Object.fromEntries(keys.map((k, i) => [k, v[i]])) as Record<Key, string>])) as never;
const rtl = new Set(['ar', 'he', 'fa', 'ur']);

/** Picks the best supported language for a list of browser locales (e.g. navigator.languages). */
export function matchLanguage(locales: readonly string[]): string {
  for (const raw of locales) {
    const l = raw.toLowerCase();
    if (l.startsWith('zh')) return /tw|hk|mo|hant/.test(l) ? 'zh-TW' : 'zh';
    if (l.startsWith('nb') || l.startsWith('nn')) return 'no';
    if (l.startsWith('tl')) return 'fil';
    const base = l.split('-')[0] ?? '';
    if (dict[base]) return base;
  }
  return 'en';
}

const Ctx = createContext<{ lang: string; t: (k: Key) => string; setLang: (c: string) => void }>({ lang: 'en', t: k => dict.en[k], setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState('en');
  useEffect(() => { setLangState(localStorage.getItem('agata-lang') ?? matchLanguage(navigator.languages ?? [navigator.language])); }, []);
  const translator = useRef<ReturnType<typeof createAutoTranslator> | null>(null);
  useEffect(() => {
    const tr = createAutoTranslator((l, texts) => translateBatch({ data: { lang: l, texts } }));
    translator.current = tr; tr.start();
    return () => tr.stop();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang; document.documentElement.dir = rtl.has(lang) ? 'rtl' : 'ltr';
    // Let React render the keyed strings for the new language first, then translate the rest.
    const id = requestAnimationFrame(() => translator.current?.setLang(lang));
    return () => cancelAnimationFrame(id);
  }, [lang]);
  const setLang = (c: string) => { localStorage.setItem('agata-lang', c); setLangState(c); };
  return <Ctx.Provider value={{ lang, setLang, t: k => (dict[lang] ?? dict.en)[k] }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
