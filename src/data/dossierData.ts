export interface DocumentItem {
  id: string;
  badge: string;
  badgeColor: 'purple' | 'gold' | 'emerald';
  title: string;
  description: string;
  mediaType?: 'pdf' | 'video' | 'image' | 'presentation';
  mimeType?: string;
  audioScript?: string;
  startTime?: number;
  endTime?: number;
  fileUrl?: string;
  previewUrl?: string;
  fileSizeFormatted?: string;
  isProcessing?: boolean;
  isProcessingPdf?: boolean;
  isDirectPdf?: boolean;
  scale?: number;
  heightMode?: 'sm' | 'md' | 'lg' | 'xl';
  widthMode?: 'normal' | 'wide' | 'full';
  fitMode?: 'cover' | 'contain';
  posY?: number;
  pages: {
    pageNumber: number;
    title: string;
    subtitle: string;
    content: string[];
    referenceCode?: string;
  }[];
}

export interface FieldVideoItem {
  id: string;
  url: string;
  title: string;
  subtitle: string;
  badge: string;
  durationLabel: string;
  hasAudio?: boolean;
  mediaType?: 'video' | 'image';
  scale?: number;
  heightMode?: 'sm' | 'md' | 'lg' | 'full' | 'xl';
  fitMode?: 'cover' | 'contain';
  posY?: number;
  posterUrl?: string;
}

export interface OriginalAudioChapter {
  index: number;
  speaker: string;
  time: string;
  start: number;
  end: number;
  title: string;
  text: string;
}

export interface SyncedScriptSegment {
  id: string;
  sectionId: string;
  start: number;
  end: number;
  title: string;
  text: string;
}

export interface AudioDeduplicationEntry {
  order: number;
  id: string;
  retainedFile: string;
  fingerprintMd5: string;
  durationLabel: string;
  sectionTitle: string;
  removedDuplicates: string[];
  processingNotes: string;
}

export const CORPORATE_SEAL_LOGO =
  '/assets/aistudio/Screenshot_20260813_151701_com_lemon_lvoverseas_EditActivity_116c716b_9488d5f3.jpg';

export const TEMPLATE_REFERENCE_IMAGE =
  '/assets/aistudio/Screenshot____________________cd71340d_cd71340d.jpg';

// Direct reference to the main cleaned audio recording (zero mention of location or site leakage)
export const SECTION3_DIRECT_AUDIO_URL = '/audio/barakat-narration.mp3';

// Dedicated Executive Summary & Final Appeal Audio Recording (03:44 - deduplicated canonical file)
export const EXECUTIVE_APPEAL_AUDIO_URL = '/audio/rec-08-executive-appeal.mp3';

// Official Clarification Questions Recording (06:45 net duration, placed right after Title & Introduction)
export const CLARIFICATION_QUESTIONS_AUDIO_URL =
  '/audio/clarification-questions-2026.mp3';

export const CLARIFICATION_QUESTIONS_FALLBACK_URL =
  '/audio/clarification-questions-2026.mp3';

export interface ApprovedAudioRecording {
  id: string;
  badge: string;
  title: string;
  shortTitle: string;
  durationLabel: string;
  url: string;
  fallbackUrl?: string;
  targetSectionId: string;
  description: string;
  fingerprintMd5?: string;
  skipRanges: { start: number; end: number; reason: string }[];
}

// Programmatic Skip Intervals ("مصفوفة فترات التخطي البرمجي التلقائي"):
// All excluded phrases, spoken punctuation ("شرطة مائلة"), and unsupported assertions have been physically excised from the audio files.
export const AUDIO_SKIP_INTERVALS: Record<
  string,
  { start: number; end: number; reason: string }[]
> = {
  'rec-00-opening-xp': [],
  'rec-01-intro': [],
  'clarification-questions': [],
  'rec-03-commitment': [],
  'rec-04-noufal': [],
  'rec-06-coa': [],
  'rec-05-legal': [],
  'rec-07-accountability': [],
  'executive-appeal': [
    // Skip overlapping sentence (00:41.2 – 00:47.5) already covered in Clarification Questions recording
    { start: 41.2, end: 47.5, reason: 'منع تكرار جملة مشتركة مع تسجيل الأسئلة الاستيضاحية' },
    // Skip repetition of Royal Decree 67/2014 in Executive Appeal so it remains exclusive to Section 5
    { start: 114.0, end: 121.95, reason: 'حصر ذكر المرسوم السلطاني 67 لسنة 2014 في قسم التأصيل القانوني' },
    // Skip verbal hesitation "في قبل"
    { start: 210.55, end: 211.35, reason: 'تخطي تردد لفظي عارض' },
  ],
  'main-dossier': [
    // Exclude unsupported data leak phrase at 01:07.8 – 01:10.3
    { start: 67.8, end: 70.3, reason: 'استبعاد الإشارة غير المعتمدة والاكتفاء بالوقائع الموثقة' },
    // Skip repeated financial figure in Section 3 so financial figures remain exclusive to Introduction
    { start: 219.2, end: 222.9, reason: 'حصر الأرقام المالية في قسم المقدمة ومنع تكرارها' },
    // Skip repeated summary sentences at the end of main-dossier
    { start: 467.5, end: 478.5, reason: 'منع تكرار جملة جدولة 28 أبريل ودوامة المكاتب الخمسة' },
    { start: 493.5, end: 505.9, reason: 'منع تكرار جملة إقرار علف البياض Layer 16%' },
  ],
};

export const skipRanges = AUDIO_SKIP_INTERVALS;

// Audio Fingerprint Deduplication & Sequential Ordering Change Log ("سجل البصمة الصوتية وترتيب التسجيلات من المقدمة إلى الخاتمة")
export const AUDIO_DEDUPLICATION_CHANGELOG: AudioDeduplicationEntry[] = [
  {
    order: 1,
    id: 'rec-00-opening-xp',
    retainedFile: 'rec-00-opening-xp.mp3',
    fingerprintMd5: '507e521a1f1108990a5922fc295842f6',
    durationLabel: '00:30',
    sectionTitle: 'التسجيل الأول: المقدمة الاستهلالية (مقدمة XP) من مخازن صلالة إلى خطوط التصدير',
    removedDuplicates: ['نسخة المقدمة الاستهلالية المكررة (مطابقة بالبصمة الصوتية 100%)'],
    processingNotes: 'التسجيل الاستهلالي الافتتاحي المرفوع للمقدمة التفاعلية وتوثيق قضية تصدير أعلاف بركات الوطنية.',
  },
  {
    order: 2,
    id: 'rec-01-intro',
    retainedFile: 'rec-01-intro.mp3',
    fingerprintMd5: '0b6f81719f1e07d93a1c28f6856ea2e8',
    durationLabel: '00:37',
    sectionTitle: 'التسجيل الثاني: المقدمة وتحديات التنويع الاقتصادي ورؤية عُمان 2040',
    removedDuplicates: ['نسخة المقدمة المكررة (مطابقة بالبصمة الصوتية 100%)'],
    processingNotes: 'توثيق عنوان الملف الرقابي لشركة بن كليلة العامري للتجارة والاستثمار ورؤية عُمان 2040.',
  },
  {
    order: 3,
    id: 'clarification-questions',
    retainedFile: 'clarification-questions-2026.mp3',
    fingerprintMd5: '92ff790b284bf1165382e47ba21f64cb',
    durationLabel: '06:58',
    sectionTitle: 'التسجيل الثالث: مذكرة الأسئلة الاستيضاحية الـ 12 الموجهة لإدارة المصنع',
    removedDuplicates: [
      'نسخة الأسئلة المكررة الأولى (حُذفت لتطابق البصمة الصوتية 100%)',
      'المقطع المكرر في نهاية التسجيل بعد التوقيع والتاريخ',
    ],
    processingNotes: 'تمت تنقية الصوت نصياً وصوتياً بالكامل واعتماد اسم شركة بن كليلة العامري للتجارة والاستثمار حصرياً وتصحيح بسعيه الدؤوب.',
  },
  {
    order: 4,
    id: 'rec-03-commitment',
    retainedFile: 'rec-03-commitment.mp3',
    fingerprintMd5: '82c65b5aea026a35722f737695a7ab72',
    durationLabel: '00:42',
    sectionTitle: 'التسجيل الرابع: الالتزام المالي واللوجستي وسداد الدفعات نقداً مقدماً 100%',
    removedDuplicates: ['rec-03b-commitment-short.mp3 (نسخة مختصرة محفوظة كبديل احتياطي دون تكرار في العرض)'],
    processingNotes: 'توثيق الالتزام النقدي المسبق وجدول شحن الـ 16 تريلا بتزامن صوتي متصل.',
  },
  {
    order: 5,
    id: 'rec-04-noufal',
    retainedFile: 'rec-04-noufal-intervention.mp3',
    fingerprintMd5: '57756a8162997288f8a4b2931e6fc166',
    durationLabel: '00:42',
    sectionTitle: 'التسجيل الخامس: الوقائع والتدخل التجاري الخارجي (نوفل) وحماية العقد المباشر',
    removedDuplicates: ['النسخة الأولية المكررة لتسجيل الوقائع (مطابقة بالبصمة الصوتية)'],
    processingNotes: 'تم استبعاد واقتطاع أي إشارة لموضوع تزويد العميل الوسيط الأجنبي بمعلومات العميل النهائي من قبل قسم التصدير نهائياً.',
  },
  {
    order: 6,
    id: 'rec-06-coa',
    retainedFile: 'rec-06-coa-audit.mp3',
    fingerprintMd5: 'a38f515e7ea1010be106d7227e600cc5',
    durationLabel: '00:37',
    sectionTitle: 'التسجيل السادس: التدقيق الفني والفخ المستندي وشهادة التحليل المخبري COA',
    removedDuplicates: ['النسخة الأولية المكررة لتسجيل التدقيق الفني (مطابقة بالبصمة الصوتية)'],
    processingNotes: 'توثيق تناقض شهادة التحليل المخبري الصادرة بتاريخ 23 يونيو 2026 مع البطاقة التعريفية وإقرار Layer 16%.',
  },
  {
    order: 7,
    id: 'rec-05-legal',
    retainedFile: 'rec-05-legal-goal.mp3',
    fingerprintMd5: 'cf465086f33d378bfab0e36f7a5c67f1',
    durationLabel: '00:45',
    sectionTitle: 'التسجيل السابع: التأصيل القانوني والمرسوم السلطاني 67 لسنة 2014 (المادتان 9 و10)',
    removedDuplicates: ['مقدمة العنوان المكررة ولفظ شرطة مائلة في رقم المرسوم السلطاني'],
    processingNotes: 'تم قص تكرار عنوان القسم في البداية وحذف لفظ شرطة مائلة ليصبح النطق متصلاً وطبيعياً.',
  },
  {
    order: 8,
    id: 'rec-07-accountability',
    retainedFile: 'rec-07-accountability.mp3',
    fingerprintMd5: '6b4e92a11c08d44f89a1203e7b6511c4',
    durationLabel: '00:48',
    sectionTitle: 'التسجيل الثامن: المساءلة والرقابة الحكومية والتساؤلات الرقابية الجوهرية',
    removedDuplicates: ['الفقرة الثالثة المستبعدة المتعلقة بتزويد الوسيط الأجنبي بمعلومات العميل النهائي'],
    processingNotes: 'تم استبعاد الفقرة الثالثة تماماً ودمج التساؤلات الرقابية المعتمدة بتزامن صوتي طبيعي متصل.',
  },
  {
    order: 9,
    id: 'executive-appeal',
    retainedFile: 'rec-08-executive-appeal.mp3',
    fingerprintMd5: '44fa3bd33ddda750446e2032f4bcac68',
    durationLabel: '03:46',
    sectionTitle: 'التسجيل التاسع: الخلاصة التنفيذية والنداء الختامي لإرساء العدالة التنافسية',
    removedDuplicates: [
      'نسخة الخلاصة التنفيذية المكررة (حُذفت لتطابق البصمة الصوتية 100%)',
      'التسجيل المجمع المكرر (barakat-narration.mp3) الذي كان يعيد دمج المقاطع الفردية والأسئلة',
    ],
    processingNotes: 'مسك الختام الموجه إلى أستاذ خالد المسروري مدير دائرة حماية المنافسة ومنع الاحتكار بعد إزالة لفظ شرطة مائلة وتداخل الجمل.',
  },
];

// All 10 preserved studio recordings integrated in strict chronological order (1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10) listed once each
export const APPROVED_AUDIO_RECORDINGS: ApprovedAudioRecording[] = [
  {
    id: 'rec-00-opening-xp',
    badge: '1. مقدمة صلالة والتصدير (XP)',
    title: 'التسجيل (1): المقدمة الاستهلالية (XP) من مخازن صلالة إلى خطوط التصدير عبر منفذ خطم الشكلة',
    shortTitle: '1. مقدمة صلالة (XP)',
    durationLabel: '00:30',
    url: '/audio/rec-00-opening-xp.mp3',
    fallbackUrl: '/audio/rec-01-intro.mp3',
    targetSectionId: 'hero-section',
    fingerprintMd5: '507e521a1f1108990a5922fc295842f6',
    description:
      'من مخازن صلالة إلى خطوط التصدير عبر منفذ خطم الشكلة، نوثق قضية تصدير أعلاف بركات الوطنية بملف رقمي تفاعلي يحمي المنافسة.',
    skipRanges: AUDIO_SKIP_INTERVALS['rec-00-opening-xp'],
  },
  {
    id: 'rec-01-intro',
    badge: '2. المقدمة (رؤية 2040)',
    title: 'التسجيل (2): المقدمة وتحديات التنويع الاقتصادي ورؤية عُمان 2040',
    shortTitle: '2. المقدمة (رؤية 2040)',
    durationLabel: '00:37',
    url: '/audio/rec-01-intro.mp3',
    fallbackUrl: '/audio/barakat-narration.mp3',
    targetSectionId: 'hero-section',
    fingerprintMd5: '0b6f81719f1e07d93a1c28f6856ea2e8',
    description:
      'استهلال الملف الرقابي وتوثيق التزام المستثمر الوطني بدعم الصادرات العُمانية غير النفطية في مسار رؤية عُمان 2040.',
    skipRanges: AUDIO_SKIP_INTERVALS['rec-01-intro'],
  },
  {
    id: 'clarification-questions',
    badge: '3. الأسئلة الاستيضاحية (06:58)',
    title: 'التسجيل (3): مذكرة الأسئلة الاستيضاحية الـ 12 الموجهة لإدارة المصنع (06:58)',
    shortTitle: '3. الأسئلة الاستيضاحية (06:58)',
    durationLabel: '06:58',
    url: CLARIFICATION_QUESTIONS_AUDIO_URL,
    fallbackUrl: CLARIFICATION_QUESTIONS_FALLBACK_URL,
    targetSectionId: 'section-clarification-questions',
    fingerprintMd5: '92ff790b284bf1165382e47ba21f64cb',
    description:
      'قائمة الأسئلة الاستيضاحية الرسمية المرفوعة بعد الاجتماع الأخير لتوجيهها رسمياً وكتابياً إلى إدارة المصنع استناداً للمستندات والوقائع الميدانية.',
    skipRanges: AUDIO_SKIP_INTERVALS['clarification-questions'],
  },
  {
    id: 'rec-03-commitment',
    badge: '4. الالتزام المالي واللوجستي',
    title: 'التسجيل (4): الالتزام المالي واللوجستي وسداد الدفعات نقداً مقدماً (100%)',
    shortTitle: '4. الالتزام المالي',
    durationLabel: '00:42',
    url: '/audio/rec-03-commitment.mp3',
    fallbackUrl: '/audio/rec-03b-commitment-short.mp3',
    targetSectionId: 'section-01',
    fingerprintMd5: '82c65b5aea026a35722f737695a7ab72',
    description:
      'توثيق السداد النقدي المسبق بنسبة 100% لجدول 16 تريلا مقابل التأخير الإداري في أذونات التحميل.',
    skipRanges: AUDIO_SKIP_INTERVALS['rec-03-commitment'],
  },
  {
    id: 'rec-04-noufal',
    badge: '5. الوقائع والتدخل الأجنبي',
    title: 'التسجيل (5): الوقائع والتدخل التجاري الخارجي (نوفل) وحماية العقد المباشر',
    shortTitle: '5. الوقائع والتدخل الأجنبي',
    durationLabel: '00:42',
    url: '/audio/rec-04-noufal-intervention.mp3',
    fallbackUrl: '/audio/barakat-narration.mp3',
    targetSectionId: 'section-03',
    fingerprintMd5: '57756a8162997288f8a4b2931e6fc166',
    description:
      'توثيق تدخل الوسيط الخارجي (نوفل) وتمسك مزرعة بركة الوقن بعقدها الحصري مع شركة بن كليلة العامري للتجارة والاستثمار.',
    skipRanges: AUDIO_SKIP_INTERVALS['rec-04-noufal'],
  },
  {
    id: 'rec-06-coa',
    badge: '6. الفخ المستندي (COA)',
    title: 'التسجيل (6): التدقيق الفني والفخ المستندي وشهادة التحليل المخبري (COA بتاريخ 23 يونيو 2026)',
    shortTitle: '6. الفخ المستندي (COA)',
    durationLabel: '00:37',
    url: '/audio/rec-06-coa-audit.mp3',
    fallbackUrl: '/audio/barakat-narration.mp3',
    targetSectionId: 'section-02',
    fingerprintMd5: 'a38f515e7ea1010be106d7227e600cc5',
    description:
      'توثيق التناقض المستندي بين شهادة التحليل المخبري (COA) الصادرة بتاريخ 23 يونيو 2026 (0% مضادات كوكسيديا) والبطاقة التعريفية.',
    skipRanges: AUDIO_SKIP_INTERVALS['rec-06-coa'],
  },
  {
    id: 'rec-05-legal',
    badge: '7. التأصيل القانوني',
    title: 'التسجيل (7): التأصيل القانوني والمرسوم السلطاني 67 لسنة 2014 (المادتان 9 و10)',
    shortTitle: '7. التأصيل القانوني',
    durationLabel: '00:45',
    url: '/audio/rec-05-legal-goal.mp3',
    fallbackUrl: '/audio/rec-05b-legal-goal-extended.mp3',
    targetSectionId: 'section-05',
    fingerprintMd5: 'cf465086f33d378bfab0e36f7a5c67f1',
    description:
      'التكييف القانوني لحجب المستندات وإقصاء الناقل الوطني بموجب المادتين (9 و10) من قانون حماية المنافسة ومنع الاحتكار الصادر بالمرسوم السلطاني 67 لسنة 2014.',
    skipRanges: AUDIO_SKIP_INTERVALS['rec-05-legal'],
  },
  {
    id: 'rec-07-accountability',
    badge: '8. المساءلة والرقابة الحكومية',
    title: 'التسجيل (8): المساءلة والرقابة الحكومية والتساؤلات الرقابية الجوهرية',
    shortTitle: '8. المساءلة والرقابة',
    durationLabel: '00:48',
    url: '/audio/rec-07-accountability.mp3',
    fallbackUrl: '/audio/barakat-narration.mp3',
    targetSectionId: 'section-04',
    fingerprintMd5: '6b4e92a11c08d44f89a1203e7b6511c4',
    description:
      'توثيق التساؤلات الرقابية الجوهرية حول تعطيل الشحنات المدفوعة مسبقاً وتناقض المستندات المخبرية واختراق توجيهات الإدارة العليا.',
    skipRanges: AUDIO_SKIP_INTERVALS['rec-07-accountability'],
  },
  {
    id: 'executive-appeal',
    badge: '9. الخلاصة والنداء الختامي (03:46)',
    title: 'التسجيل (9): الخلاصة التنفيذية والنداء الختامي لإرساء العدالة التنافسية (03:46)',
    shortTitle: '9. الخلاصة والنداء الختامي (03:46)',
    durationLabel: '03:46',
    url: EXECUTIVE_APPEAL_AUDIO_URL,
    fallbackUrl: '/audio/rec-08-executive-appeal.mp3',
    targetSectionId: 'section-executive-appeal',
    fingerprintMd5: '44fa3bd33ddda750446e2032f4bcac68',
    description:
      'الخلاصة التنفيذية الشاملة والنداء الشخصي الموجه لدائرة حماية المنافسة ومنع الاحتكار وحماية الصادرات غير النفطية في مسار رؤية عُمان 2040.',
    skipRanges: AUDIO_SKIP_INTERVALS['executive-appeal'],
  },
];

export interface ClarificationQuestionSentence {
  id: string;
  groupId: string;
  start: number;
  end: number;
  timeLabel: string;
  questionNumber?: string;
  text: string;
  isHeader?: boolean;
}

export interface ClarificationQuestionGroup {
  id: string;
  numberLabel: string;
  badge: string;
  timeRange: string;
  start: number;
  end: number;
  title: string;
  subtitle: string;
  sentences: ClarificationQuestionSentence[];
}

export const CLARIFICATION_QUESTIONS_GROUPS: ClarificationQuestionGroup[] = [
  {
    id: 'cq-intro',
    numberLabel: 'مقدمة',
    badge: 'استهلال المذكرة الاستيضاحية (00:00 إلى 00:28)',
    timeRange: '00:00 إلى 00:28',
    start: 0,
    end: 28.0,
    title: 'استهلال المذكرة: الرد العملي الموثق على سؤال «هل منعوا عنك البيع؟»',
    subtitle: 'توجيه الأسئلة الاستيضاحية رسمياً وكتابياً إلى إدارة المصنع استناداً حصراً إلى المستندات والوقائع الميدانية',
    sentences: [
      {
        id: 'cq-s1',
        groupId: 'cq-intro',
        start: 0,
        end: 12.2,
        timeLabel: '00:00 إلى 00:12',
        text: 'إلحاقاً لاجتماعنا الأخير والذي تم بطرح لي سؤال: «هل منعوا عنك البيع؟»، وبناءً على توجيهاتكم السديدة، أضع بين أيديكم قائمة الأسئلة الاستيضاحية التالية،',
        isHeader: true,
      },
      {
        id: 'cq-s2',
        groupId: 'cq-intro',
        start: 12.2,
        end: 28.0,
        timeLabel: '00:12 إلى 00:28',
        text: 'والتي نرجو من جهتكم الموقرة توجيهها رسمياً وكتابياً إلى إدارة المصنع لتوضيح حقيقة ما جرى لخط التصدير الوطني، بعيداً عن أي تفسيرات عاطفية، واستناداً حصراً إلى المستندات والوقائع الميدانية.',
      },
    ],
  },
  {
    id: 'cq-group-1',
    numberLabel: 'أولاً',
    badge: 'المحور الأول من الأسئلة (00:28 إلى 01:02)',
    timeRange: '00:28 إلى 01:02',
    start: 28.0,
    end: 62.0,
    title: 'أولاً: أسئلة حول حسن نية وجدية المستثمر الوطني',
    subtitle: 'إثبات السداد النقدي المسبق 100% ومبادرة جدولة التوريد بتاريخ 28 أبريل',
    sentences: [
      {
        id: 'cq-s3',
        groupId: 'cq-group-1',
        start: 28.0,
        end: 33.0,
        timeLabel: '00:28 إلى 00:33',
        text: 'أولاً: أسئلة حول حسن نية وجدية المستثمر الوطني.',
        isHeader: true,
      },
      {
        id: 'cq-s4',
        groupId: 'cq-group-1',
        start: 33.0,
        end: 46.2,
        timeLabel: '00:33 إلى 00:46',
        questionNumber: 'س1',
        text: '1. هل طلب المستثمر الوطني أي شروط تعجيزية أو استثنائية (براند خاص، تخفيضات، دفع آجل)؟ أم أنه جاء بصفقة نقدية 100% وسدد المبالغ مقدماً؟',
      },
      {
        id: 'cq-s5',
        groupId: 'cq-group-1',
        start: 46.2,
        end: 62.0,
        timeLabel: '00:46 إلى 01:02',
        questionNumber: 'س2',
        text: '2. ألم يبادر المستثمر الوطني بإرسال جدول توريد زمني متكامل (15 حمولة موضح بجدول التحميل بتاريخ 28 أبريل) ليتناسب مع طاقتكم الإنتاجية ويقلل الضغط عليكم؟',
      },
    ],
  },
  {
    id: 'cq-group-2',
    numberLabel: 'ثانياً',
    badge: 'المحور الثاني من الأسئلة (01:02 إلى 03:03)',
    timeRange: '01:02 إلى 03:03',
    start: 62.0,
    end: 183.4,
    title: 'ثانياً: أسئلة حول المسار التعاقدي والعميل النهائي',
    subtitle: 'تأسيس الصفقة بجهد وطني خالص، وحماية المسار التعاقدي المباشر لشركة بن كليلة العامري للتجارة والاستثمار',
    sentences: [
      {
        id: 'cq-s6',
        groupId: 'cq-group-2',
        start: 62.0,
        end: 66.2,
        timeLabel: '01:02 إلى 01:06',
        text: 'ثانياً: أسئلة حول المسار التعاقدي والعميل النهائي.',
        isHeader: true,
      },
      {
        id: 'cq-s7',
        groupId: 'cq-group-2',
        start: 66.2,
        end: 75.5,
        timeLabel: '01:06 إلى 01:15',
        questionNumber: 'س3',
        text: '3. من هو الطرف الذي أتى بهذه الصفقة إلى مكاتبكم المكيفة؟ أليس هو المستثمر الوطني العماني بجهده التسويقي الخالص؟',
      },
      {
        id: 'cq-s8',
        groupId: 'cq-group-2',
        start: 75.5,
        end: 93.86,
        timeLabel: '01:15 إلى 01:34',
        questionNumber: 'س4',
        text: '4. هل بلغكم المستثمر الوطني بأن الطرف الناقل تجاوز دوره المزعوم كناقل فقط، وتوجه مباشرة إلى مزرعة العميل النهائي في الإمارات ليستحوذ على جهود المستثمر الوطني، وهو ما قوبل برفض العميل الإماراتي وتمسكه بالعقد المباشر؟',
      },
      {
        id: 'cq-s9',
        groupId: 'cq-group-2',
        start: 93.86,
        end: 109.7,
        timeLabel: '01:34 إلى 01:50',
        questionNumber: 'س5',
        text: '5. في التحويلات المالية التي تحولت إلى حساب شركة المطاحن العمانية: هل اقتصرت على قيمة البضاعة فقط، أم أنها شملت أيضاً أجور خدمة النقل؟ ولماذا مرت هذه الدفعات عبر حساباتكم؟',
      },
      {
        id: 'cq-s10',
        groupId: 'cq-group-2',
        start: 109.7,
        end: 134.5,
        timeLabel: '01:50 إلى 02:14',
        questionNumber: 'س6',
        text: '6. لماذا تم استلام دفعة النقل نقداً مقدماً لنقل الشحنة الثالثة والرابعة من المستثمر الوطني لتغطية النقل، ثم التخلف عن الخدمة مع التهديد بغرامة يومية على المستثمر الوطني بحجة التأخير، والقول حرفياً: «لقد حصلت على طلب وجعلتك في الانتظار»؟',
      },
      {
        id: 'cq-s11',
        groupId: 'cq-group-2',
        start: 134.5,
        end: 183.4,
        timeLabel: '02:14 إلى 03:03',
        questionNumber: 'س7',
        text: '7. هل بعدما عرفتم وأيقنتم بالدليل الموثق من قبل المستثمر الوطني من أبناء جلدتكم بما افتعله الطرف الخارجي من عقبات تسببت في إهدار هذه الصفقة ضد منتجاتكم الوطنية التي تدعم رؤية 2040 للصادرات غير النفطية: هل تم تهميشه وعدم الرد؟ وما هي الأسباب التي تحدكم على استمراريته معكم بينما يُسلب الخط التصديري من المستثمر الوطني صاحب الأحقية الأولى بسعيه الدؤوب ومساعيه المخلصة والمتواصلة؟',
      },
    ],
  },
  {
    id: 'cq-group-3',
    numberLabel: 'ثالثاً',
    badge: 'المحور الثالث من الأسئلة (03:03 إلى 04:03)',
    timeRange: '03:03 إلى 04:03',
    start: 183.4,
    end: 243.4,
    title: 'ثالثاً: أسئلة حول الاشتراطات السيادية والمطابقة الفنية',
    subtitle: 'اشتراطات وزارة التغير المناخي والبيئة (فترة السحب 7 أيام) وإرسال إقرار سلامة لمنتج غير متعاقد عليه',
    sentences: [
      {
        id: 'cq-s12',
        groupId: 'cq-group-3',
        start: 183.4,
        end: 187.5,
        timeLabel: '03:03 إلى 03:07',
        text: 'ثالثاً: أسئلة حول الاشتراطات السيادية والمطابقة الفنية.',
        isHeader: true,
      },
      {
        id: 'cq-s13',
        groupId: 'cq-group-3',
        start: 187.5,
        end: 205.6,
        timeLabel: '03:07 إلى 03:25',
        questionNumber: 'س8',
        text: '8. اشتراطات توثيق مضادات الكوكسيديا وفترة السحب (7 أيام): هل هي طلبات شخصية من المستثمر، أم أنها قوانين واشتراطات سيادية معتمدة لدى وزارة التغير المناخي والبيئة بدولة الإمارات والتي أطلعكم عليها؟ ولماذا تم التعامل معها كعقبات؟',
      },
      {
        id: 'cq-s14',
        groupId: 'cq-group-3',
        start: 205.6,
        end: 230.9,
        timeLabel: '03:25 إلى 03:51',
        questionNumber: 'س9',
        text: '9. البضاعة مخصصة لتصدير أعلاف تسمين؛ لماذا تم إرسال إقرار سلامة لمنتج مغاير لم يتم الشراء منه أصلاً؟ ألا يعرض ذلك الشحنات للرفض الجمركي ويحتجز أي شحنة من المنتجات التي يشتريها المستثمر بالفعل؟',
      },
      {
        id: 'cq-s15',
        groupId: 'cq-group-3',
        start: 230.9,
        end: 243.4,
        timeLabel: '03:51 إلى 04:03',
        questionNumber: 'س10',
        text: '10. استخراج ورقة توضح فترة سحب مادة أو تعديل بطاقة هو إجراء روتيني تواجهونه يومياً؛ كيف يستغرق هذا الإجراء أكثر من خمسة أشهر في شركة بحجمكم؟',
      },
    ],
  },
  {
    id: 'cq-group-4',
    numberLabel: 'رابعاً',
    badge: 'المحور الرابع من الأسئلة (04:03 إلى 05:03)',
    timeRange: '04:03 إلى 05:03',
    start: 243.4,
    end: 303.4,
    title: 'رابعاً: أسئلة حول التعطيل الإداري وإسقاط الأعذار',
    subtitle: 'توقف التصدير في 7 مايو بالتزامن مع تحميل شاحنات الوسيط الأجنبي، وتجاهل مهلة الـ 3 أيام بعد توجيهات الرئيس التنفيذي',
    sentences: [
      {
        id: 'cq-s16',
        groupId: 'cq-group-4',
        start: 243.4,
        end: 247.4,
        timeLabel: '04:03 إلى 04:07',
        text: 'رابعاً: أسئلة حول التعطيل الإداري وإسقاط الأعذار.',
        isHeader: true,
      },
      {
        id: 'cq-s17',
        groupId: 'cq-group-4',
        start: 247.4,
        end: 271.2,
        timeLabel: '04:07 إلى 04:31',
        questionNumber: 'س11',
        text: '11. كيف يتوقف التصدير عليه في السابع من مايو وقد زودكم بحسن نية مسبقاً بالجدولة وفيها موعد تحميل بنفس اليوم؟ وما الذي قدمتموه لدعم هذه الصادرات الوطنية حين فُقد التواصل معكم في 7 مايو وكان بالمقابل يتم تحميل شاحنات للوسيط الأجنبي في ذات الوقت؟',
      },
      {
        id: 'cq-s18',
        groupId: 'cq-group-4',
        start: 271.2,
        end: 303.4,
        timeLabel: '04:31 إلى 05:03',
        questionNumber: 'س12',
        text: '12. لإدارة المصنع (مكتب الرئيس التنفيذي والمبيعات): بعدما تكبد المستثمر عناء السفر واجتمع مع الرئيس التنفيذي الذي وجه بإنهاء العوائق، وبعدما وجه أستاذ خالد المسروري المحترم بإرسال الطلبات المشترطة بملف PDF وإعطائهم مهلة 3 أيام: كيف يتم تجاهل هذه الطلبات الرسمية لأكثر من 8 أيام دون أي رد؟',
      },
    ],
  },
  {
    id: 'cq-group-5',
    numberLabel: 'خامساً وختاماً',
    badge: 'المحور الخامس والختام (05:03 إلى 06:45)',
    timeRange: '05:03 إلى 06:45',
    start: 303.4,
    end: 405.5,
    title: 'خامساً: السؤال الحاسم (التباين الزمني وكشف الدافع) والنداء الختامي',
    subtitle: 'المقارنة القاطعة بين إنجاز الشحنتين الأولى والثانية في أقل من 24 ساعة مقابل التعطيل الشامل لخمسة أشهر فور رفض المزرعة للوسيط',
    sentences: [
      {
        id: 'cq-s19',
        groupId: 'cq-group-5',
        start: 303.4,
        end: 328.4,
        timeLabel: '05:03 إلى 05:28',
        text: 'خامساً: التباين الزمني وكشف الدافع: كم يوماً استغرقت الحمولة الأولى والثانية؟ في ذلك الوقت لم يكن موقع العميل النهائي معروفاً للوسيط ولم يكن قد وصل إلى مزرعة العميل بعد؛ فكانت الحمولات تنجز وتحمل وتخرج من المنفذ في أقل من 24 ساعة وتُسلم المستندات بسلاسة تامة.',
        isHeader: true,
      },
      {
        id: 'cq-s20',
        groupId: 'cq-group-5',
        start: 328.4,
        end: 369.6,
        timeLabel: '05:28 إلى 06:09',
        text: 'ولكن بمجرد أن توجه الوسيط إلى المزرعة وقوبل بالرفض التام من قبل العميل النهائي الذي تمسك بالمستثمر العماني، انقلبت الآية وتحولت المعاملة إلى صمت مطبق وتجاهل استمر لخمسة أشهر! ألا يعد هذا التزامن الزمني قرينة قاطعة على أن التعطيل لم يكن إدارياً، بل كان مقصوداً للانتقام من المستثمر الوطني وتمرير الصفقة لصالح طرف آخر؟',
      },
      {
        id: 'cq-s21',
        groupId: 'cq-group-5',
        start: 369.6,
        end: 405.5,
        timeLabel: '06:09 إلى 06:45',
        text: 'ختاماً يا أستاذ خالد المسروري المحترم: في سابقة صلالة أُغلق مستودعنا لبيع الأعلاف، واليوم السيناريو يتكرر على مستوى التصدير؛ نضع هذه المذكرة بين أيديكم حفاظاً على كرامة المواطن وسمعة الصادرات العمانية ورؤية عُمان 2040. مقدم المذكرة: المدير العام لشركة بن كليلة العامري للتجارة والاستثمار، التاريخ: 27 أكتوبر 2026م.',
      },
    ],
  },
];

export const ALL_CLARIFICATION_SENTENCES: ClarificationQuestionSentence[] =
  CLARIFICATION_QUESTIONS_GROUPS.flatMap((g) => g.sentences);

export interface ExecutiveAppealSentence {
  id: string;
  pillarId: string;
  start: number;
  end: number;
  timeLabel: string;
  text: string;
  isHeader?: boolean;
}

export interface ExecutiveAppealPillar {
  id: string;
  numberLabel: string;
  badge: string;
  timeRange: string;
  start: number;
  end: number;
  title: string;
  subtitle: string;
  nextPillarId?: string;
  nextPillarLabel?: string;
  sentences: ExecutiveAppealSentence[];
}

export const EXECUTIVE_APPEAL_INTRO_SENTENCE: ExecutiveAppealSentence = {
  id: 'exec-intro',
  pillarId: 'pillar-1',
  start: 0,
  end: 5.2,
  timeLabel: '00:00 إلى 00:05',
  text: 'الخلاصة التنفيذية والنداء الختامي لإرساء العدالة التنافسية.',
  isHeader: true,
};

export const EXECUTIVE_APPEAL_PILLARS: ExecutiveAppealPillar[] = [
  {
    id: 'pillar-1',
    numberLabel: '01',
    badge: 'المحور الأول من الخلاصة التنفيذية (00:05 إلى 01:02)',
    timeRange: '00:05 إلى 01:02',
    start: 5.2,
    end: 62.0,
    title: 'واحد: الابتكار الوطني ونجاح الشحنتين الأولى والثانية مقابل الانقلاب التعسفي',
    subtitle: 'ابتكار وفتح خط تصدير جديد كلياً بجهد وطني خالص ومواجهته باحتجاز المستندات الفنية عند الشحنة الثالثة',
    nextPillarId: 'pillar-2',
    nextPillarLabel: 'المحور الثاني: استغلال الظروف وتقييد المنافسة ضد المستثمر الوطني',
    sentences: [
      {
        id: 'exec-s1',
        pillarId: 'pillar-1',
        start: 5.2,
        end: 11.2,
        timeLabel: '00:05 إلى 00:11',
        text: 'واحد: الابتكار الوطني ونجاح الشحنتين الأولى والثانية مقابل الانقلاب التعسفي.',
        isHeader: true,
      },
      {
        id: 'exec-s2',
        pillarId: 'pillar-1',
        start: 11.2,
        end: 19.4,
        timeLabel: '00:11 إلى 00:19',
        text: 'لقد قمنا كمستثمر وطني بابتكار وفتح خط تصدير جديد كلياً لم يكن يوماً في حسبان قسم المبيعات بالمصنع.',
      },
      {
        id: 'exec-s3',
        pillarId: 'pillar-1',
        start: 19.4,
        end: 30.2,
        timeLabel: '00:19 إلى 00:30',
        text: 'لقد اجتهدنا بعمل متواصل وتسويق مكثف، وجلبنا هذه الصفقة التصديرية الكبرى جاهزة ومكتملة الأركان إلى المكاتب المكيفة للمشتكى ضدها،',
      },
      {
        id: 'exec-s4',
        pillarId: 'pillar-1',
        start: 30.2,
        end: 35.0,
        timeLabel: '00:30 إلى 00:35',
        text: 'دون أن يتكبد موظفو المصنع أي عناء في البحث أو الترويج.',
      },
      {
        id: 'exec-s5',
        pillarId: 'pillar-1',
        start: 35.0,
        end: 41.2,
        timeLabel: '00:35 إلى 00:41',
        text: 'وقد تكلل هذا الجهد الفعلي بالنجاح والسلاسة التامة في تمرير الشحنة الأولى والثانية.',
      },
      {
        id: 'exec-s7',
        pillarId: 'pillar-1',
        start: 47.5,
        end: 55.2,
        timeLabel: '00:47 إلى 00:55',
        text: 'تفاجأنا عند الشحنة الثالثة بانقلاب تعسفي وتعطيل متماطل ومتعمد من قبل المصنع،',
      },
      {
        id: 'exec-s8',
        pillarId: 'pillar-1',
        start: 55.2,
        end: 62.0,
        timeLabel: '00:55 إلى 01:02',
        text: 'حيث تم احتجاز المستندات الفنية بهدف استراتيجي يتمثل في تجفيف مخزون العميل النهائي.',
      },
    ],
  },
  {
    id: 'pillar-2',
    numberLabel: '02',
    badge: 'المحور الثاني من الخلاصة التنفيذية (01:02 إلى 01:54)',
    timeRange: '01:02 إلى 01:54',
    start: 62.0,
    end: 114.0,
    title: 'اثنان: استغلال الظروف وتقييد المنافسة ضد المستثمر الوطني',
    subtitle: 'المماطلة المتعمدة في الشحنة الثالثة بعد إغلاق مستودع صلالة لاستنزاف مخزون العميل النهائي',
    nextPillarId: 'pillar-3',
    nextPillarLabel: 'المحور الثالث: حماية الصادرات غير النفطية (رؤية عُمان 2040)',
    sentences: [
      {
        id: 'exec-s9',
        pillarId: 'pillar-2',
        start: 62.0,
        end: 66.8,
        timeLabel: '01:02 إلى 01:06',
        text: 'اثنان: استغلال الظروف وتقييد المنافسة ضد المستثمر الوطني.',
        isHeader: true,
      },
      {
        id: 'exec-s10',
        pillarId: 'pillar-2',
        start: 66.8,
        end: 78.8,
        timeLabel: '01:06 إلى 01:18',
        text: 'بعد أن تعرضنا لظروف قاهرة ومحاربة في السوق أجبرتنا بمرارة على إغلاق محلنا التجاري في صلالة خلال نفس الشهر، استغلت المشتكى ضدها هذا الظرف أبشع استغلال.',
      },
      {
        id: 'exec-s11',
        pillarId: 'pillar-2',
        start: 78.8,
        end: 88.5,
        timeLabel: '01:18 إلى 01:28',
        text: 'فبدلاً من دعمنا كمستثمر وطني، تعمدت المماطلة في الشحنة الثالثة لتسهيل استحواذ طرف خارجي على صفقتنا الجاهزة،',
      },
      {
        id: 'exec-s12',
        pillarId: 'pillar-2',
        start: 88.5,
        end: 93.6,
        timeLabel: '01:28 إلى 01:33',
        text: 'مستغلة نفاد مخزون العميل النهائي لإجباره على تغيير مسار التوريد.',
      },
      {
        id: 'exec-s13',
        pillarId: 'pillar-2',
        start: 93.6,
        end: 105.5,
        timeLabel: '01:33 إلى 01:45',
        text: 'مع العلم أن ذلك الطرف كان نطاق عمله مقتصراً تاريخياً على الإمارات الشمالية، ولم يكن ليصل إلى أسواق سويحان لولا الخط التصديري الذي أسسناه بجهدنا الخالص.',
      },
      {
        id: 'exec-s14',
        pillarId: 'pillar-2',
        start: 105.5,
        end: 114.0,
        timeLabel: '01:45 إلى 01:54',
        text: 'هذا المسلك يعد امتناعاً مقنعاً وممارسة مقيدة للمنافسة تضر بالسوق العماني وبحقوق المصدر الوطني.',
      },
    ],
  },
  {
    id: 'pillar-3',
    numberLabel: '03',
    badge: 'المحور الثالث من الخلاصة التنفيذية (02:02 إلى 02:46)',
    timeRange: '02:02 إلى 02:46',
    start: 121.95,
    end: 165.75,
    title: 'ثلاثة: حماية الصادرات غير النفطية (رؤية عُمان 2040)',
    subtitle: 'منع تداخل الوسيط الأجنبي أو الأطراف غير المتعاقدة وإعادة الحق التجاري لمن أسسه حمايةً للاقتصاد الوطني',
    nextPillarId: 'pillar-4',
    nextPillarLabel: 'المحور الرابع: نداء شخصي لدائرة المنافسة ومنع الاحتكار (أستاذ خالد المسروري)',
    sentences: [
      {
        id: 'exec-s15',
        pillarId: 'pillar-3',
        start: 121.95,
        end: 127.15,
        timeLabel: '02:02 إلى 02:07',
        text: 'ثلاثة: حماية الصادرات غير النفطية (رؤية عُمان 2040).',
        isHeader: true,
      },
      {
        id: 'exec-s16',
        pillarId: 'pillar-3',
        start: 127.15,
        end: 143.55,
        timeLabel: '02:07 إلى 02:23',
        text: 'إن السماح لوسيط أجنبي مقره إمارة عجمان بالتدخل والتحكم في خطوط الصادرات العمانية غير النفطية يمثل تقويضاً مباشراً لجهود المستثمرين الوطنيين الذين يعملون بما يتماشى مع أهداف رؤية عُمان 2040.',
      },
      {
        id: 'exec-s17',
        pillarId: 'pillar-3',
        start: 143.55,
        end: 157.25,
        timeLabel: '02:23 إلى 02:37',
        text: 'لذا، نلتمس من دائرتكم الموقرة إصدار توجيه حازم يمنع منعاً باتاً تداخل هذا الوسيط أو غيره من الأطراف غير المتعاقدة في هذا الخط التصديري، وإعادة الحق التجاري لمن أسسه،',
      },
      {
        id: 'exec-s18',
        pillarId: 'pillar-3',
        start: 157.25,
        end: 165.75,
        timeLabel: '02:37 إلى 02:46',
        text: 'حماية للاقتصاد الوطني من هذه الممارسات الإقصائية التي تدخل أصيلاً ضمن اختصاصات المركز في التقصي والبحث.',
      },
    ],
  },
  {
    id: 'pillar-4',
    numberLabel: '04',
    badge: 'المحور الرابع والنداء الختامي (02:46 إلى 03:44)',
    timeRange: '02:46 إلى 03:44',
    start: 165.75,
    end: 223.66,
    title: 'أربعة: نداء شخصي لدائرة المنافسة ومنع الاحتكار أستاذ خالد المسروري مدير الدائرة',
    subtitle: 'مناشدة إحقاق الحق ووقف الظلم وردع التعسف وإنصاف المستثمر العماني الذي يُهضم حقه في عقر داره',
    sentences: [
      {
        id: 'exec-s19',
        pillarId: 'pillar-4',
        start: 165.75,
        end: 171.95,
        timeLabel: '02:46 إلى 02:52',
        text: 'أربعة: نداء شخصي لدائرة المنافسة ومنع الاحتكار. أستاذ خالد المسروري مدير الدائرة،',
        isHeader: true,
      },
      {
        id: 'exec-s20',
        pillarId: 'pillar-4',
        start: 171.95,
        end: 181.25,
        timeLabel: '02:52 إلى 03:01',
        text: 'لقد سبق وأن أغرقتني التفافات المستثمر الأجنبي في خسائر فادحة أجبرتني قسراً على إغلاق محلي التجاري في ولاية صلالة.',
      },
      {
        id: 'exec-s21',
        pillarId: 'pillar-4',
        start: 181.25,
        end: 194.95,
        timeLabel: '03:01 إلى 03:15',
        text: 'ورغم ذلك، نهضت متمسكاً بمبادئي وشرفي المهني لفتح هذه النافذة التصديرية الجديدة، لأصطدم مجدداً بذات التعسف، ولكن هذه المرة بتواطؤ من مؤسسة وطنية كبرى.',
      },
      {
        id: 'exec-s22',
        pillarId: 'pillar-4',
        start: 194.95,
        end: 209.25,
        timeLabel: '03:15 إلى 03:29',
        text: 'إنني أضع هذا الملف بين يديكم، وكلي أمل وثقة في الله سبحانه وتعالى، ثم في حكومتنا الرشيدة وفي شخصكم الكريم، فأنتم الرجل المناسب في المكان المناسب لإحقاق الحق.',
      },
      {
        id: 'exec-s23',
        pillarId: 'pillar-4',
        start: 209.25,
        end: 223.66,
        timeLabel: '03:29 إلى 03:44',
        text: 'لقد لجأت إليكم في الماضي قبل الإغلاق القسري في ظفار، واليوم أقف أمامكم مناشداً عدالتكم لوقف هذا الظلم، وردع هذا التعسف، وإنصاف المستثمر العماني الذي يُهضم حقه في عقر داره.',
      },
    ],
  },
];

export const ALL_EXECUTIVE_APPEAL_SENTENCES: ExecutiveAppealSentence[] = [
  EXECUTIVE_APPEAL_INTRO_SENTENCE,
  ...EXECUTIVE_APPEAL_PILLARS.flatMap((p) => p.sentences),
];

// Primary audio is the full dossier narration (/audio/barakat-narration.mp3), with fallback to the Clarification Questions recording
export const ELEVENLABS_AUDIO_URLS = [
  '/audio/barakat-narration.mp3',
  '/audio/clarification-questions-2026.mp3',
];

// Opening 30-second fullscreen presentation video
export const OPENING_PRESENTATION_VIDEO: FieldVideoItem = {
  id: 'vid-opening-dossier',
  url: '/assets/aistudio/lv_0_20261025125833_118c1021.mp4',
  title: 'العرض الافتتاحي الميداني (30 ثانية): من مخازن صلالة إلى خطوط التصدير عبر منفذ خطم الشكلة',
  subtitle: 'العرض التقديمي الاستثنائي بالصوت الكامل ويوثق قضية تصدير أعلاف بركات الوطنية وحماية المنافسة',
  badge: 'العرض الافتتاحي بالصوت (30 ثانية)',
  durationLabel: '00:30',
  hasAudio: true,
};

// All previously boxed field, warehouse, and fleet videos moved into the interactive multi-scene background
export const BACKGROUND_SCENE_VIDEOS: {
  id: string;
  url: string;
  sectionKey: string;
  title: string;
}[] = [
  {
    id: 'bg-scene-new-warehouse-1',
    url: '/assets/aistudio/lv_0_20261028134636_4e4aa5be.mp4',
    sectionKey: 'hero-section',
    title: 'توثيق ميداني متعدد الزوايا: أسطول الشاحنات وحركة التحميل الليلية والنهارية من مخازن الشركة',
  },
  {
    id: 'bg-scene-new-warehouse-2',
    url: '/assets/aistudio/lv_0_20261028134539_f77457c5.mp4',
    sectionKey: 'section-clarification-questions',
    title: 'توثيق ميداني: عمليات الشحن والمناولة في مستودعات شركة بن كليلة العامري للتجارة والاستثمار',
  },
  {
    id: 'bg-scene-new-warehouse-3',
    url: '/assets/aistudio/lv_0_20261028134455_cc14d4e3.mp4',
    sectionKey: 'section-01',
    title: 'توثيق ميداني (8 زوايا): الطاقة الاستيعابية للمخازن وتستيف الأعلاف وحركة الشاحنات',
  },
  {
    id: 'bg-scene-new-warehouse-4',
    url: '/assets/aistudio/lv_0_20261028134407_7852f706.mp4',
    sectionKey: 'section-03',
    title: 'توثيق ميداني: بوابة مخازن شركة بن كليلة العامري للتجارة والاستثمار والشاحنات المحملة',
  },
  {
    id: 'bg-scene-new-warehouse-5',
    url: '/assets/aistudio/lv_0_20261028134258_d3832aa8.mp4',
    sectionKey: 'section-02',
    title: 'توثيق كاميرات المخازن وحركة القاطرات والمقطورات المحملة بأعلاف التصدير',
  },
  {
    id: 'bg-scene-new-warehouse-6',
    url: '/assets/aistudio/lv_0_20261028133940_fa89726b.mp4',
    sectionKey: 'section-05',
    title: 'توثيق ميداني: انطلاق شاحنات الشركة من البوابة الرئيسية للمخازن والحاويات المعتمدة',
  },
  {
    id: 'bg-scene-new-warehouse-7',
    url: '/assets/aistudio/lv_0_20261028133832_1c84c9bf.mp4',
    sectionKey: 'section-executive-appeal',
    title: 'توثيق شامل لحركة أسطول الـ 16 تريلا وعمليات التحميل داخل المستودعات',
  },
  {
    id: 'bg-scene-new-warehouse-8',
    url: '/assets/aistudio/lv_0_20261028133542_ab5f6431.mp4',
    sectionKey: 'section-06',
    title: 'توثيق ميداني: مخزون الأعلاف الضخم وشاحنات فولفو أمام مخازن شركة بن كليلة العامري',
  },
  {
    id: 'bg-scene-fleet-night',
    url: '/assets/aistudio/HnVideoEditor_2025_10_01_150820467_e0222398.mp4',
    sectionKey: 'hero-section',
    title: 'توثيق الشاحنات المحملة بأعلاف بركات الوطنية والجاهزة للعبور (جدول 16 تريلا)',
  },
  {
    id: 'bg-scene-warehouse-volvo',
    url: '/assets/aistudio/HnVideoEditor_2025_06_13_135135940_40c87c80.mp4',
    sectionKey: 'section-executive-appeal',
    title: 'عمليات التحميل والتستيف الميداني داخل مخازن شركة بن كليلة العامري للتجارة والاستثمار',
  },
  {
    id: 'bg-scene-warehouse-capacity',
    url: '/assets/aistudio/HnVideoEditor_2025_06_19_114327564_947e3678.mp4',
    sectionKey: 'section-01',
    title: 'المخازن الاستراتيجية وطاقة الاستيعاب الميدانية لشركة بن كليلة العامري للتجارة والاستثمار',
  },
  {
    id: 'bg-scene-warehouse-gate',
    url: '/assets/aistudio/HnVideoEditor_2025_08_14_023641490_45e2a19f.mp4',
    sectionKey: 'section-02',
    title: 'خروج الشاحنات المحملة من البوابة الرئيسية لمستودعات الشركة',
  },
  {
    id: 'bg-scene-loading-ops',
    url: '/assets/aistudio/HnVideoEditor_2025_06_09_115415168_e45d1774.mp4',
    sectionKey: 'section-03',
    title: 'تجهيز القاطرات والمقطورات للشحن التصديري المباشر المدفوع مسبقاً 100%',
  },
  {
    id: 'bg-scene-logistics-hub',
    url: '/assets/aistudio/AI_Video_Generation_Guide_and_Output_9d1b2f6c.mp4',
    sectionKey: 'section-04',
    title: 'المركز اللوجستي الإقليمي وعمليات النقل والتصدير لشركة بن كليلة العامري للتجارة والاستثمار',
  },
  {
    id: 'bg-scene-multi-grid',
    url: '/assets/aistudio/lv_0_20250612010109_5db43f62.mp4',
    sectionKey: 'section-05',
    title: 'ملخص متعدد الزوايا لحركة الشاحنات وعمليات المناولة الميدانية',
  },
  {
    id: 'bg-scene-yard-movement',
    url: '/assets/aistudio/HnVideoEditor_2025_09_09_152621795_f8064337.mp4',
    sectionKey: 'section-06',
    title: 'حركة الشاحنات في الساحة اللوجستية والانطلاق نحو المنافذ البرية',
  },
  {
    id: 'bg-scene-barakat-loading',
    url: '/assets/aistudio/HnVideoEditor_2025_06_11_171749621_e28a6bd4.mp4',
    sectionKey: 'section-conversation-evidence',
    title: 'تحميل شحنات أعلاف بركات الوطنية ضمن جدول التصدير المعتمد',
  },
  {
    id: 'bg-scene-convoy-departure',
    url: '/assets/aistudio/HnVideoEditor_2025_06_14_045357615_70101bdb.mp4',
    sectionKey: 'section-documents',
    title: 'انطلاق القاطرات والمقطورات للتصدير عبر منفذ خطم الشكلة',
  },
  {
    id: 'bg-scene-salalah-muscat',
    url: '/assets/aistudio/HnVideoEditor_2025_06_17_044120386_cdb20068.mp4',
    sectionKey: 'section-advisor',
    title: 'العمليات اللوجستية الميدانية بين صلالة ومسقط',
  },
  {
    id: 'bg-scene-prepaid-prep',
    url: '/assets/aistudio/HnVideoEditor_2025_06_04_154222028_2314c21f.mp4',
    sectionKey: 'paradigm-section',
    title: 'تجهيز الشحنات المسبقة الدفع 100% لصالح مزرعة بركة الوقن',
  },
  {
    id: 'bg-scene-warehouse-cap',
    url: '/user_uploads/media_vid_vid-warehouse-capacity.mp4',
    sectionKey: 'section-01',
    title: 'توثيق ميداني: طاقة الاستيعاب والمخزون الفعلي في مخازن الشركة',
  },
  {
    id: 'bg-scene-warehouse-gate-2',
    url: '/user_uploads/media_vid_vid-warehouse-gate.mp4',
    sectionKey: 'section-02',
    title: 'توثيق ميداني: خروج الشاحنات المحملة من بوابة المخازن',
  },
  {
    id: 'bg-scene-logistics-hub-2',
    url: '/user_uploads/media_vid_vid-logistics-hub.mp4',
    sectionKey: 'section-03',
    title: 'توثيق ميداني: عمليات المناولة والشحن التصديري المباشر',
  },
  {
    id: 'bg-scene-multi-grid-2',
    url: '/user_uploads/media_vid_vid-multi-grid.mp4',
    sectionKey: 'section-04',
    title: 'توثيق ميداني: جاهزية أسطول شاحنات الـ 16 تريلا للتصدير',
  },
  {
    id: 'bg-scene-field-trucks-1',
    url: '/assets/aistudio/1749465951459_62e5fed5.mp4',
    sectionKey: 'section-05',
    title: 'توثيق ميداني: حركة الشاحنات والعمليات اللوجستية التصديرية (1)',
  },
  {
    id: 'bg-scene-field-trucks-2',
    url: '/assets/aistudio/1749472799812_09a6176a.mp4',
    sectionKey: 'section-06',
    title: 'توثيق ميداني: حركة الشاحنات والعمليات اللوجستية التصديرية (2)',
  },
  {
    id: 'bg-scene-field-trucks-3',
    url: '/assets/aistudio/VID-20231110-WA0059_1bab390b.mp4',
    sectionKey: 'section-documents',
    title: 'توثيق ميداني: جاهزية أسطول النقل والتصدير عبر المنافذ البرية',
  },
];

// Foreground Videos: The 7 Conversation Evidence Videos ("دلائل المحادثات") in exact order with clear sound, WhatsApp/Document interior poster frames & fullscreen zoom
export const FIELD_VIDEOS: FieldVideoItem[] = [
  {
    id: 'conv-evidence-1',
    url: '/assets/aistudio/lv_0_20261025172606_734a698d.mp4',
    posterUrl: '/assets/aistudio/poster-conv-1.jpg',
    title: 'دلائل المحادثات (1): محادثة ورسائل الوسيط الأجنبي (نوفل وكيل المطاحن Athanikkal) وتوثيق ساحة التحميل',
    subtitle: 'توثيق مرئي وصوتي لمحادثة الواتساب مع (نوفل وكيل المطاحن Athanikkal) ومطالبته بمبلغ 50 ريالاً يومياً عن كل شاحنة للإفراج عن الشحنة وتهديده بإلغاء المستندات',
    badge: 'دلائل المحادثات · الدليل 1',
    durationLabel: '00:25 · بالصوت الواضح',
    hasAudio: true,
    fitMode: 'contain',
    heightMode: 'lg',
  },
  {
    id: 'conv-evidence-2',
    url: '/assets/aistudio/lv_0_20261025172813_dfd07d17.mp4',
    posterUrl: '/assets/aistudio/poster-conv-2.jpg',
    title: 'دلائل المحادثات (2): أمر الشراء النقدي بتاريخ 7 مايو ومحادثة مسؤول المبيعات (مهند الرئيسي)',
    subtitle: 'توثيق مرئي وصوتي لأمر الشراء النقدي المسبق ومحادثة الواتساب بتاريخ 7 مايو 2026 وتذرع مسؤول المبيعات بالتواجد في المستشفى',
    badge: 'دلائل المحادثات · الدليل 2',
    durationLabel: '00:23 · بالصوت الواضح',
    hasAudio: true,
    fitMode: 'contain',
    heightMode: 'lg',
  },
  {
    id: 'conv-evidence-3',
    url: '/assets/aistudio/lv_0_20261025175515_91dcbb0a.mp4',
    posterUrl: '/assets/aistudio/poster-conv-3.jpg',
    title: 'دلائل المحادثات (3): التوثيق الثالث للمحادثات والاتصالات الرسمية الموثقة',
    subtitle: 'دلائل المحادثات الموثقة بالصوت والصورة، دليل رسمي رقم (3) قابل للتشغيل بالصوت الواضح وتكبير الشاشة الكاملة',
    badge: 'دلائل المحادثات · الدليل 3',
    durationLabel: '01:09 · بالصوت الواضح',
    hasAudio: true,
    fitMode: 'contain',
    heightMode: 'lg',
  },
  {
    id: 'conv-evidence-4',
    url: '/user_uploads/media_vid_conv-evidence-4.mp4',
    posterUrl: '/assets/aistudio/poster-conv-4.jpg',
    title: 'دلائل المحادثات (4): د. راشد حمد (وزارة التغير المناخي والبيئة الإماراتية) المتطلبات الأساسية على البطاقة التعريفية',
    subtitle: 'محادثة صوتية ومرئية موثقة توضح أن توفير البيانات الأساسية على البطاقة التعريفية للمنتج من قِبل المصنع كفيل بالموافقة السريعة على الطلب',
    badge: 'دلائل المحادثات · الدليل 4',
    durationLabel: '00:25 · بالصوت الواضح',
    hasAudio: true,
    fitMode: 'contain',
    heightMode: 'lg',
  },
  {
    id: 'conv-evidence-5',
    url: '/assets/aistudio/SVID_20261026_201726_1_2fd01b2c.mp4',
    posterUrl: '/assets/aistudio/poster-conv-5.jpg',
    title: 'دلائل المحادثات (5): نايف العبيدلي (المخلص الجمركي) توضيح البطاقة التعريفية وإقرار سلامة الغذاء (Food Safety Declaration)',
    subtitle: 'محادثة صوتية ومرئية موثقة تستعرض وثيقة شركة المطاحن العمانية وتؤكد أن المطلوب فقط وضوح البطاقة التعريفية وإفادة خلو المنتج من المادة لإنهاء الإجراءات',
    badge: 'دلائل المحادثات · الدليل 5',
    durationLabel: '00:34 · بالصوت الواضح',
    hasAudio: true,
    fitMode: 'contain',
    heightMode: 'lg',
  },
  {
    id: 'conv-evidence-6',
    url: '/assets/aistudio/SVID_20261026_201805_1_a183de68.mp4',
    posterUrl: '/assets/aistudio/poster-conv-6.jpg',
    title: 'دلائل المحادثات (6): نايف العبيدلي (المخلص الجمركي) إفادة الدكتور المختص حول مضاد الكوكسيديا واشتراط كتابة فترة السحب',
    subtitle: 'محادثة صوتية ومرئية موثقة تفيد بأن المنتج يحتوي على مضاد كوكسيديا يتبقى أثره في اللحم والبيض، واشتراط كتابة مدة السحب على البطاقة التعريفية',
    badge: 'دلائل المحادثات · الدليل 6',
    durationLabel: '00:41 · بالصوت الواضح',
    hasAudio: true,
    fitMode: 'contain',
    heightMode: 'lg',
  },
  {
    id: 'conv-evidence-7',
    url: '/assets/aistudio/SVID_20261026_201937_1_4e268ea8.mp4',
    posterUrl: '/assets/aistudio/poster-conv-7.jpg',
    title: 'دلائل المحادثات (7): د. راشد حمد (وزارة التغير المناخي والبيئة) اشتراط فترة سحب لا تقل عن 7 أيام وإلا تتوقف الشحنة',
    subtitle: 'محادثة صوتية ومرئية موثقة تؤكد أن النظام يشترط فترة سحب لا تقل عن 7 أيام وطلب إفادة رسمية من الشركة المنتجة وإلا تتوقف الشحنة والمسؤولية عليهم',
    badge: 'دلائل المحادثات · الدليل 7',
    durationLabel: '00:22 · بالصوت الواضح',
    hasAudio: true,
    fitMode: 'contain',
    heightMode: 'lg',
  },
];

// Mandatory 6-Section Hierarchy Cue Points (Strictly Non-Overlapping & Ordered 1 -> 6)
export const SECTION_TIMESTAMPS: Record<
  string,
  { start: number; end: number; label: string; nextSectionKey?: string; nextLabel?: string }
> = {
  hero: {
    start: 0,
    end: 36.8,
    label: '1. المقدمة: الالتزام المالي واللوجستي وإثبات الامتناع الإجرائي المقنّع',
    nextSectionKey: 'section4',
    nextLabel: '2. مذكرة الأسئلة الاستيضاحية (06:58)',
  },
  section1: {
    start: 92.5,
    end: 143.5,
    label: 'دوامة تقاذف المسؤوليات والبيروقراطية الكيدية بين خمسة مكاتب',
    nextSectionKey: 'section3',
    nextLabel: '3. الوقائع والتدخل الأجنبي (نوفل)',
  },
  section3: {
    start: 143.5,
    end: 292.8,
    label: '3. الوقائع والتدخل الأجنبي (نوفل) واحتجاز الشاحنات',
    nextSectionKey: 'section2',
    nextLabel: '4. الفخ المستندي (COA)',
  },
  section2: {
    start: 292.8,
    end: 408.5,
    label: '4. الفخ المستندي (COA) وتناقض البطاقة التعريفية (Layer 16%)',
    nextSectionKey: 'section5',
    nextLabel: '5. التأصيل القانوني',
  },
  section4: {
    start: 408.5,
    end: 454.2,
    label: 'اختراق توجيهات الرئيس التنفيذي بعد لقاء مسقط وتزويد مستندات ناقصة بأكثر من 50%',
    nextSectionKey: 'section5',
    nextLabel: '5. التأصيل القانوني',
  },
  section5: {
    start: 36.8,
    end: 92.5,
    label: '5. التأصيل القانوني (المرسوم السلطاني 67 لسنة 2014 والمرسوم 29 لسنة 2013)',
    nextSectionKey: 'section6',
    nextLabel: '6. الخلاصة والنداء الختامي (03:46)',
  },
  section6: {
    start: 454.2,
    end: 516.78,
    label: '6. الخلاصة والنداء الختامي أمام خالد المسروري مدير دائرة الاحتكار',
  },
};

// Verbatim written transcripts strictly adhering to the Anti-Duplication Ban List:
// - Financial figures (18,640 OMR / 1,870,000 OMR / 700 OMR) ONLY in hero (1. المقدمة)
// - Foreign broker "نوفل" & truck detention ONLY in section3 (3. الوقائع والتدخل الأجنبي)
// - COA & Layer 16% contradiction ONLY in section2 (4. الفخ المستندي)
// - Legal Decrees (67 لسنة 2014 & 29 لسنة 2013) ONLY in section5 (5. التأصيل القانوني)
export const RECORDING_VERBATIM_SECTIONS: Record<
  string,
  {
    badge: string;
    timeRange: string;
    heading: string;
    paragraphs: string[];
  }
> = {
  hero: {
    badge: 'القسم الأول · المقدمة والالتزام المالي واللوجستي',
    timeRange: '',
    heading: '1. المقدمة: الالتزام المالي الكامل (18,640 ر.ع و 1,870,000 ر.ع و 700 ر.ع) وإثبات الامتناع الإجرائي المقنّع',
    paragraphs: [
      'بسم الله الرحمن الرحيم. أنا بريك بن كليلة العامري، أبدأ من صلالة، حيث واجهت شركة بن كليلة العامري للتجارة والاستثمار إغلاق أكبر مستودع للأعلاف، فحملنا طموحنا الوطني واتجهنا نحو التصدير دعماً لمستهدفات رؤية عُمان 2040 بعقد توريد تبلغ قيمته الإجمالية 1,870,000 ريال عماني، وبسداد نقدي مسبق بنسبة 100% (18,640 ر.ع لكل دفعة تشغيلية لجدول 16 تريلا) بالإضافة إلى سداد 700 ر.ع مقدم نقل نقدي.',
      'جوهر هذا العرض أمام دائرة حماية المنافسة ومنع الاحتكار هو إثبات «الامتناع الإجرائي المقنّع»؛ فالبيع التصديري ليس مجرد أكياس توضع في مستودع، بل إن تسليم البضاعة التصديرية لا يكتمل إلا بتسليم ملحقات المبيع الإلزامية ومطابقته البيطرية والمعتمدة لعبور المنافذ الدولية.',
    ],
  },
  section1: {
    badge: 'دوامة المكاتب الخمسة (01:32 إلى 02:23)',
    timeRange: '01:32 إلى 02:23',
    heading: 'دوامة تقاذف المسؤوليات والبيروقراطية الكيدية بين خمسة مكاتب',
    paragraphs: [
      'تم تشتيت ملف التصدير عمداً بين خمسة مكاتب وإدارات داخل شركة المطاحن العمانية (مهند، فيصل، إدارة المبيعات، قسم التصدير، والقسم البيطري والفني)، بحيث يحيل كل مكتب المستثمر إلى المكتب الآخر في حلقة مفرغة من التعطيل التدويري المفتعل لإهدار الوقت وتفويت مواعيد التوريد.',
    ],
  },
  section3: {
    badge: 'القسم الثالث · الوقائع والتدخل الأجنبي (نوفل) سلاسل الإمداد (02:23 إلى 04:52)',
    timeRange: '02:23 إلى 04:52',
    heading: '3. الوقائع والتدخل الأجنبي (نوفل) سلاسل الإمداد واحتجاز الشاحنات 4 أيام',
    paragraphs: [
      'التزمت شركة بن كليلة العامري للتجارة والاستثمار بجدولة الشحن المسبقة المرفوعة بتاريخ 28 أبريل لتسيير 16 تريلا لكل دورة تشغيلية (40 يوماً)، غير أن حجب المصنع للمستندات البيطرية وتشتيت المعاملة بين خمسة مكاتب وضع 160,000 طير في مزرعة بركة الوقن أمام خطر نفاد المخزون العلفي؛ وكان الهدف الحقيقي من هذا التعطيل هو خنق خط التصدير المباشر لإجبار المزرعة تحت ضغط نفاد الأعلاف على التحول قسراً إلى الوسيط الأجنبي (نوفل).',
      'تكشف المكالمة الثلاثية المسجلة (30 دقيقة) مع مسؤولي المصنع (مهند وفيصل) الاستخفاف باحتجاز الوسيط الأجنبي (نوفل) للشاحنات المحملة لمدة 4 أيام متواصلة وتهديده بفرض إتاوة يومية، والتهديد الصريح من مدير المبيعات بإرجاع البضاعة من الحدود إلى المخازن، والاستهانة بالصفقة الوطنية ومستهدفات رؤية عُمان 2040 بوصفها «صفقة قليلة»، تحت سمع وبصر مكتب الرئيس التنفيذي.',
    ],
  },
  section2: {
    badge: 'القسم الرابع · الفخ المستندي (04:52 إلى 06:48)',
    timeRange: '04:52 إلى 06:48',
    heading: '4. الفخ المستندي (COA): تناقض شهادة التحليل المخبري مع البطاقة التعريفية ودس وثيقة علف بياض (Layer 16%)',
    paragraphs: [
      'إزاء تقاعس المصنع، بادر المستثمر الوطني بالتواصل المباشر مع المختصين في جمارك دبي (الأستاذ نايف العبدلي) ووزارة التغير المناخي والبيئة بدولة الإمارات (الدكتور راشد بالحمر)، حيث تبيّن أن النظام الرقابي يشترط تطابقاً كاملاً بين شهادة التحليل المخبري (COA) والبطاقة التعريفية وإثبات فترة سحب آمنة (7 أيام) لمضادات الكوكسيديا.',
      'بدلاً من تسليم وثائق مطابقة لأعلاف التسمين المتعاقد عليها (Broiler Starter & Finisher)، عمد المصنع إلى إرسال إقرار سلامة ووثائق تخص منتجاً مغايراً تماماً هو «علف بياض» (Layer 16%)، فضلاً عن تناقض شهادة التحليل المخبري COA (التي تثبت 0% مضادات كوكسيديا) مع البطاقة التعريفية المطبوعة على الكيس، مما أدى لإغلاق الطلب المقيد في نظام MOCCAE آلياً، واستمر تزويد المستندات منقوصة بأكثر من 50% حتى بعد لقاء الرئيس التنفيذي في مسقط.',
    ],
  },
  section4: {
    badge: 'اختراق توجيهات الإدارة العليا',
    timeRange: '',
    heading: 'اختراق توجيهات الرئيس التنفيذي بعد لقاء مسقط وتزويد مستندات ناقصة بأكثر من 50%',
    paragraphs: [
      'حتى بعد توجه المستثمر الوطني إلى مسقط ولقاء الرئيس التنفيذي الذي أصدر توجيهاته المباشرة بتسليم كافة المستندات الصحيحة فوراً، تعمّدت الإدارة التنفيذية الالتفاف على تلك التوجيهات وتزويد المستثمر بمستندات ناقصة بأكثر من 50% من المتطلبات الإلزامية.',
    ],
  },
  section5: {
    badge: 'القسم الخامس · التأصيل القانوني الحصري',
    timeRange: '',
    heading: '5. التأصيل القانوني: المرسوم السلطاني رقم 67 لسنة 2014 والمرسوم السلطاني رقم 29 لسنة 2013',
    paragraphs: [
      'إن التذرع بأن المصنع «سلّم الأكياس في المستودع ولم يرفض البيع شكلياً» هو دفع ساقط قانوناً؛ فبموجب المادتين (9 و10) من قانون حماية المنافسة ومنع الاحتكار الصادر بالمرسوم السلطاني رقم 67 لسنة 2014، يُحظر الامتناع الضمني المقنّع عن التعامل وإساءة استغلال الوضع المهيمن لتقييد المنافسة أو إقصاء المتعامل الوطني.',
      'وبموجب المادة (381) والمادتين (155 و156) من قانون المعاملات المدنية الصادر بالمرسوم السلطاني رقم 29 لسنة 2013، يلتزم البائع وجوباً بتسليم المبيع وملحقاته الضرورية التي لا يتم الانتفاع بالمبيع بدونها وتنفيذ العقد بحسن نية؛ وفي عقود التصدير تُعد الوثائق الفنية والصحية السليمة ركناً لا ينفصل عن إتمام التسليم القانوني.',
    ],
  },
  section6: {
    badge: 'القسم السادس · الخلاصة والنداء الختامي',
    timeRange: '03:46',
    heading: '6. الخلاصة والنداء الختامي أمام أستاذ خالد المسروري مدير دائرة الاحتكار',
    paragraphs: [
      'أستاذ خالد المسروري المحترم مدير دائرة حماية المنافسة ومنع الاحتكار، إن الوقائع المسجلة والمستندات المرفقة تثبت بما لا يدع مجالاً للشك أننا أمام تعطيل ممنهج متكامل الأركان استهدف خنق خط التصدير الوطني الذي أسسناه بجهدنا الخالص بعد إغلاق مستودعنا في صلالة.',
      'يُقدم هذا الملف إلى مركز حماية المنافسة ومنع الاحتكار بوزارة التجارة والصناعة وترويج الاستثمار، التماساً لوقف هذه الممارسات الإقصائية، وإعادة الحق التجاري لمن أسسه، وحماية الصادرات العُمانية غير النفطية في مسار رؤية عُمان 2040.',
    ],
  },
};

export const ORIGINAL_10_AUDIO_CHAPTERS: OriginalAudioChapter[] = [
  {
    index: 1,
    speaker: 'التسجيل الموثق · القسم 1',
    time: 'القسم الأول',
    start: 0,
    end: 36.8,
    title: '1. المقدمة: الالتزام المالي الكامل وإثبات الامتناع المقنّع',
    text: 'الانطلاق من صلالة نحو التصدير غير النفطي في مسار رؤية عُمان 2040 بعقد 1,870,000 ر.ع وسداد مسبق 100% (18,640 ر.ع) و700 ر.ع مقدم نقل، وإثبات أن التسليم التصديري لا يكتمل إلا بتسليم ملحقاته.',
  },
  {
    index: 2,
    speaker: 'التسجيل الموثق · القسم 3',
    time: '01:32 إلى 04:52',
    start: 92.5,
    end: 292.8,
    title: '3. الوقائع والتدخل الأجنبي (نوفل) سلاسل الإمداد واحتجاز الشاحنات 4 أيام',
    text: 'تشتيت الملف بين خمسة مكاتب بالمصنع واستنزاف مخزون المزرعة (160,000 طير) لفرض الوسيط الأجنبي (نوفل)، وتوثيق احتجاز الشاحنات 4 أيام واعترافات المكالمة الثلاثية (30 دقيقة).',
  },
  {
    index: 3,
    speaker: 'التسجيل الموثق · القسم 4',
    time: '04:52 إلى 06:48',
    start: 292.8,
    end: 454.2,
    title: '4. الفخ المستندي (COA): تناقض شهادة التحليل مع البطاقة (Layer 16%)',
    text: 'التواصل المباشر مع جمارك دبي ووزارة البيئة، وكشف تناقض شهادة التحليل المخبري (COA) مع الملصق التعريفي وإرسال إقرار علف بياض (Layer 16%) غير متعاقد عليه.',
  },
  {
    index: 4,
    speaker: 'التسجيل الموثق · القسم 5',
    time: 'التأصيل القانوني',
    start: 36.8,
    end: 92.5,
    title: '5. التأصيل القانوني: المرسوم السلطاني 67 لسنة 2014 والمرسوم السلطاني 29 لسنة 2013',
    text: 'انطباق المادتين (9 و10) من قانون حماية المنافسة ومنع الاحتكار الصادر بالمرسوم 67 لسنة 2014 والمادة (381) والمادتين (155 و156) من قانون المعاملات المدنية الصادر بالمرسوم 29 لسنة 2013.',
  },
  {
    index: 5,
    speaker: 'التسجيل الموثق · القسم 6',
    time: '03:46',
    start: 454.2,
    end: 516.78,
    title: '6. الخلاصة والنداء الختامي أمام أستاذ خالد المسروري مدير دائرة الاحتكار',
    text: 'الخلاصة التنفيذية والنداء الختامي لردع التعسف وحماية الصادرات العُمانية غير النفطية في مسار رؤية عُمان 2040.',
  },
];

export const SYNCED_SCRIPT_SEGMENTS: SyncedScriptSegment[] = [
  {
    id: 'seg-1',
    sectionId: 'hero-section',
    start: 0,
    end: 36.8,
    title: '1. المقدمة والالتزام المالي واللوجستي',
    text: '1. المقدمة: بسم الله الرحمن الرحيم، أنا بريك بن كليلة العامري... سداد نقدي مسبق 100% (18,640 ر.ع) ضمن عقد 1,870,000 ر.ع و700 ر.ع مقدم نقل، وإثبات أن التسليم التصديري لا يكتمل إلا بتسليم ملحقات المبيع الإلزامية.',
  },
  {
    id: 'seg-2',
    sectionId: 'section-05',
    start: 36.8,
    end: 92.5,
    title: '5. التأصيل القانوني (المرسوم 67 لسنة 2014 والمرسوم 29 لسنة 2013)',
    text: '5. التأصيل القانوني: مخالفة المادتين (9 و10) من المرسوم السلطاني رقم 67 لسنة 2014 والمادة (381) والمادتين (155 و156) من المرسوم السلطاني رقم 29 لسنة 2013.',
  },
  {
    id: 'seg-3',
    sectionId: 'section-03',
    start: 92.5,
    end: 292.8,
    title: '3. الوقائع والتدخل الأجنبي (نوفل) سلاسل الإمداد واحتجاز الشاحنات',
    text: '3. الوقائع والتدخل الأجنبي: دوامة المكاتب الخمسة، استنزاف مخزون المزرعة (160,000 طير) لتمرير العميل للوسيط الأجنبي (نوفل)، واحتجاز الشاحنات 4 أيام واعترافات المكالمة الثلاثية.',
  },
  {
    id: 'seg-4',
    sectionId: 'section-02',
    start: 292.8,
    end: 454.2,
    title: '4. الفخ المستندي (COA) وتناقض البطاقة (Layer 16%)',
    text: '4. الفخ المستندي (COA): تناقض شهادة التحليل المخبري (0% مضادات كوكسيديا) مع البطاقة التعريفية، ودس إقرار سلامة لمنتج علف بياض (Layer 16%) غير متعاقد عليه.',
  },
  {
    id: 'seg-5',
    sectionId: 'section-executive-appeal',
    start: 454.2,
    end: 516.78,
    title: '6. الخلاصة والنداء الختامي أمام أستاذ خالد المسروري مدير دائرة الاحتكار',
    text: '6. الخلاصة والنداء الختامي: الوقائع المسجلة تثبت أننا أمام تعطيل ممنهج يستوجب التدخل الرقابي لحماية الصادرات العُمانية غير النفطية ورؤية عُمان 2040.',
  },
];

export interface TopShowcaseItem {
  url: string;
  title: string;
  badge: string;
  mediaType?: 'image' | 'video';
  posY?: number;
  posX?: number;
  fitMode?: 'cover' | 'contain';
  scale?: number;
  heightMode?: 'sm' | 'md' | 'lg' | 'xl';
}

export const FLEET_PHOTOS: TopShowcaseItem[] = [
  {
    url: '/assets/aistudio/lv_0_20261028134636_4e4aa5be.mp4',
    title: 'توثيق ميداني متعدد الزوايا: أسطول الشاحنات وحركة التحميل الليلية والنهارية من مخازن الشركة',
    badge: 'جدول 16 تريلا · فيديو المخازن والشاحنات',
    mediaType: 'video',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/lv_0_20261028134455_cc14d4e3.mp4',
    title: 'توثيق ميداني (8 زوايا): الطاقة الاستيعابية للمخازن وتستيف الأعلاف وحركة الشاحنات',
    badge: 'المخازن والعمليات الميدانية',
    mediaType: 'video',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/lv_0_20261028134258_d3832aa8.mp4',
    title: 'توثيق كاميرات المخازن وحركة القاطرات والمقطورات المحملة بأعلاف التصدير',
    badge: 'المخازن والشاحنات',
    mediaType: 'video',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/lv_0_20261028133542_ab5f6431.mp4',
    title: 'مخزون الأعلاف الضخم وشاحنات فولفو أمام بوابة مخازن شركة بن كليلة العامري للتجارة والاستثمار',
    badge: 'مخازن وأسطول الشركة',
    mediaType: 'video',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/lv_0_20261028134407_7852f706.mp4',
    title: 'توثيق ميداني: بوابة مخازن شركة بن كليلة العامري للتجارة والاستثمار والشاحنات المحملة',
    badge: 'بوابة المخازن والشاحنات',
    mediaType: 'video',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/lv_0_20261028133832_1c84c9bf.mp4',
    title: 'توثيق شامل لحركة أسطول الـ 16 تريلا وعمليات التحميل داخل المستودعات',
    badge: 'جدول 16 تريلا',
    mediaType: 'video',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/lv_0_20261028133940_fa89726b.mp4',
    title: 'انطلاق شاحنات الشركة من البوابة الرئيسية للمخازن والحاويات المعتمدة',
    badge: 'أسطول التصدير',
    mediaType: 'video',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/lv_0_20261028134539_f77457c5.mp4',
    title: 'عمليات الشحن والمناولة الميدانية في مستودعات شركة بن كليلة العامري للتجارة والاستثمار',
    badge: 'عمليات المناولة والشحن',
    mediaType: 'video',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/1748373500972_fbbec0fe.jpg',
    title: 'توثيق ليلي للشاحنات المحملة بأعلاف بركات الوطنية ضمن جدول التصدير',
    badge: 'جدول 16 تريلا',
    mediaType: 'image',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/1757657643149_167f917d.jpg',
    title: 'العمليات الميدانية والتحميل الفعلي داخل مخازن شركة بن كليلة العامري للتجارة والاستثمار',
    badge: 'المخازن والعمليات الميدانية',
    mediaType: 'image',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/fleet1.jpg',
    title: 'انطلاق الشحنة الأولى وعبور منفذ خطم الشكلة خلال 24 ساعة',
    badge: 'عقد شحن المئة أسبوع',
    mediaType: 'image',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/fleet2.jpg',
    title: 'جاهزية الشاحنات المعتمدة لنقل شحنات أعلاف الدواجن (علامة بركات)',
    badge: 'سداد نقدي مسبق 100%',
    mediaType: 'image',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/Screenshot_20251102_070334349_69d4bd17.jpg',
    title: 'العرض الاستراتيجي لتعزيز الحصة السوقية وحوكمة الصادرات غير النفطية',
    badge: 'رؤية عُمان 2040',
    mediaType: 'image',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
  {
    url: '/assets/aistudio/fleet3.jpg',
    title: 'توثيق ميداني لجدول شحن الـ 16 تريلا لصالح مزرعة بركة الوقن',
    badge: 'جدول 16 تريلا',
    mediaType: 'image',
    posY: 50,
    posX: 50,
    fitMode: 'cover',
  },
];

export const HERO_AUDIO_SCRIPT = `1. المقدمة: بسم الله الرحمن الرحيم، أنا بريك بن كليلة العامري، أبدأ من صلالة. التزمنا بسداد نقدي مسبق بنسبة 100% بواقع 18,640 ريالاً عمانياً لكل دفعة تشغيلية في عقد قيمته 1,870,000 ريال عماني وسداد 700 ريال عماني مقدم نقل؛ وجوهر هذا العرض هو إثبات أن تسليم البضاعة التصديرية لا يكتمل إلا بتسليم ملحقات المبيع الإلزامية.`;

export const SECTION_AUDIO_SCRIPTS: Record<string, string> = {
  section1: `دوامة تقاذف المسؤوليات بين خمسة مكاتب داخل المصنع لإهدار الوقت وتعطيل البت في طلبات التصدير.`,
  section3: `3. الوقائع والتدخل الأجنبي: التزام المستثمر بجدولة 28 أبريل مقابل حجب المستندات البيطرية لاستنزاف مخزون المزرعة البالغ 160 ألف طير وخنق خط التصدير لدفع العميل قسراً نحو الوسيط الأجنبي نوفل، واعترافات المكالمة الثلاثية باحتجاز الشاحنات أربعة أيام.`,
  section2: `4. الفخ المستندي: المسار النظامي الذاتي والتواصل مع جمارك دبي ووزارة البيئة، وكشف تناقض شهادة التحليل المخبري COA مع البطاقة التعريفية وإرسال إقرار سلامة لمنتج علف بياض Layer 16% مغاير لأعلاف التسمين المتعاقد عليها.`,
  section4: `اختراق توجيهات الرئيس التنفيذي بعد لقاء مسقط وتزويد المستثمر بمستندات ناقصة بأكثر من 50% من المتطلبات الإلزامية.`,
  section5: `5. التأصيل القانوني: دحض ذريعة لم نرفض البيع وفق المرسوم السلطاني 67 لسنة 2014 المادتين 9 و10 والمرسوم السلطاني 29 لسنة 2013 المادة 381 والمادتين 155 و156.`,
  section6: `6. الخلاصة والنداء الختامي للعرض أمام خالد المسروري مدير دائرة الاحتكار لحماية الصادرات العُمانية غير النفطية ودعم رؤية عُمان 2040.`,
};

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-pdf-procedural-obstruction-1',
    badge: 'عرض تقديمي PDF رسمي (12 شريحة)',
    badgeColor: 'purple',
    mediaType: 'pdf',
    mimeType: 'application/pdf',
    fileUrl: '/assets/aistudio/Evidence_of_Procedural_Obstruction__1__1__7f16e01d.pdf',
    previewUrl: '/assets/aistudio/Screenshot_20251102_070334349_69d4bd17.jpg',
    startTime: 0,
    endTime: 36.8,
    title: 'العرض التقديمي (1): الرفض المُقنّع — أدلة التعطيل الإجرائي والتلاعب المستندي (PDF)',
    description:
      'عرض تقديمي رسمي موثق (12 شريحة PDF) يفند سؤال «هل منعوا عنك البيع؟» عبر 12 دليلاً استقصائياً قاطعاً حول الالتزام النقدي المسبق 100% والفخ المستندي (COA) والتدخل الأجنبي (نوفل).',
    pages: [
      {
        pageNumber: 1,
        title: 'الرفض المُقنّع: أدلة التعطيل الإجرائي والتلاعب المستندي',
        subtitle: 'تفنيد سؤال «هل منعوا عنك البيع؟» عبر 12 دليلاً استقصائياً قاطعاً',
        referenceCode: 'PDFEVID01',
        content: [
          'تقديم شركة بن كليلة العامري للتجارة والاستثمار رداً رسمياً موثقاً بالمستندات.',
          'إثبات السداد النقدي المسبق بنسبة 100% (18,640 ر.ع لكل دورة تشغيلية) وجدول توريد 15 حمولة بتاريخ 28 أبريل.',
          'توثيق التناقض القاتل بين شهادة التحليل المخبري (COA) والبطاقة التعريفية وإقرار Layer 16%.',
        ],
      },
    ],
  },
  {
    id: 'doc-pdf-export-sabotage-2',
    badge: 'ملف أدلة استقصائي PDF (11 شريحة)',
    badgeColor: 'gold',
    mediaType: 'pdf',
    mimeType: 'application/pdf',
    fileUrl: '/assets/aistudio/Export_Sabotage_Investigation_Dossier_2__9c339b6c.pdf',
    previewUrl: '/assets/aistudio/fleet1.jpg',
    startTime: 92.5,
    endTime: 292.8,
    title: 'العرض التقديمي (2): الرد الرسمي بشأن رفض البيع وكشف حقائق التعطيل الإجرائي (PDF)',
    description:
      'ملف أدلة استقصائي (11 شريحة PDF) يوثق بالأدلة الميدانية والمالية التزام المستثمر الوطني (100% دفع نقدي مسبق) مقابل حجب الملحقات التصديرية ومحاولة فرض الوسيط الخارجي (نوفل).',
    pages: [
      {
        pageNumber: 1,
        title: 'الرد الرسمي بشأن رفض البيع وكشف حقائق التعطيل الإجرائي',
        subtitle: 'ملف أدلة استقصائي موجه إلى الجهات الرقابية المختصة',
        referenceCode: 'PDFEVID02',
        content: [
          'مصفوفة التدقيق الجنائي للالتزام المالي واللوجستي لشركة بن كليلة العامري للتجارة والاستثمار.',
          'توثيق مسار التحويلات المالية وأجور النقل واحتجاز الشاحنات 4 أيام.',
          'التأصيل القانوني للامتناع المقنّع عن التعامل وفق المرسوم السلطاني 67 لسنة 2014.',
        ],
      },
    ],
  },
  {
    id: 'doc-pdf-executive-audit-3',
    badge: 'Executive Audit Dossier PDF (10 شرائح)',
    badgeColor: 'purple',
    mediaType: 'pdf',
    mimeType: 'application/pdf',
    fileUrl: '/assets/aistudio/Executive_Audit_Dossier_1__ef4ba072.pdf',
    previewUrl: '/assets/aistudio/fleet2.jpg',
    startTime: 292.8,
    endTime: 454.2,
    title: 'العرض التقديمي (3): ملف التدقيق التنفيذي — كشف حقائق التعطيل الإجرائي الممنهج (PDF)',
    description:
      'عرض تقديمي تنفيذي (10 شرائح PDF) يستعرض جدول التوريد المبرمج (28 أبريل)، وهيكل التدفقات المالية، والفخ الجمركي في شهادة التحليل المخبري (COA)، والأسئلة الرقابية الـ 12.',
    pages: [
      {
        pageNumber: 1,
        title: 'الرد الرسمي على استفسار رفض البيع وكشف حقائق التعطيل الإجرائي الممنهج',
        subtitle: 'Executive Audit Dossier — شركة بن كليلة العامري للتجارة والاستثمار',
        referenceCode: 'PDFEVID03',
        content: [
          'إثبات الجدية المطلقة وحسن النية التجارية عبر السداد النقدي المسبق 100%.',
          'تحليل تناقض شهادة التحليل المخبري (0% مضادات كوكسيديا) مع الملصق التعريفي وإقرار Layer 16%.',
          'مطالب الحوكمة وحماية خط التصدير الوطني في مسار رؤية عُمان 2040.',
        ],
      },
    ],
  },
  {
    id: 'doc-pdf-national-export-lines-4',
    badge: 'تقييم إجرائي للتصدير PDF (12 شريحة)',
    badgeColor: 'gold',
    mediaType: 'pdf',
    mimeType: 'application/pdf',
    fileUrl: '/assets/aistudio/___________________________1__52bb81ce.pdf',
    previewUrl: '/assets/aistudio/fleet3.jpg',
    startTime: 454.2,
    endTime: 516.78,
    title: 'العرض التقديمي (4): حماية خطوط التصدير الوطنية — تقييم إجرائي لعمليات التصدير إلى الإمارات (PDF)',
    description:
      'عرض تقديمي استراتيجي (12 شريحة PDF) يوثق تقييم عمليات التصدير إلى دولة الإمارات العربية المتحدة، ومقارنة التزام المستثمر الوطني مقابل العوائق الإجرائية والمستندات المخبرية.',
    pages: [
      {
        pageNumber: 1,
        title: 'حماية خطوط التصدير الوطنية: تقييم إجرائي لعمليات التصدير إلى دولة الإمارات',
        subtitle: 'مذكرة استيضاحية مبنية على الوقائع الميدانية والمستندات الرسمية',
        referenceCode: 'PDFEVID04',
        content: [
          'توثيق تأسيس السوق التصديري بجهد وطني خالص لصالح مزرعة بركة الوقن (160,000 طير).',
          'تحليل المسار التعاقدي المباشر ورفض المزرعة الإماراتية التعامل مع الوسيط الأجنبي (نوفل).',
          'التوصيات الرقابية لحماية الصادرات العُمانية غير النفطية.',
        ],
      },
    ],
  },
  {
    id: 'doc-royal-presentation',
    badge: 'عرض تقديمي شامل',
    badgeColor: 'purple',
    mediaType: 'presentation',
    startTime: 0,
    endTime: 36.8,
    title: 'العرض التقديمي الملكي الشامل (22 شريحة)',
    description:
      'الاطلاع الكامل والتفصيل المستندي المسجل لتسلسل أحداث الصفقة التصديرية من صلالة إلى مسقط ومزرعة بركة الوقن في مسار رؤية عُمان 2040.',
    pages: [
      {
        pageNumber: 1,
        title: 'الملخص التنفيذي للصفقة التصديرية غير النفطية والسجل المالي الموثق',
        subtitle: 'الشرائح 1 إلى 5 | الانتقال الاستراتيجي من صلالة إلى خط التصدير السيادي (رؤية عُمان 2040)',
        referenceCode: 'OM2040',
        content: [
          'المصدر الرسمي الموثق للبيانات المالية: عقود وأوامر الشراء وإشعارات التحويل البنكي لشركة بن كليلة العامري للتجارة والاستثمار (سجل تجاري رقم 1111061) لصالح مزرعة بركة الوقن بدولة الإمارات العربية المتحدة.',
          'قيمة عقد التوريد (100 أسبوع): 1,870,000 ريال عماني، مع سداد نقدي مسبق بنسبة 100% بواقع 18,640 ريالاً عمانياً لكل دفعة تشغيلية (16 تريلا كل دورة 40 يوماً)، وإيصال سداد 700 ريال عماني دفعة نقل مقدمة نقداً.',
        ],
      },
      {
        pageNumber: 2,
        title: 'توثيق الواقعة الفنية: تناقض شهادة (COA) ودس وثيقة علف البياض (Layer 16%)',
        subtitle: 'الشرائح 6 إلى 14 | أسباب الإغلاق الآلي في نظام MOCCAE الإماراتي',
        referenceCode: 'MOCCAE2026',
        content: [
          'تاريخ 23 يونيو 2026: أصدرت دائرة الجودة بشركة المطاحن العمانية شهادة تحليل مخبري (COA) تقرر خلو المنتج تماماً (0%) من أي مضادات كوكسيديا (Anticoccidials)، بينما تضمنت البطاقة المطبوعة على الأكياس برنامج تدوير مضادات الكوكسيديا.',
          'عمد المصنع إلى إرسال إقرار سلامة لمنتج مغاير تماماً هو علف بياض (Layer 16%) بدلاً من أعلاف التسمين المتعاقد عليها (Broiler Starter & Finisher)، وتزويد المستثمر بمستندات ناقصة بأكثر من 50% رغم توجيهات الرئيس التنفيذي.',
          'أدى هذا التناقض الصارخ إلى رفض الطلب المقيد لدى وزارة التغير المناخي والبيئة الإماراتية لعدم تطابق الوثائق الإلزامية وفق معيار ISO 17025.',
        ],
      },
      {
        pageNumber: 3,
        title: 'خنق خط التصدير واحتجاز الشاحنات 4 أيام لتمكين الوسيط الخارجي (نوفل)',
        subtitle: 'الشرائح 15 إلى 22 | اعترافات المكالمة الثلاثية ومخالفة قواعد حماية المنافسة',
        referenceCode: 'GOVAUDIT2026',
        content: [
          'حجب مستندات التصدير البيطرية والصحية الإلزامية لاستنزاف المخزون العلفي في مزرعة بركة الوقن (160,000 طير) وإجبار العميل تحت ضغط الوقت على التحول قسراً إلى قناة الوسيط الخارجي (المدعو نوفل).',
          'احتجاز الشاحنات المحملة لمدة 4 أيام متواصلة بعد استلام مقدم النقل النقدي، والتهديد الصريح في المكالمة الثلاثية الرسمية بإرجاع البضاعة من الحدود إلى المخازن.',
          'محاولة فرض إتاوة غير قانونية بواقع 50 ر.ع عن كل شحنة مقابل تسهيل أذونات التحميل المحتجزة إدارياً داخل المصنع.',
        ],
      },
    ],
  },
  {
    id: 'doc-complaint-matrix',
    badge: 'شكوى ومصفوفة أدلة',
    badgeColor: 'gold',
    title: 'ملف الشكوى الرسمية ومصفوفة الأدلة',
    description:
      'الموجه إلى مركز حماية المنافسة ومنع الاحتكار بوزارة التجارة والصناعة بعناية أستاذ خالد المسروري مدير الدائرة، مدعماً بصور الشهادات وسجلات المكالمة الثلاثية.',
    pages: [
      {
        pageNumber: 1,
        title: 'مصفوفة الأدلة المادية والمستندية المرفقة بالشكوى',
        subtitle: 'مركز حماية المنافسة ومنع الاحتكار | ملف المراجع أستاذ خالد المسروري',
        referenceCode: 'COMP672014',
        content: [
          'الدليل رقم (1): إشعارات السداد البنكي المسبق بنسبة 100% بالكامل وإيصالات سداد دفعات النقل النقدية قبل واقعة احتجاز الشاحنات لمدة 4 أيام.',
          'الدليل رقم (2): نسخة شهادة التحليل المخبري (COA) المؤرخة 23 يونيو 2026م مقابل صورة البطاقة التعريفية المطبوعة على الأكياس، ووثيقة علف البياض (Layer 16%) المغايرة للعقد.',
          'الدليل رقم (3): إشعار النظام الرقمي لوزارة التغير المناخي والبيئة بدولة الإمارات (MOCCAE) المتضمن سبب الإغلاق الفني لعدم تطابق المستندات.',
          'الدليل رقم (4): التسجيل الصوتي للمكالمة الثلاثية الرسمية (30 دقيقة) المتضمن التهديد بإرجاع الشحنة من الحدود للمخازن ووصف الصفقة الوطنية بأنها «صفقة قليلة».',
        ],
      },
      {
        pageNumber: 2,
        title: 'طلبات الشاكية أمام وزارة التجارة والصناعة وترويج الاستثمار',
        subtitle: 'الإجراءات الرقابية العاجلة لحماية الصادرات غير النفطية في مسار رؤية عُمان 2040',
        referenceCode: 'REQMOCIIP2026',
        content: [
          '1. إيفاد فريق تفتيش رقابي للتحقق من واقعة التناقض المستندي بين شهادات الجودة والملصقات التجارية ودس وثيقة علف البياض لتعطيل التصدير.',
          '2. التحقيق في ممارسات التعطيل التدويري بين المكاتب الخمسة وحجب المستندات البيطرية الإلزامية لدفع العميل قسراً نحو الوسيط الخارجي (نوفل) واحتجاز الشاحنات 4 أيام.',
          '3. إلزام الشركة المشكو في حقها بوقف الممارسات التعسفية وتمكين الناقل والمستثمر الوطني (شركة بن كليلة العامري للتجارة والاستثمار) من نفاذ شحناته وفق وثائق فنية مطابقة وصحيحة.',
        ],
      },
    ],
  },
  {
    id: 'doc-legal-rebuttal',
    badge: 'تأصيل تشريعي',
    badgeColor: 'purple',
    title: 'مذكرة الرد على دفع (لم نرفض البيع)',
    description:
      'التأصيل القانوني للمادة (381) معاملات مدنية والمادتين (9 و10) من قانون حماية المنافسة لدحض ذريعة التسليم الشكلي.',
    pages: [
      {
        pageNumber: 1,
        title: 'دحض ذريعة «لم نرفض البيع» في ضوء المرسوم السلطاني 67 لسنة 2014',
        subtitle: 'المادتان (9 و10) من قانون حماية المنافسة ومنع الاحتكار',
        referenceCode: 'LEGAL672014',
        content: [
          'تذرعت إدارة المبيعات بأنها «لم ترفض البيع شكلياً»، غير أن الفقه والقضاء المستقرين في قوانين المنافسة يقرران أن الامتناع المحظور لا يقتصر على الرفض الصريح، بل يشمل "الامتناع الضمني المقنّع" (Constructive Refusal to Deal).',
          'إن قبول ثمن البضاعة كاملاً ومقدماً لعقد تصديري معلوم الوجهة لصالح مزرعة بركة الوقن، ثم تسليم المشتري وثائق فنية متناقضة وناقصة بأكثر من 50% يستحيل معها عبور البضاعة جمركياً، هو في حقيقته القانونية امتناع تعسفي عن التعامل وإساءة استغلال للوضع المهيمن.',
        ],
      },
      {
        pageNumber: 2,
        title: 'الالتزام بتسليم ملحقات المبيع وحسن النية في المرسوم السلطاني 29 لسنة 2013',
        subtitle: 'المادة (381) والمادتان (155 و156) من قانون المعاملات المدنية',
        referenceCode: 'LEGAL292013',
        content: [
          'تنص المادة (381) من قانون المعاملات المدنية العماني الصادر بالمرسوم السلطاني رقم 29 لسنة 2013 على أن التزام البائع بالتسليم يشمل تسليم المبيع وملحقاته الضرورية التي لا يتم الانتفاع بالمبيع بدونها بحسب طبيعته والغرض المقصود منه.',
          'في البيوع الدولية والتصديرية، تُعد شهادة التحليل المخبري المطابقة للملصق التعريفي (COA & Label Compliance) والشهادات البيطرية المكتملة من الملحقات الجوهرية اللازمة لنفاذ البضاعة؛ فالتسليم المجرد من وثائق صحيحة يُعد عدماً من الناحية القانونية ويوجب المساءلة بمقتضى المادتين (155 و156).',
        ],
      },
    ],
  },
];

export const QUICK_QUESTIONS = [
  {
    label: 'ما هو الرد على مقولة لم نرفض البيع؟',
    question: 'ما هو الرد القانوني الموثق على مقولة وذريعة (لم نرفض البيع) التي تذرعت بها شركة المطاحن العمانية؟',
  },
  {
    label: 'سند متناقض الكيس والشهادة (COA)',
    question: 'اشرح بالتفصيل واقعة التناقض المستندي بين شهادة التحليل المخبري (COA) والبطاقة التعريفية ودس وثيقة علف البياض (Layer 16%).',
  },
  {
    label: 'أثر التعطيل على رؤية عُمان 2040',
    question: 'ما هي الأضرار التشغيلية والتعاقدية الناتجة عن الإبطاء المتعمد وتأخير أذونات التحميل لشحنات الـ 16 تريلا على مسار الصادرات غير النفطية ورؤية عُمان 2040؟',
  },
  {
    label: 'خنق خط التصدير واعترافات المكالمة الثلاثية',
    question: 'ما هي تفاصيل خنق خط التصدير لدفع العميل نحو الوسيط (نوفل) واعترافات المكالمة الثلاثية باحتجاز الشاحنات 4 أيام؟',
  },
];

// Pre-generated studio Arabic TTS MP3 files for instant, zero-latency spoken responses in the Smart Legal Advisor
export const ADVISOR_PREGENERATED_AUDIO_URLS: Record<string, string> = {
  'welcome-msg': '/assets/aistudio/advisor_welcome.mp3',
  'chat-welcome-msg': '/assets/aistudio/advisor_welcome.mp3',
  'ما هو الرد على مقولة لم نرفض البيع؟': '/assets/aistudio/advisor_q1.mp3',
  'ما هو الرد القانوني الموثق على مقولة وذريعة (لم نرفض البيع) التي تذرعت بها شركة المطاحن العمانية؟':
    '/assets/aistudio/advisor_q1.mp3',
  'سند متناقض الكيس والشهادة (COA)': '/assets/aistudio/advisor_q2.mp3',
  'اشرح بالتفصيل واقعة التناقض المستندي بين شهادة التحليل المخبري (COA) والبطاقة التعريفية ودس وثيقة علف البياض (Layer 16%).':
    '/assets/aistudio/advisor_q2.mp3',
  'أثر التعطيل على رؤية عُمان 2040': '/assets/aistudio/advisor_q3.mp3',
  'ما هي الأضرار التشغيلية والتعاقدية الناتجة عن الإبطاء المتعمد وتأخير أذونات التحميل لشحنات الـ 16 تريلا على مسار الصادرات غير النفطية ورؤية عُمان 2040؟':
    '/assets/aistudio/advisor_q3.mp3',
  'خنق خط التصدير واعترافات المكالمة الثلاثية': '/assets/aistudio/advisor_q4.mp3',
  'ما هي تفاصيل خنق خط التصدير لدفع العميل نحو الوسيط (نوفل) واعترافات المكالمة الثلاثية باحتجاز الشاحنات 4 أيام؟':
    '/assets/aistudio/advisor_q4.mp3',
};

export const FALLBACK_ANSWERS: Record<string, string> = {
  'ما هو الرد القانوني الموثق على مقولة وذريعة (لم نرفض البيع) التي تذرعت بها شركة المطاحن العمانية؟': `إن ذريعة **«لم نرفض البيع»** ساقطة قانوناً وتفنّدها نصوص التشريعات العُمانية النافذة من وجهين حاسمين:

1. **بموجب قانون حماية المنافسة ومنع الاحتكار الصادر بالمرسوم السلطاني رقم 67 لسنة 2014 (المادتان 9 و10):**
   يحظر القانون إساءة استغلال الوضع المهيمن والامتناع عن التعامل دون مسوغ مشروع. وفي التكييف القانوني السليم، فإن استلام كامل الثمن مسبقاً لعقد تصديري، ثم تعمد تسليم وثائق فنية متناقضة وناقصة بأكثر من 50% تمنع نفاذ البضاعة عبر المنافذ الجمركية الإماراتية، يُشكّل **«امتناعاً تعسفياً ضمنياً مقنّعاً عن التعامل والتسليم»**، إذ لا عبرة بالتسليم المادي إذا جُرّد عمداً من مقومات صلاحيته للتصدير.

2. **بموجب قانون المعاملات المدنية الصادر بالمرسوم السلطاني رقم 29 لسنة 2013 (المادة 381 والمادتان 155 و156):**
   تُلزم المادة (381) البائع بتسليم المبيع **وملحقاته الضرورية للاستعمال المقصود**. وفي عقود التصدير، تُعد الشهادات المخبرية والبيطرية المطابقة للبطاقة التعريفية جزءاً لا يتجزأ من الالتزام بالتسليم، وامتناع المصنع عن تصحيح الخطأ المطبعي بحجة التكلفة يُعد إخلالاً جسيماً بمبدأ حسن النية (المادتان 155 و156).`,

  'اشرح بالتفصيل واقعة التناقض المستندي بين شهادة التحليل المخبري (COA) والبطاقة التعريفية ودس وثيقة علف البياض (Layer 16%).': `تتمثل واقعة **التناقض المستندي وهندسة الفخ الجمركي** في إصدار شركة المطاحن العمانية لوثائق رسمية متضاربة وغير مطابقة للشحنة التصديرية:

1. **شهادة التحليل المخبري (COA) المؤرخة 23 يونيو 2026م مقابل الملصق:**
   تثبت الشهادة المخبرية خلو العلف تماماً من مضادات الكوكسيديا بنسبة صفرية (0%)، بينما تُدرج البطاقة المطبوعة على الأكياس خضوع المنتج لبرنامج تدوير مضادات الكوكسيديا **(Anticoccidial Rotation Program)**.
2. **دس وثيقة علف بياض (Layer 16%) لعقد أعلاف تسمين (Broiler):**
   عمد المصنع إلى إرسال إقرار سلامة يخص علف الدجاج البياض (Layer 16%) المغاير تماماً لأعلاف التسمين المتعاقد عليها (Broiler Starter & Finisher)، مع تزويد المستثمر بمستندات ناقصة بأكثر من 50% حتى بعد توجيهات الرئيس التنفيذي.

**الأثر الإجرائي القاطع:**
أدى هذا التضارب الصارخ إلى الرفض والإغلاق الآلي لطلب تسجيل المنتج في النظام الرقمي لوزارة التغير المناخي والبيئة بدولة الإمارات (MOCCAE)، وتهديد المستثمر الوطني بشبهة التلاعب الجمركي.`,

  'ما هي الأضرار التشغيلية والتعاقدية الناتجة عن الإبطاء المتعمد وتأخير أذونات التحميل لشحنات الـ 16 تريلا على مسار الصادرات غير النفطية ورؤية عُمان 2040؟': `في ظل التزام شركة بن كليلة العامري للتجارة والاستثمار **بالسداد النقدي المسبق بنسبة 100% بانتظام**، فإن الإبطاء المتعمد وتشتيت الملف بين خمسة مكاتب ألحق أضراراً جوهرية بمسار الصادرات غير النفطية تتمثل في:

1. **تعطيل حركة الشحن اللوجستي الوطني:** تعطيل جدول شحن نقل بري قوامه **16 تريلا لكل دورة تشغيلية (40 يوماً)** مسدد التكاليف بالكامل للعبور نحو العميل النهائي (مزرعة بركة الوقن).
2. **تهديد الأمن الحيوي لـ 160,000 طير:** وضع المزرعة أمام خطر نفاد المخزون العلفي نتيجة حجب الوثائق الإلزامية، واستخفاف مسؤولي المبيعات في المكالمة الثلاثية بالصفقة التصديرية الوطنية بوصفها «صفقة قليلة».
3. **عرقلة مستهدفات التنويع الاقتصادي ورؤية عُمان 2040:** إظهار الصادرات غير النفطية العُمانية بمظهر غير مطابق للاشتراطات الفنية والتنظيمية الخليجية بسبب تعنت إداري يرفض تسليم وثائق مطابقة.`,

  'ما هي تفاصيل خنق خط التصدير لدفع العميل نحو الوسيط (نوفل) واعترافات المكالمة الثلاثية باحتجاز الشاحنات 4 أيام؟': `تكشف الوقائع الموثقة والتسجيل الرسمي للمكالمة الثلاثية (30 دقيقة) عن مناورة احتكارية متكاملة الأركان لإفشال المتعامل الوطني ودفع العميل النهائي قسراً نحو الوسيط الخارجي **(المدعو نوفل أطياف جلوبال للتجارة FZC)**:

1. **خنق خط التصدير واستنزاف المخزون العلفي:**
   تعمّد المصنع حجب الشهادات البيطرية والمستندات الإلزامية وتدوير الملف بين خمسة مكاتب لاستنزاف مخزون مزرعة بركة الوقن (160,000 طير) ووضعها تحت ضغط الوقت لإجبارها على التحول نحو قناة الوسيط (نوفل).
2. **احتجاز الشاحنات 4 أيام والتهديد بإرجاع البضاعة من الحدود:**
   ثبت في المكالمة الثلاثية الرسمية استخفاف مسؤولي المصنع بواقعة احتجاز الوسيط للشاحنات المحملة لمدة **4 أيام متواصلة** بعد استلام مقدم النقل النقدي، والتهديد الصريح بإرجاع الشحنة من الحدود إلى المخازن، فضلاً عن المطالبة بعمولة غير تعاقدية بواقع **50 ريالاً عمانياً عن كل شحنة**.`,
};
