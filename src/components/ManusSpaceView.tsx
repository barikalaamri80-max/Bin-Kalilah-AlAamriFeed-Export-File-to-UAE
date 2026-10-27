import React, { useState } from 'react';
import {
  ORIGINAL_10_AUDIO_CHAPTERS,
  CORPORATE_SEAL_LOGO,
  OriginalAudioChapter,
} from '../data/dossierData';
import { Volume2, Pause, Play, Lock } from 'lucide-react';

interface ManusSpaceViewProps {
  activeChapterIndex: number | null;
  isPlayingFull: boolean;
  onPlayChapter: (chapter: OriginalAudioChapter, index: number, chain?: boolean) => void;
  onStopAudio: () => void;
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
  audioSrc: string;
  onSwitchToRoyal: () => void;
}

const MANUS_TIMELINE = [
  {
    index: '01',
    date: '2023 – 2025',
    title: 'سابقة سوق صلالة',
    desc: 'مراسلات ومذكرات حول عدالة المنافسة والدعم اللوجستي، أعقبها إغلاق المسار المحلي والانتقال نحو التصدير غير النفطي.',
  },
  {
    index: '02',
    date: 'أواخر أبريل 2026',
    title: 'تأسيس خط التصدير (بركة الوقن)',
    desc: 'تقديم أمر الشراء وجدول الإمداد وبدء مسار تصديري جديد للمنتجات الوطنية لصالح العميل النهائي مزرعة بركة الوقن.',
  },
  {
    index: '03',
    date: '01 مايو 2026',
    title: 'العبور الأول',
    desc: 'عبور الشحنة الأولى عبر منفذ خطم الشكلة وفق المستندات الجمركية المرفقة في الملف.',
  },
  {
    index: '04',
    date: '07 مايو 2026',
    title: 'نقطة التحول وخنق خط التصدير',
    desc: 'حجب المستندات البيطرية الإلزامية وتدوير الملف بين خمسة مكاتب لاستنزاف المخزون ودفع العميل قسراً نحو الوسيط الخارجي (نوفل).',
  },
  {
    index: '05',
    date: '23 يونيو 2026',
    title: 'تعارض COA والبطاقة',
    desc: 'إصدار شهادة تحليل لا تتطابق مع البيانات المطبوعة على البطاقة، وتعليق مسار التسجيل في نظام MOCCAE.',
  },
  {
    index: '06',
    date: 'أكتوبر 2026',
    title: 'المذكرات الرقابية (الفاضل خالد المسروري)',
    desc: 'توجيه مذكرات واستفسارات رسمية بعناية الفاضل خالد المسروري للمطالبة بالتصحيح المستندي وحماية الصادرات غير النفطية.',
  },
];

const MANUS_QUICK_PROMPTS = [
  'ما هي الأدلة؟',
  'من هو الوسيط نوفل؟',
  'ما هو السند القانوني؟',
  'ما هي مدة التعطيل؟',
];

export const ManusSpaceView: React.FC<ManusSpaceViewProps> = ({
  activeChapterIndex,
  isPlayingFull,
  onPlayChapter,
  onStopAudio,
  audioElementRef,
  audioSrc,
  onSwitchToRoyal,
}) => {
  const [chatItems, setChatItems] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'مرحباً بكم في ملف «تحديات التنويع الاقتصادي: عوائق أمام الصادرات غير النفطية في مسار رؤية عُمان 2040» الخاص بشركة بن كليلة العامري للتجارة والاستثمار (ملف المراجع: الفاضل خالد المسروري). أستطيع شرح الأدلة، التسلسل الزمني، والسند القانوني.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordVal, setPasswordVal] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const getAssistantReply = (input: string) => {
    const text = input.trim();
    if (
      ['أموال', 'مال', 'تعويض', 'مبلغ', 'شحنات محتجزة', 'مبالغ'].some((word) =>
        text.includes(word)
      )
    ) {
      return 'شركة بن كليلة العامري للتجارة والاستثمار ملتزمة بالسداد النقدي المسبق 100% (18,640 ر.ع). القضية هي تعطيل إجرائي وتناقض مستندي وامتناع ضمني عن تسليم ملحقات المبيع في مسار رؤية عُمان 2040.';
    }
    if (
      ['تأخير', 'تعطيل', 'مدة', 'كم شهر', '57', 'خمس أشهر'].some((word) => text.includes(word))
    ) {
      return '5 أشهر و18 يوماً من التعطيل الإجرائي أمام الصادرات غير النفطية في مسار رؤية عُمان 2040.';
    }
    if (['قانون', 'مرسوم', 'المادة', 'سند', 'تشريع'].some((word) => text.includes(word))) {
      return 'المرسوم السلطاني 67/2014 (المادتان 9 و10 من قانون حماية المنافسة ومنع الاحتكار) والمرسوم السلطاني 29/2013 (المادة 381 والمادتان 155 و156 من قانون المعاملات المدنية).';
    }
    if (['دليل', 'أدلة', 'إثبات', 'وثيقة'].some((word) => text.includes(word))) {
      return 'الأدلة المرفوعة في ملف المراجع الفاضل خالد المسروري تشمل طلب التشغيل في 7 مايو 2026، إشعارات السداد المسبق 100%، مقارنة شهادة التحليل COA (23 يونيو 2026) بالبطاقة التعريفية، وإشعار نظام MOCCAE رقم (APH-12052026-3382929).';
    }
    if (['وسيط', 'نوفل', 'عميل', 'قناة', 'الوقن'].some((word) => text.includes(word))) {
      return 'يوثق الملف والتسجيل الصوتي للمكالمة الثلاثية (30 دقيقة) حجب المستندات البيطرية الإلزامية لخنق خط التصدير واستنزاف مخزون المزرعة (160,000 طير) بهدف إجبار العميل على اللجوء للوسيط الخارجي (نوفل)، فضلاً عن احتجاز الشاحنات 4 أيام بعد استلام مقدم النقل (700 ر.ع) وفرض إتاوة 50 ر.ع لكل شحنة.';
    }
    return 'يمكنني شرح الأدلة، دور الوسيط (نوفل)، مدة التعطيل (5 أشهر و18 يوماً)، أو السند القانوني ضمن ملف المراجع الفاضل خالد المسروري.';
  };

  const sendMessage = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const reply = getAssistantReply(trimmed);
    setChatItems((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: reply },
    ]);
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-milky-canvas text-[#23113d]" dir="rtl">
      {/* Password Gate Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-5 bg-[#1e0b36]/80 backdrop-blur-sm">
          <div className="w-full max-w-[430px] p-7 border-2 border-[#c9a452] rounded-3xl bg-[#faf7f0] shadow-2xl text-center">
            <div className="inline-flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-[#e7cb82] to-[#b58932] shadow-lg">
                <img
                  src={CORPORATE_SEAL_LOGO}
                  alt="شركة بن كليلة العامري للتجارة والاستثمار"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <span className="font-extrabold text-sm text-[#2b124c] mt-1">
                شركة بن كليلة العامري للتجارة والاستثمار
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#9d7524]">
                OMAN VISION 2040 · EXPORT CASE
              </span>
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-[#2b124c]">الدخول إلى الملف الرقابي</h2>
            <p className="mt-2 text-xs text-[#594a6e] leading-relaxed">
              أدخل الرقم السري (<code className="font-mono font-bold text-[#2b124c]">SALALAH2026</code>) للوصول إلى المحاكاة الصوتية والمساعد القانوني.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordVal.toUpperCase() === 'SALALAH2026') {
                  setShowPasswordModal(false);
                  setPasswordVal('');
                  setPasswordErr('');
                } else {
                  setPasswordErr('الرقم السري غير صحيح. جرب SALALAH2026');
                }
              }}
              className="flex gap-2 mt-5"
            >
              <input
                type="text"
                value={passwordVal}
                onChange={(e) => setPasswordVal(e.target.value)}
                placeholder="SALALAH2026"
                dir="ltr"
                className="flex-1 border border-[#d6c39b] rounded-xl px-3 py-3 text-left font-mono text-sm bg-white focus:outline-none focus:border-[#2b124c]"
              />
              <button
                type="submit"
                className="rounded-xl px-5 bg-[#2b124c] hover:bg-[#3c1a69] text-[#e7cb82] border border-[#c9a452] text-xs font-extrabold cursor-pointer"
              >
                دخول
              </button>
            </form>
            {passwordErr && (
              <p className="mt-2.5 text-red-700 text-[11px] font-bold">{passwordErr}</p>
            )}
          </div>
        </div>
      )}

      {/* Sub-navigation bar */}
      <header className="bg-[#f4efe2]/95 backdrop-blur-md border-b border-[#dccaa3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <a href="#top" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-b from-[#e7cb82] to-[#b58932] shadow-md shrink-0">
              <img
                src={CORPORATE_SEAL_LOGO}
                alt="شعار شركة بن كليلة العامري للتجارة والاستثمار"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div>
              <span className="block font-extrabold text-xs sm:text-sm text-[#2b124c] leading-tight">
                شركة بن كليلة العامري للتجارة والاستثمار
              </span>
              <span className="block text-[11px] font-bold text-[#9c7625]">
                ملف المراجع: الفاضل خالد المسروري
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#3d2260]">
            <a href="#brief" className="hover:text-[#9c7625] transition-colors">
              الموجز التنفيذي
            </a>
            <a href="#timeline" className="hover:text-[#9c7625] transition-colors">
              التسلسل الزمني
            </a>
            <a href="#podcast" className="hover:text-[#9c7625] transition-colors">
              التسجيل الصوتي (10 فصول)
            </a>
            <a href="#assistant" className="hover:text-[#9c7625] transition-colors">
              المساعد الذكي
            </a>
            <a href="#legal" className="hover:text-[#9c7625] transition-colors">
              السند القانوني
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-2 rounded-xl border border-[#c9a452] bg-white hover:bg-[#faf3e3] text-[#2b124c] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#b3872d]" />
              <span>بوابة SALALAH2026</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToRoyal}
              className="px-3.5 py-2.5 rounded-xl bg-[#2b124c] hover:bg-[#3b1b64] text-[#e7cb82] border border-[#c9a452] text-xs font-extrabold cursor-pointer"
            >
              عرض القالب الرئيسي الشامل ↗
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="top"
        className="relative overflow-hidden border-b-2 border-[#c9a452] py-14 lg:py-18"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full gold-metallic-card text-xs font-extrabold mb-4">
              <span>ملف المراجع: الفاضل خالد المسروري · رؤية عُمان 2040</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-[#2b124c] leading-[1.3]">
              تحديات التنويع الاقتصادي:
              <span className="block mt-2 text-[#8d6518]">
                عوائق أمام الصادرات غير النفطية في مسار رؤية عُمان 2040
              </span>
            </h1>
            <p className="mt-5 text-[#4a3963] text-sm sm:text-base leading-[2]">
              ملف رقابي تفاعلي وبودكاست استقصائي يوثق مسار شركة بن كليلة العامري للتجارة والاستثمار
              للتصدير إلى العميل النهائي (مزرعة بركة الوقن)، ويجمع بين التسلسل التشغيلي، مصفوفة الأدلة،
              والسند القانوني.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a
                href="#podcast"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 gold-metallic-card text-xs font-extrabold shadow-md transition-all"
              >
                <span>▶️ استمع إلى المحاكاة الصوتية (08:39)</span>
              </a>
              <a
                href="#assistant"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 royal-purple-box text-[#e7cb82] text-xs font-extrabold transition-all"
              >
                <span>💬 اسأل المساعد الذكي</span>
              </a>
            </div>
          </div>

          <aside className="lg:col-span-5 p-6 rounded-3xl royal-purple-box text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#c9a452]/40">
              <div>
                <div className="text-[#e7cb82] font-mono text-[10px] tracking-widest" dir="ltr">
                  OMAN VISION 2040 · EXPORT CASE
                </div>
                <h2 className="mt-1 text-xl font-extrabold text-white">بطاقة تعريف الملف</h2>
              </div>
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-b from-[#e7cb82] to-[#b58932] shrink-0">
                <img
                  src={CORPORATE_SEAL_LOGO}
                  alt="شعار الشركة"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 py-4">
              <div className="p-3 rounded-xl bg-white/10 border border-[#c9a452]/40">
                <small className="block text-[#e7cb82] text-[10px] font-bold">الشركة المصدّرة</small>
                <strong className="block mt-1 text-xs font-extrabold text-white">
                  شركة بن كليلة العامري للتجارة والاستثمار
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-[#c9a452]/40">
                <small className="block text-[#e7cb82] text-[10px] font-bold">المسؤول المراجع</small>
                <strong className="block mt-1 text-xs font-extrabold text-white">
                  الفاضل خالد المسروري
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-[#c9a452]/40">
                <small className="block text-[#e7cb82] text-[10px] font-bold">العميل النهائي</small>
                <strong className="block mt-1 text-xs font-extrabold text-white">
                  مزرعة بركة الوقن
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-[#c9a452]/40">
                <small className="block text-[#e7cb82] text-[10px] font-bold">الوسيط المتدخل</small>
                <strong className="block mt-1 text-xs font-extrabold text-white">
                  نوفل (أطواف جلوبال)
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl gold-metallic-card text-xs font-bold leading-relaxed text-center">
              التوصيف المعتمد: تعطيل إجرائي · تناقض مستندي (COA) · امتناع ضمني عن تسليم ملحقات المبيع
            </div>
          </aside>
        </div>
      </section>

      {/* Section 01: Executive Brief */}
      <section id="brief" className="py-14 lg:py-18">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="inline-flex items-center gap-2 text-[#9c7625] text-xs font-extrabold tracking-widest mb-3">
              <span className="w-6 h-0.5 bg-[#c9a452] inline-block" />
              <span>01 · EXECUTIVE BRIEF</span>
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2b124c] leading-tight">
              الوقائع أولاً، ثم التكييف القانوني في مسار رؤية عُمان 2040
            </h2>
            <p className="mt-4 text-[#4a3963] text-sm leading-[2]">
              يضع هذا العرض المسار التشغيلي لشركة بن كليلة العامري للتجارة والاستثمار أمام الفاضل
              خالد المسروري وجهات الاختصاص قبل الانتقال إلى التوصيف القانوني.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: 'مصفوفة الأدلة',
                icon: '▤',
                title: 'وثائق متعارضة ومسار قابل للتتبع',
                desc: 'شهادة التحليل (COA)، البطاقة التعريفية، إقرارات السلامة، والمراسلات تُقرأ كمصفوفة واحدة.',
              },
              {
                label: 'الالتزام النقدي المسبق',
                icon: '100%',
                title: '18,640 ر.ع سداد نقدي مسبق',
                desc: 'جدول 16 تريلا لكل دورة تشغيلية (40 يوماً) لصالح مزرعة بركة الوقن بقيمة عقدية سنوية 1,870,000 ر.ع.',
              },
              {
                label: 'حماية المنافسة',
                icon: '⚖',
                title: 'المادتان 9 و10 (مرسوم 67/2014)',
                desc: 'الإطار المطلوب فحصه هو الاتفاقات والممارسات المحظورة وإساءة استغلال الوضع المهيمن.',
              },
              {
                label: 'خنق خط التصدير',
                icon: '!',
                title: 'الوسيط الخارجي (نوفل) واحتجاز الشاحنات',
                desc: 'حجب الوثائق البيطرية لاستنزاف مخزون المزرعة ودفعها قسراً للوسيط، واحتجاز الشاحنات 4 أيام بعد استلام مقدم النقل (700 ر.ع).',
              },
            ].map((card) => (
              <article
                key={card.title}
                className="p-5 rounded-2xl royal-node-card text-white transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#e7cb82] text-[11px] font-extrabold">{card.label}</span>
                  <span className="px-2.5 py-1 rounded-lg gold-metallic-card text-xs font-black">
                    {card.icon}
                  </span>
                </div>
                <h3 className="mt-3.5 text-base font-extrabold text-white">{card.title}</h3>
                <p className="mt-2 text-[#e8dff5] text-xs leading-[1.9]">{card.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 02: Procedural Timeline */}
      <section
        id="timeline"
        className="py-14 lg:py-18 border-y border-[#dccaa3] bg-[#f3ede0]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[#9c7625] text-xs font-extrabold tracking-widest mb-3">
              <span className="w-6 h-0.5 bg-[#c9a452] inline-block" />
              <span>02 · PROCEDURAL TIMELINE</span>
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2b124c]">
              تسلسل يوضح أين تعطل مسار الصادرات غير النفطية
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {MANUS_TIMELINE.map((item) => (
              <article
                key={item.index}
                className="p-5 border-2 border-[#c9a452] rounded-2xl bg-[#fffdf9] shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-[#2b124c] text-[#e7cb82] border border-[#c9a452] font-mono text-xs font-bold grid place-items-center">
                    {item.index}
                  </span>
                  <span className="text-[#9c7625] text-xs font-extrabold">{item.date}</span>
                </div>
                <h3 className="mt-4 text-base font-extrabold text-[#2b124c]">{item.title}</h3>
                <p className="mt-2 text-[#4a3963] text-xs leading-[1.9]">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 03: Original Audio in 10 Chapters */}
      <section id="podcast" className="py-14 lg:py-18">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="inline-flex items-center gap-2 text-[#e7cb82] text-xs font-extrabold tracking-widest mb-3">
                <span className="w-6 h-0.5 bg-[#c9a452] inline-block" />
                <span>03 · ORIGINAL AUDIO (08:36)</span>
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f3dfa6]">
                التسجيل الصوتي الكامل منسقاً ومكتوباً في محاوره المعتمدة
              </h2>
              <p className="mt-2 text-[#e8dff5] text-sm">
                ملف صوتي موحد (08:36) بصوت المستثمر بريك بن كليلة العامري مع النص الحرفي الكامل لكل محور.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isPlayingFull || activeChapterIndex !== null) {
                  onStopAudio();
                } else {
                  onPlayChapter(ORIGINAL_10_AUDIO_CHAPTERS[0], 0, true);
                }
              }}
              className="rounded-xl px-5 py-3 gold-metallic-card text-xs font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
            >
              {isPlayingFull || activeChapterIndex !== null ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>⏸ إيقاف التسجيل</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>▶️ تشغيل التسجيل الكامل</span>
                </>
              )}
            </button>
          </div>

          <div className="mb-6 p-3 rounded-2xl royal-purple-box">
            <audio
              ref={audioElementRef}
              controls
              preload="metadata"
              src={audioSrc}
              className="w-full"
            />
          </div>

          <div className="grid gap-3">
            {ORIGINAL_10_AUDIO_CHAPTERS.map((item, idx) => {
              const isPlayingThis = activeChapterIndex === idx;
              return (
                <article
                  key={item.index}
                  className={`p-4 sm:p-5 border-2 rounded-2xl transition-all ${
                    isPlayingThis
                      ? 'royal-purple-box text-white shadow-lg'
                      : 'border-[#dccaa3] bg-[#fffdf9] hover:border-[#c9a452]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <span
                        className="w-9 h-9 rounded-xl bg-[#2b124c] text-[#e7cb82] border border-[#c9a452] font-mono text-xs font-bold grid place-items-center shrink-0"
                        dir="ltr"
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-extrabold text-[#1e0b36] gold-metallic-card px-2.5 py-0.5 rounded-md">
                            {item.speaker}
                          </span>
                          <span
                            className={`text-[11px] font-bold ${
                              isPlayingThis ? 'text-[#e7cb82]' : 'text-[#8c671d]'
                            }`}
                          >
                            الفصل {idx + 1} · {item.time}
                          </span>
                        </div>
                        <h3
                          className={`mt-2 text-base font-extrabold ${
                            isPlayingThis ? 'text-white' : 'text-[#2b124c]'
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p
                          className={`mt-1.5 text-xs leading-[1.9] ${
                            isPlayingThis ? 'text-[#f3e8d2]' : 'text-[#4a3963]'
                          }`}
                        >
                          {item.text}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isPlayingThis) {
                          onStopAudio();
                        } else {
                          onPlayChapter(item, idx, false);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                        isPlayingThis
                          ? 'gold-metallic-card'
                          : 'bg-[#2b124c] text-[#e7cb82] border-[#c9a452] hover:bg-[#3c1a69]'
                      }`}
                    >
                      {isPlayingThis ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>إيقاف</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>استماع</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 04: AI Case Assistant */}
      <section id="assistant" className="py-14 lg:py-18 bg-[#f3ede0] border-y border-[#dccaa3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="inline-flex items-center gap-2 text-[#9c7625] text-xs font-extrabold tracking-widest mb-3">
              <span className="w-6 h-0.5 bg-[#c9a452] inline-block" />
              <span>04 · AI CASE ASSISTANT</span>
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2b124c]">
              اسأل المساعد الذكي للملف الرقابي
            </h2>
            <p className="mt-3 text-[#4a3963] text-sm leading-[2]">
              قاعدة معرفة تفاعلية مخصصة لملف شركة بن كليلة العامري للتجارة والاستثمار المرفوع بعناية
              الفاضل خالد المسروري.
            </p>

            <div className="grid gap-2 mt-6">
              {MANUS_QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="w-full p-3.5 rounded-xl border border-[#c9a452] bg-[#fffdf9] hover:bg-[#2b124c] hover:text-[#e7cb82] text-right text-xs font-extrabold text-[#2b124c] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{prompt}</span>
                  <span className="text-[#c9a452]">‹</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 border-2 border-[#c9a452] rounded-3xl bg-[#fffdf9] p-5 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-[#e8dcc4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2b124c] text-[#e7cb82] border border-[#c9a452] grid place-items-center font-bold">
                  ✦
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2b124c]">مساعد الملف الرقابي</h3>
                  <small className="text-[11px] text-[#8c671d]">
                    ملف المراجع: الفاضل خالد المسروري
                  </small>
                </div>
              </div>
              <span className="text-xs font-bold text-[#1e0b36] gold-metallic-card px-2.5 py-1 rounded-full">
                جاهز
              </span>
            </div>

            <div className="h-72 overflow-y-auto py-4 space-y-3">
              {chatItems.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-3.5 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#2b124c] text-[#e7cb82] border border-[#c9a452]'
                        : 'bg-[#faf6eb] border border-[#dccaa3] text-[#2b124c]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(chatInput);
              }}
              className="flex gap-2 pt-3 border-t border-[#e8dcc4]"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب سؤالك عن الأدلة أو الوسيط نوفل أو القانون..."
                className="flex-1 rounded-xl border border-[#d5c29a] bg-white px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#2b124c]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#2b124c] text-[#e7cb82] border border-[#c9a452] text-xs font-extrabold cursor-pointer"
              >
                إرسال ➤
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Section 05: Legal Basis */}
      <section id="legal" className="py-14 lg:py-18">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="inline-flex items-center gap-2 text-[#9c7625] text-xs font-extrabold tracking-widest mb-3">
              <span className="w-6 h-0.5 bg-[#c9a452] inline-block" />
              <span>05 · LEGAL BASIS</span>
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2b124c]">
              الإطار النظامي والتشريعي
            </h2>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <article className="p-5 rounded-2xl royal-node-card text-white">
              <span className="text-[#e7cb82] text-xs font-extrabold">المرسوم السلطاني 67/2014</span>
              <h3 className="mt-2 text-base font-extrabold text-white">
                حماية المنافسة ومنع الاحتكار
              </h3>
              <p className="mt-2 text-[#e8dff5] text-xs leading-[1.9]">
                المادتان 9 و10 بشأن حظر الاتفاقات المقيدة للمنافسة وإساءة استغلال الوضع المهيمن
                والامتناع التعسفي الضمني عن التسليم.
              </p>
            </article>

            <article className="p-5 rounded-2xl royal-node-card text-white">
              <span className="text-[#e7cb82] text-xs font-extrabold">المرسوم السلطاني 29/2013</span>
              <h3 className="mt-2 text-base font-extrabold text-white">قانون المعاملات المدنية</h3>
              <p className="mt-2 text-[#e8dff5] text-xs leading-[1.9]">
                المادة 381 والمادتان 155 و156 حول وجوب تسليم المبيع وتوابعه وملحقاته الضرورية
                للانتفاع وتنفيذ العقود بحسن نية.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="royal-purple-box text-white py-10 border-t-2 border-[#c9a452]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-b from-[#e7cb82] to-[#b58932]">
              <img
                src={CORPORATE_SEAL_LOGO}
                alt="شعار شركة بن كليلة العامري للتجارة والاستثمار"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div>
              <span className="block font-extrabold text-sm text-white">
                شركة بن كليلة العامري للتجارة والاستثمار
              </span>
              <span className="block text-xs text-[#e7cb82]">
                ملف المراجع: الفاضل خالد المسروري · رؤية عُمان 2040
              </span>
            </div>
          </div>
          <a href="#top" className="text-xs font-bold text-[#e7cb82] hover:underline">
            العودة للأعلى ↑
          </a>
        </div>
      </footer>
    </div>
  );
};
