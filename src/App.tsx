import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Square,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Scale,
  Send,
  Mic,
  MicOff,
  Upload,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Loader2,
  Pause,
  Play,
  LayoutGrid,
  Award,
  PlusCircle,
  Trash2,
  BellRing,
  Film,
  Image as ImageIcon,
  VolumeX,
  RefreshCw,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  MoveVertical,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Lock,
  Sparkles,
  Sliders,
} from 'lucide-react';
import {
  INITIAL_DOCUMENTS,
  QUICK_QUESTIONS,
  FALLBACK_ANSWERS,
  ELEVENLABS_AUDIO_URLS,
  SECTION3_DIRECT_AUDIO_URL,
  EXECUTIVE_APPEAL_AUDIO_URL,
  CLARIFICATION_QUESTIONS_AUDIO_URL,
  CLARIFICATION_QUESTIONS_FALLBACK_URL,
  APPROVED_AUDIO_RECORDINGS,
  AUDIO_SKIP_INTERVALS,
  CLARIFICATION_QUESTIONS_GROUPS,
  ALL_CLARIFICATION_SENTENCES,
  EXECUTIVE_APPEAL_PILLARS,
  EXECUTIVE_APPEAL_INTRO_SENTENCE,
  ALL_EXECUTIVE_APPEAL_SENTENCES,
  OPENING_PRESENTATION_VIDEO,
  BACKGROUND_SCENE_VIDEOS,
  FIELD_VIDEOS,
  ORIGINAL_10_AUDIO_CHAPTERS,
  SECTION_TIMESTAMPS,
  FLEET_PHOTOS,
  CORPORATE_SEAL_LOGO,
  SYNCED_SCRIPT_SEGMENTS,
  RECORDING_VERBATIM_SECTIONS,
  ADVISOR_PREGENERATED_AUDIO_URLS,
  DocumentItem,
  FieldVideoItem,
  OriginalAudioChapter,
  TopShowcaseItem,
} from './data/dossierData';
import { ManusSpaceView } from './components/ManusSpaceView';
import {
  loadLocalPersistedState,
  fetchServerOrLocalState,
  savePermanentDossierState,
  persistUploadedMediaFile,
  loadBlobUrlFromIndexedDB,
} from './utils/persistentStorage';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ToastNotification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  text: 'مرحباً بكم أصحاب المعالي والسعادة، والفاضل خالد المسروري المحترم (مدير عام مركز حماية المنافسة ومنع الاحتكار)، والمختصين الكرام في المستشار الرقابي التفاعلي للملف المعنون: «تحديات التنويع الاقتصادي: عوائق أمام الصادرات غير النفطية في مسار رؤية عُمان 2040» والخاص بشركة بن كليلة العامري للتجارة والاستثمار ضد شركة المطاحن العمانية. يسعدني تقديم الإجابات القانونية والردود الموثقة استناداً للمراسيم السلطانية (67/2014 و29/2013). تفضلوا بطرح استفساركم أو النقر على الأسئلة السريعة أعلاه.',
  timestamp: 'الآن',
};

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const FALLBACK_SAFE_VIDEO_URLS = BACKGROUND_SCENE_VIDEOS.map((b) => b.url);

/**
 * Viewport-aware, stutter-free video player with automatic fallback recovery.
 * Pauses off-screen videos so hardware decoders are never overloaded, and recovers automatically if a URL fails.
 */
function SmoothVideo({
  src,
  style,
  className,
  fallbackIndex = 0,
}: {
  src: string;
  style?: React.CSSProperties;
  className?: string;
  fallbackIndex?: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeSrc, setActiveSrc] = useState<string>(src);
  const fallbackAttemptRef = useRef<number>(0);

  useEffect(() => {
    setActiveSrc(src);
    fallbackAttemptRef.current = 0;
  }, [src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [activeSrc]);

  return (
    <video
      ref={videoRef}
      src={activeSrc}
      muted
      loop
      playsInline
      preload="metadata"
      onError={() => {
        if (fallbackAttemptRef.current < FALLBACK_SAFE_VIDEO_URLS.length) {
          const nextFallback =
            FALLBACK_SAFE_VIDEO_URLS[
              (fallbackIndex + fallbackAttemptRef.current) % FALLBACK_SAFE_VIDEO_URLS.length
            ];
          fallbackAttemptRef.current += 1;
          if (nextFallback && nextFallback !== activeSrc) {
            setActiveSrc(nextFallback);
          }
        }
      }}
      style={style}
      className={className}
    />
  );
}

export default function App() {
  // Password SALALAH2026 strictly active on launch
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'royal' | 'manus'>('royal');

  // Hide studio video-replacement and screen-sizing control panels for clean publication while keeping all customized videos intact
  const [showStudioControls] = useState<boolean>(false);

  // Light, transparent Royal Purple glass opacity (0.42 default) so interactive background videos are clearly visible
  const [glassTheme] = useState<'hero' | 'cream'>('hero');
  const [glassAlpha, setGlassAlpha] = useState<number>(0.42);

  // Smart Audio Transition Alert ("تنبيه صوتي ذكي") setting — enabled by default, strictly non-overlapping with main audio
  const [smartAudioTransition, setSmartAudioTransition] = useState<boolean>(true);
  const isTransitionCuePlayingRef = useRef<boolean>(false);

  // Studio Picker Modal state so clicking "تغيير" always opens an interactive visual switcher + uploader AND cycles immediately
  const [studioPickerTarget, setStudioPickerTarget] = useState<{
    type: 'field-video' | 'showcase-slot' | 'bg-video' | 'opening-video' | 'document-item';
    id?: string;
    slotIdx?: number;
    title?: string;
  } | null>(null);

  // Toast Alert Notification State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (
    type: ToastNotification['type'],
    title: string,
    message: string,
    durationMs = 6500
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [{ id, type, title, message }, ...prev.slice(0, 3)]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Unified Seamless Studio Session HTMLAudioElement state
  const [audioUrlIndex, setAudioUrlIndex] = useState(0);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  const [isFullPresentationPlaying, setIsFullPresentationPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(516.78);

  // Gradual Text & Page Auto-Scroll state — enabled when voice plays so text & screen sync with speaker
  const [isGradualAutoScroll, setIsGradualAutoScroll] = useState<boolean>(true);
  const [gradualScrollSpeed, setGradualScrollSpeed] = useState<number>(0.85);
  const [silentTeleprompterTime, setSilentTeleprompterTime] = useState<number>(0);
  const lastSyncedSectionRef = useRef<string | null>(null);

  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const section3AudioRef = useRef<HTMLAudioElement | null>(null);
  const executiveAppealAudioRef = useRef<HTMLAudioElement | null>(null);
  const clarificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const advisorAudioRef = useRef<HTMLAudioElement | null>(null);
  const segmentEndRef = useRef<number | null>(null);
  const execAppealEndRef = useRef<number | null>(null);
  const clarificationEndRef = useRef<number | null>(null);
  const chainChaptersRef = useRef<boolean>(false);
  const lastAnnouncedSectionRef = useRef<string | null>(null);
  const lastExecSentenceIdRef = useRef<string | null>(null);
  const lastClarificationSentenceIdRef = useRef<string | null>(null);

  // Approved Recording Switcher state (Dropdown + Tabs for the 3 deduplicated recordings)
  const [selectedApprovedRecordingId, setSelectedApprovedRecordingId] = useState<string>('clarification-questions');

  // Clarification Questions Recording (07:26) state
  const [clarificationAudioSrc, setClarificationAudioSrc] = useState<string>(CLARIFICATION_QUESTIONS_AUDIO_URL);
  const [isClarificationPlaying, setIsClarificationPlaying] = useState<boolean>(false);
  const [clarificationTime, setClarificationTime] = useState<number>(0);
  const [clarificationDuration, setClarificationDuration] = useState<number>(418.0);

  // Executive Summary & Final Appeal Recording (03:46) state + Companion Visual Frame sizing state
  const [isExecAppealPlaying, setIsExecAppealPlaying] = useState<boolean>(false);
  const [execAppealTime, setExecAppealTime] = useState<number>(0);
  const [execAppealDuration, setExecAppealDuration] = useState<number>(226.5);
  const [execVisualIdx, setExecVisualIdx] = useState<number>(0);
  const [execScale, setExecScale] = useState<number>(100);
  const [execHeightMode, setExecHeightMode] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [execWidthMode, setExecWidthMode] = useState<'normal' | 'wide' | 'full'>('full');
  const [execFitMode, setExecFitMode] = useState<'cover' | 'contain'>('contain');
  const [execPosY, setExecPosY] = useState<number>(50);

  // Track which foreground conversation evidence video is currently playing with sound
  const [playingEvidenceId, setPlayingEvidenceId] = useState<string | null>(null);
  const evidenceVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Load any previously saved customizations, ensuring the 7 Conversation Evidence Videos ("دلائل المحادثات") are always present in order
  const initialPersistedRef = useRef(loadLocalPersistedState());

  const [fieldVideos, setFieldVideos] = useState<FieldVideoItem[]>(() => {
    const savedVids = initialPersistedRef.current?.fieldVideos;
    if (
      Array.isArray(savedVids) &&
      savedVids.length === FIELD_VIDEOS.length &&
      savedVids[0]?.id === 'conv-evidence-1' &&
      savedVids[0]?.url === FIELD_VIDEOS[0].url
    ) {
      return savedVids.map((v, idx) => {
        const canonical = FIELD_VIDEOS[idx];
        if (canonical && v.id === canonical.id && !v.url.startsWith('blob:') && !v.url.startsWith('/user_uploads/')) {
          return canonical;
        }
        return v;
      });
    }
    return FIELD_VIDEOS;
  });

  // Interactive Section-Based + Multi-Scene Background state
  const [bgVideoUrl, setBgVideoUrl] = useState<string>(
    () => BACKGROUND_SCENE_VIDEOS[0].url
  );
  const [autoCycleBgScenes, setAutoCycleBgScenes] = useState<boolean>(true);
  const [bgSceneIndex, setBgSceneIndex] = useState<number>(0);
  const [activeVisibleSectionId, setActiveVisibleSectionId] = useState<string>('hero-section');

  // Fullscreen Opening Video (Auto-launches filling 100% of the screen for 30s on start, then returns to normal)
  const [activeModalVideo, setActiveModalVideo] = useState<FieldVideoItem | null>(
    () => OPENING_PRESENTATION_VIDEO
  );
  const [isModalFullscreen, setIsModalFullscreen] = useState<boolean>(true);
  const [modalZoomScale, setModalZoomScale] = useState<number>(100);
  const [modalFitMode, setModalFitMode] = useState<'contain' | 'cover'>('cover');
  const [openingCountdown, setOpeningCountdown] = useState<number>(30);
  const [isOpeningAutoMuted, setIsOpeningAutoMuted] = useState<boolean>(false);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isOpeningVideoPlayingHero, setIsOpeningVideoPlayingHero] = useState<boolean>(false);
  const [heroVideoScale, setHeroVideoScale] = useState<number>(100);
  const [heroVideoHeight, setHeroVideoHeight] = useState<'sm' | 'md' | 'lg' | 'full' | 'xl'>('md');
  const openingHeroVideoRef = useRef<HTMLVideoElement | null>(null);

  // Studio Replacement / Addition Refs for Videos, Background, Fleet Photos, and Evidence Cards
  const replaceVideoInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingVideoId, setReplacingVideoId] = useState<string | null>(null);
  const replacingVideoIdRef = useRef<string | null>(null);
  const addStudioVideoInputRef = useRef<HTMLInputElement | null>(null);
  const changeBgStudioInputRef = useRef<HTMLInputElement | null>(null);
  const replaceOpeningStudioInputRef = useRef<HTMLInputElement | null>(null);

  // Top 6 Showcase Slots (Photos)
  const [fleetPhotos, setFleetPhotos] = useState<TopShowcaseItem[]>(() => FLEET_PHOTOS);
  const [selectedFleetIdx, setSelectedFleetIdx] = useState(0);
  const [isShowcaseExpanded, setIsShowcaseExpanded] = useState(false);
  const [isDraggingShowcase, setIsDraggingShowcase] = useState(false);
  const dragStartRef = useRef<{ clientY: number; clientX: number; startPosY: number; startPosX: number } | null>(null);
  const [showLogoLightbox, setShowLogoLightbox] = useState(false);
  const replaceFleetPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Documents, PDF, Videos & Presentations Library state
  const [documents, setDocuments] = useState<DocumentItem[]>(
    () =>
      initialPersistedRef.current?.documents &&
      initialPersistedRef.current.documents.length > 0
        ? initialPersistedRef.current.documents
        : INITIAL_DOCUMENTS
  );
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [customPdfTitle, setCustomPdfTitle] = useState('');
  const [customPdfBadge, setCustomPdfBadge] = useState('دليل ومرفق رسمي معتمد');
  const [customPdfDesc, setCustomPdfDesc] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceDocInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const userModifiedMediaRef = useRef<boolean>(false);
  const isHydratingStateRef = useRef<boolean>(true);

  // Sync from server / IndexedDB on mount without overwriting the 7 Conversation Evidence Videos
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await fetchServerOrLocalState();
      if (!active || userModifiedMediaRef.current) {
        isHydratingStateRef.current = false;
        return;
      }
      if (saved) {
        if (
          Array.isArray(saved.fieldVideos) &&
          saved.fieldVideos.length === FIELD_VIDEOS.length &&
          saved.fieldVideos[0]?.id === 'conv-evidence-1'
        ) {
          const hydratedVideos = await Promise.all(
            saved.fieldVideos.map(async (v, idx) => {
              if (v.url.startsWith('blob:')) {
                const restored = await loadBlobUrlFromIndexedDB(`media_vid_${v.id}`);
                if (restored) return { ...v, url: restored };
              }
              const canonical = FIELD_VIDEOS[idx];
              if (canonical && v.id === canonical.id && !v.url.startsWith('blob:') && !v.url.startsWith('/user_uploads/')) {
                return canonical;
              }
              return v;
            })
          );
          if (active && !userModifiedMediaRef.current) setFieldVideos(hydratedVideos);
        }
        if (Array.isArray(saved.documents) && saved.documents.length > 0) {
          const hydratedDocs = await Promise.all(
            saved.documents.map(async (doc) => {
              if (doc.fileUrl && doc.fileUrl.startsWith('blob:')) {
                const restored = await loadBlobUrlFromIndexedDB(`media_doc_${doc.id}`);
                if (restored) return { ...doc, fileUrl: restored };
              }
              return doc;
            })
          );
          if (active && !userModifiedMediaRef.current) setDocuments(hydratedDocs);
        }
      }
      isHydratingStateRef.current = false;
    })();
    return () => {
      active = false;
    };
  }, []);

  // Automatically save state permanently
  useEffect(() => {
    if (isHydratingStateRef.current && !userModifiedMediaRef.current) return;
    savePermanentDossierState({
      fieldVideos,
      bgVideoUrl,
      fleetPhotos,
      documents,
    });
  }, [fieldVideos, bgVideoUrl, fleetPhotos, documents]);

  // All background video URLs (exclusively from BACKGROUND_SCENE_VIDEOS — never the foreground Conversation Evidence videos)
  const allBgVideoUrls = React.useMemo(() => {
    return BACKGROUND_SCENE_VIDEOS.map((b) => b.url);
  }, []);

  // Observe which section of the presentation is currently in view and switch background scene accordingly ("وعلى حسب الأقسام")
  useEffect(() => {
    if (!isAuthenticated || typeof IntersectionObserver === 'undefined') return;

    const sectionIds = [
      'hero-section',
      'section-clarification-questions',
      'paradigm-section',
      'section-executive-appeal',
      'section-01',
      'section-02',
      'section-03',
      'section-04',
      'section-05',
      'section-06',
      'section-conversation-evidence',
      'section-documents',
      'section-advisor',
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActiveVisibleSectionId(entry.target.id);
            const matchedIdx = BACKGROUND_SCENE_VIDEOS.findIndex(
              (s) => s.sectionKey === entry.target.id
            );
            if (matchedIdx !== -1) {
              setBgSceneIndex(matchedIdx);
              setBgVideoUrl(BACKGROUND_SCENE_VIDEOS[matchedIdx].url);
            }
          }
        });
      },
      { threshold: 0.25, rootMargin: '-10% 0px -25% 0px' }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isAuthenticated, viewMode]);

  // Also cycle background scenes interactively every 6 seconds while browsing ("واجعل الخلفية تفاعلية كل مرة مشهد وعلى حسب الأقسام")
  useEffect(() => {
    if (!autoCycleBgScenes || allBgVideoUrls.length <= 1) return;
    const interval = window.setInterval(() => {
      setBgSceneIndex((prev) => (prev + 1) % allBgVideoUrls.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [autoCycleBgScenes, allBgVideoUrls.length]);

  const activeBackgroundScene =
    BACKGROUND_SCENE_VIDEOS[bgSceneIndex % BACKGROUND_SCENE_VIDEOS.length] ||
    BACKGROUND_SCENE_VIDEOS[0];

  const activeBackgroundVideoUrl = autoCycleBgScenes
    ? activeBackgroundScene.url
    : bgVideoUrl;

  // 30-second countdown for the Fullscreen Opening Video, then auto-return to main screen & start synced presentation
  useEffect(() => {
    if (!activeModalVideo || activeModalVideo.id !== OPENING_PRESENTATION_VIDEO.id || !isAuthenticated) return;
    setOpeningCountdown(30);
    const timer = window.setInterval(() => {
      setOpeningCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setActiveModalVideo(null);
          setIsGradualAutoScroll(true);
          window.setTimeout(() => {
            playClarificationQuestions(0, null, 'clarification-full', true);
          }, 250);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeModalVideo?.id, isAuthenticated]);

  const effectiveSyncTime =
    isFullPresentationPlaying || activeAudioId ? currentTime : silentTeleprompterTime;

  const activeClarificationSentence =
    ALL_CLARIFICATION_SENTENCES.find(
      (s) => s.text.trim().length > 0 && clarificationTime >= s.start && clarificationTime < s.end
    ) || ALL_CLARIFICATION_SENTENCES[0];

  const activeClarificationGroup =
    CLARIFICATION_QUESTIONS_GROUPS.find(
      (g) => clarificationTime >= g.start && clarificationTime < g.end
    ) || CLARIFICATION_QUESTIONS_GROUPS[0];

  const activeExecSentence =
    ALL_EXECUTIVE_APPEAL_SENTENCES.find(
      (s) => s.text.trim().length > 0 && execAppealTime >= s.start && execAppealTime < s.end
    ) || EXECUTIVE_APPEAL_INTRO_SENTENCE;

  const activeExecPillar =
    EXECUTIVE_APPEAL_PILLARS.find(
      (p) => execAppealTime >= p.start && execAppealTime < p.end
    ) || EXECUTIVE_APPEAL_PILLARS[0];

  const activeSyncedSegment =
    SYNCED_SCRIPT_SEGMENTS.find(
      (seg) => effectiveSyncTime >= seg.start && effectiveSyncTime <= seg.end
    ) || SYNCED_SCRIPT_SEGMENTS[0];

  const activeScriptSegment = isClarificationPlaying
    ? {
        id: activeClarificationSentence.id,
        sectionId: 'section-clarification-questions',
        start: activeClarificationSentence.start,
        end: activeClarificationSentence.end,
        title: activeClarificationGroup.title,
        text: activeClarificationSentence.text,
      }
    : isExecAppealPlaying
    ? {
        id: activeExecSentence.id,
        sectionId: 'section-executive-appeal',
        start: activeExecSentence.start,
        end: activeExecSentence.end,
        title: activeExecPillar.title,
        text: activeExecSentence.text,
      }
    : activeSyncedSegment;

  // Synchronize Screen Scroll with Voice Audio & Live Writing when Auto-Scroll is enabled
  useEffect(() => {
    if (!isAuthenticated || activeModalVideo || selectedDoc || studioPickerTarget) return;
    if (!isGradualAutoScroll) return;

    const isAudioRunning = Boolean(isFullPresentationPlaying || activeAudioId);

    // When voice audio is playing and moves into a new section, smoothly align the screen to that section
    if (isAudioRunning && activeScriptSegment?.sectionId) {
      if (lastSyncedSectionRef.current !== activeScriptSegment.sectionId) {
        lastSyncedSectionRef.current = activeScriptSegment.sectionId;
        const targetEl = document.getElementById(activeScriptSegment.sectionId);
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          const absoluteTop = window.scrollY + rect.top - 95;
          // Only jump-align if the section is not already comfortably in view
          if (Math.abs(window.scrollY - absoluteTop) > 380) {
            window.scrollTo({ top: Math.max(0, absoluteTop), behavior: 'smooth' });
          }
        }
      }
    }
  }, [
    isAuthenticated,
    activeModalVideo,
    selectedDoc,
    studioPickerTarget,
    isGradualAutoScroll,
    isFullPresentationPlaying,
    activeAudioId,
    activeScriptSegment?.sectionId,
  ]);

  // Continuous Gradual Auto-Scroll & Teleprompter Progression (Strictly stops when user turns off isGradualAutoScroll!)
  useEffect(() => {
    if (!isAuthenticated || activeModalVideo || selectedDoc || studioPickerTarget) return;
    if (!isGradualAutoScroll) return;

    const isAudioRunning = Boolean(isFullPresentationPlaying || activeAudioId);

    const interval = window.setInterval(() => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY < maxScroll - 10) {
        window.scrollBy({ top: gradualScrollSpeed, behavior: 'auto' });
      }
      // If audio is paused/stopped, still advance the teleprompter text gradually when auto-scroll is active
      if (!isAudioRunning) {
        setSilentTeleprompterTime((prev) => (prev + 0.12 >= 516.78 ? 0 : prev + 0.12));
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [
    isAuthenticated,
    activeModalVideo,
    selectedDoc,
    studioPickerTarget,
    isFullPresentationPlaying,
    activeAudioId,
    isGradualAutoScroll,
    gradualScrollSpeed,
  ]);

  // Smart Legal Advisor Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const currentAudioSrc = ELEVENLABS_AUDIO_URLS[audioUrlIndex];

  const pauseAllEvidenceVideos = (exceptId?: string) => {
    Object.entries(evidenceVideoRefs.current).forEach(([vidId, el]) => {
      if (el && vidId !== exceptId && !el.paused) {
        el.pause();
      }
    });
    if (!exceptId) {
      setPlayingEvidenceId(null);
    }
  };

  const fadeTimerRef = useRef<number | null>(null);

  const smoothFadeInAudio = (audioEl: HTMLAudioElement) => {
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    try {
      audioEl.volume = 0.2;
      let vol = 0.2;
      fadeTimerRef.current = window.setInterval(() => {
        vol = Math.min(1, vol + 0.16);
        audioEl.volume = vol;
        if (vol >= 1 && fadeTimerRef.current) {
          window.clearInterval(fadeTimerRef.current);
          fadeTimerRef.current = null;
        }
      }, 55);
    } catch {
      // Ignore if volume is read-only on mobile OS
    }
  };

  const stopAllAudio = () => {
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    chainChaptersRef.current = false;
    segmentEndRef.current = null;
    execAppealEndRef.current = null;
    clarificationEndRef.current = null;
    isTransitionCuePlayingRef.current = false;
    lastAnnouncedSectionRef.current = null;
    setIsFullPresentationPlaying(false);
    setIsExecAppealPlaying(false);
    setIsClarificationPlaying(false);
    setActiveAudioId(null);
    setActiveChapterIndex(null);
    setIsLoadingAudio(null);

    if (mainAudioRef.current) {
      mainAudioRef.current.pause();
    }
    if (section3AudioRef.current) {
      section3AudioRef.current.pause();
      section3AudioRef.current.currentTime = 0;
    }
    if (executiveAppealAudioRef.current) {
      executiveAppealAudioRef.current.pause();
    }
    if (clarificationAudioRef.current) {
      clarificationAudioRef.current.pause();
    }
    if (advisorAudioRef.current) {
      advisorAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Play the dedicated 12 Clarification Questions Recording (07:26) right after the Title and Introduction
  const playClarificationQuestions = async (
    startSec = 0,
    endSec: number | null = null,
    targetId = 'clarification-full',
    scrollToSection = false
  ) => {
    const clarAudio = clarificationAudioRef.current;
    if (!clarAudio) return;

    if (
      isClarificationPlaying &&
      activeAudioId === targetId &&
      endSec === clarificationEndRef.current
    ) {
      stopAllAudio();
      return;
    }

    pauseAllEvidenceVideos();
    if (mainAudioRef.current && !mainAudioRef.current.paused) {
      mainAudioRef.current.pause();
    }
    if (section3AudioRef.current && !section3AudioRef.current.paused) {
      section3AudioRef.current.pause();
    }
    if (executiveAppealAudioRef.current && !executiveAppealAudioRef.current.paused) {
      executiveAppealAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    chainChaptersRef.current = false;
    segmentEndRef.current = null;
    execAppealEndRef.current = null;
    isTransitionCuePlayingRef.current = false;
    setIsFullPresentationPlaying(false);
    setIsExecAppealPlaying(false);
    setActiveChapterIndex(null);

    clarificationEndRef.current = endSec;
    setSelectedApprovedRecordingId('clarification-questions');
    setActiveAudioId(targetId);
    setIsClarificationPlaying(true);
    setIsGradualAutoScroll(true);

    if (scrollToSection) {
      const secEl = document.getElementById('section-clarification-questions');
      if (secEl) {
        secEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    try {
      clarAudio.currentTime = startSec;
      setClarificationTime(startSec);
      smoothFadeInAudio(clarAudio);
      await clarAudio.play();
    } catch {
      if (clarificationAudioSrc !== CLARIFICATION_QUESTIONS_FALLBACK_URL) {
        setClarificationAudioSrc(CLARIFICATION_QUESTIONS_FALLBACK_URL);
      } else {
        showToast(
          'warning',
          'تنبيه المشغل الصوتي',
          'يرجى النقر مرة أخرى لتفعيل تشغيل التسجيل الصوتي في المتصفح.'
        );
      }
    }
  };

  const handleClarificationTimeUpdate = () => {
    const clarAudio = clarificationAudioRef.current;
    if (!clarAudio || isTransitionCuePlayingRef.current) return;
    let t = clarAudio.currentTime;

    // Programmatic Auto-Skip for duplicate takes (06:58–07:25) & filler intervals
    const skipList = AUDIO_SKIP_INTERVALS['clarification-questions'] || [];
    for (const interval of skipList) {
      if (t >= interval.start && t < interval.end - 0.05) {
        if (interval.end >= 418.0) {
          // End of the official 12 questions memo (2. مذكرة الأسئلة الاستيضاحية) -> smoothly chain to 3. الوقائع والتدخل الأجنبي (section3)
          clarAudio.pause();
          clarificationEndRef.current = null;
          setIsClarificationPlaying(false);
          setActiveAudioId(null);
          triggerSmartSlideTransitionAlert('section4', () => {
            const sec3Range = SECTION_TIMESTAMPS.section3;
            if (sec3Range) {
              playElevenLabsSegment('section3', sec3Range.start, sec3Range.end, null, false);
            }
          });
          return;
        }
        clarAudio.currentTime = interval.end;
        t = interval.end;
        break;
      }
    }

    setClarificationTime(t);

    if (clarificationEndRef.current !== null && t >= clarificationEndRef.current - 0.08) {
      const currentGroup = CLARIFICATION_QUESTIONS_GROUPS.find(
        (g) => Math.abs(g.end - (clarificationEndRef.current || 0)) < 1.5
      );
      const currentIdx = currentGroup
        ? CLARIFICATION_QUESTIONS_GROUPS.findIndex((g) => g.id === currentGroup.id)
        : -1;
      const nextGroup =
        currentIdx !== -1 && currentIdx + 1 < CLARIFICATION_QUESTIONS_GROUPS.length
          ? CLARIFICATION_QUESTIONS_GROUPS[currentIdx + 1]
          : null;

      clarAudio.pause();
      clarificationEndRef.current = null;

      if (nextGroup) {
        window.setTimeout(() => {
          playClarificationQuestions(nextGroup.start, nextGroup.end, nextGroup.id, false);
        }, 350);
      } else {
        setIsClarificationPlaying(false);
        setActiveAudioId(null);
      }
      return;
    }

    // Downward synchronized scroll with the active spoken question/sentence
    const currentSentence = ALL_CLARIFICATION_SENTENCES.find(
      (s) => s.text.trim().length > 0 && t >= s.start && t < s.end
    );
    if (
      currentSentence &&
      lastClarificationSentenceIdRef.current !== currentSentence.id
    ) {
      lastClarificationSentenceIdRef.current = currentSentence.id;
      if (isGradualAutoScroll) {
        const sentEl = document.getElementById(`clar-sentence-${currentSentence.id}`);
        if (sentEl) {
          sentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Play the dedicated Executive Summary & Final Appeal Recording (03:46) with verbatim sentence synchronization
  const playExecutiveAppeal = async (
    startSec = 0,
    endSec: number | null = null,
    targetId = 'exec-appeal-full',
    scrollToSection = false
  ) => {
    const execAudio = executiveAppealAudioRef.current;
    if (!execAudio) return;

    // Toggle pause if clicking the exact same active button
    if (isExecAppealPlaying && activeAudioId === targetId && endSec === execAppealEndRef.current) {
      stopAllAudio();
      return;
    }

    // Stop all other audio and video sources to guarantee zero overlap
    pauseAllEvidenceVideos();
    if (mainAudioRef.current && !mainAudioRef.current.paused) {
      mainAudioRef.current.pause();
    }
    if (section3AudioRef.current && !section3AudioRef.current.paused) {
      section3AudioRef.current.pause();
    }
    if (clarificationAudioRef.current && !clarificationAudioRef.current.paused) {
      clarificationAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    chainChaptersRef.current = false;
    segmentEndRef.current = null;
    clarificationEndRef.current = null;
    isTransitionCuePlayingRef.current = false;
    setIsFullPresentationPlaying(false);
    setIsClarificationPlaying(false);
    setActiveChapterIndex(null);

    execAppealEndRef.current = endSec;
    setSelectedApprovedRecordingId('executive-appeal');
    setActiveAudioId(targetId);
    setIsExecAppealPlaying(true);
    setIsGradualAutoScroll(true);

    const execBgIdx = BACKGROUND_SCENE_VIDEOS.findIndex(
      (s) => s.sectionKey === 'section-executive-appeal'
    );
    if (execBgIdx !== -1) {
      setBgSceneIndex(execBgIdx);
      setBgVideoUrl(BACKGROUND_SCENE_VIDEOS[execBgIdx].url);
    }

    if (scrollToSection) {
      const secEl = document.getElementById('section-executive-appeal');
      if (secEl) {
        secEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    try {
      execAudio.currentTime = startSec;
      setExecAppealTime(startSec);
      smoothFadeInAudio(execAudio);
      await execAudio.play();
    } catch {
      showToast(
        'warning',
        'تنبيه المشغل الصوتي',
        'يرجى النقر مرة أخرى لتفعيل تشغيل التسجيل الصوتي في المتصفح.'
      );
    }
  };

  const lastActiveVerbatimParaRef = useRef<string | null>(null);

  const handleExecAppealTimeUpdate = () => {
    const execAudio = executiveAppealAudioRef.current;
    if (!execAudio || isTransitionCuePlayingRef.current) return;
    let t = execAudio.currentTime;

    // Programmatic Auto-Skip for overlapping/redacted or filler intervals in Executive Appeal
    const skipList = AUDIO_SKIP_INTERVALS['executive-appeal'] || [];
    for (const interval of skipList) {
      if (t >= interval.start && t < interval.end - 0.05) {
        execAudio.currentTime = interval.end;
        t = interval.end;
        break;
      }
    }

    setExecAppealTime(t);

    // Check if playing a specific pillar segment and reached its end timestamp:
    // Automatically chain to the next pillar one after another without overlap!
    if (execAppealEndRef.current !== null && t >= execAppealEndRef.current - 0.08) {
      const currentPillar = EXECUTIVE_APPEAL_PILLARS.find(
        (p) => Math.abs(p.end - (execAppealEndRef.current || 0)) < 1.5
      );
      const nextPillar = currentPillar?.nextPillarId
        ? EXECUTIVE_APPEAL_PILLARS.find((p) => p.id === currentPillar.nextPillarId)
        : null;

      execAudio.pause();
      execAppealEndRef.current = null;

      if (nextPillar) {
        if (smartAudioTransition) {
          showToast(
            'info',
            'انتقال تلقائي متسلسل للمحور التالي',
            `اكتمل المحور الحالي. يبدأ الآن تلقائياً: «${nextPillar.title}».`,
            3800
          );
        }
        window.setTimeout(() => {
          playExecutiveAppeal(nextPillar.start, nextPillar.end, nextPillar.id, false);
        }, 450);
      } else {
        setIsExecAppealPlaying(false);
        setActiveAudioId(null);
      }
      return;
    }

    // Smoothly auto-scroll to keep the active spoken sentence in view when auto-scroll is active
    const currentSentence = ALL_EXECUTIVE_APPEAL_SENTENCES.find(
      (s) => s.text.trim().length > 0 && t >= s.start && t < s.end
    );
    if (currentSentence && lastExecSentenceIdRef.current !== currentSentence.id) {
      lastExecSentenceIdRef.current = currentSentence.id;
      if (isGradualAutoScroll) {
        const sentEl = document.getElementById(`exec-sentence-${currentSentence.id}`);
        if (sentEl) {
          sentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Smart Audio Transition Alert ("تنبيه صوتي ذكي"):
  // Strictly guarantees ZERO overlap with main audio by pausing all main audio elements first,
  // playing a soft two-note harmonic chime + brief spoken transition cue for the next section,
  // and only invoking onComplete after the transition cue finishes.
  const triggerSmartSlideTransitionAlert = (
    completedKey: string,
    onComplete?: () => void
  ) => {
    // 1. Ensure main audio is completely paused so there is zero overlap
    if (mainAudioRef.current && !mainAudioRef.current.paused) {
      mainAudioRef.current.pause();
    }
    if (section3AudioRef.current && !section3AudioRef.current.paused) {
      section3AudioRef.current.pause();
    }
    if (executiveAppealAudioRef.current && !executiveAppealAudioRef.current.paused) {
      executiveAppealAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const sectionMeta = SECTION_TIMESTAMPS[completedKey];
    const nextSectionDomId =
      sectionMeta?.nextSectionKey === 'section1'
        ? 'section-01'
        : sectionMeta?.nextSectionKey === 'section4'
        ? 'section-clarification-questions'
        : sectionMeta?.nextSectionKey === 'section3'
        ? 'section-03'
        : sectionMeta?.nextSectionKey === 'section2'
        ? 'section-02'
        : sectionMeta?.nextSectionKey === 'section5'
        ? 'section-05'
        : sectionMeta?.nextSectionKey === 'section6'
        ? 'section-executive-appeal'
        : completedKey === 'section6'
        ? 'section-executive-appeal'
        : null;

    if (nextSectionDomId && isGradualAutoScroll) {
      const nextEl = document.getElementById(nextSectionDomId);
      if (nextEl) {
        nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (!smartAudioTransition) {
      if (onComplete) onComplete();
      return;
    }

    const nextLabel =
      sectionMeta?.nextLabel ||
      (completedKey === 'section6'
        ? 'الخلاصة التنفيذية والنداء الختامي لإرساء العدالة التنافسية'
        : 'المحور التالي من الملف الرقابي');

    isTransitionCuePlayingRef.current = true;

    showToast(
      'info',
      'تنبيه صوتي ذكي — انتقال تلقائي متسلسل للمحور التالي',
      `اكتمل المقطع الصوتي الحالي. الانتقال التلقائي إلى: «${nextLabel}» دون أي تداخل صوتي.`,
      4000
    );

    // Play a calm, dignified harmonic chime via Web Audio API
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(528, now);
        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.34);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, now + 0.18);
        gain2.gain.setValueAtTime(0.0001, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.09, now + 0.22);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.68);

        window.setTimeout(() => {
          ctx.close().catch(() => {});
        }, 800);
      }
    } catch {
      // Ignore AudioContext errors
    }

    // After chime finishes (700ms), speak brief non-overlapping transition cue if speechSynthesis is available
    window.setTimeout(() => {
      if ('speechSynthesis' in window) {
        try {
          const cueUtterance = new SpeechSynthesisUtterance(
            `ننتقل الآن إلى ${nextLabel}`
          );
          cueUtterance.lang = 'ar-SA';
          cueUtterance.rate = 1.0;
          let finished = false;
          const finishTransition = () => {
            if (finished) return;
            finished = true;
            isTransitionCuePlayingRef.current = false;
            if (onComplete) onComplete();
          };
          cueUtterance.onend = finishTransition;
          cueUtterance.onerror = finishTransition;
          window.speechSynthesis.speak(cueUtterance);
          // Safety timeout in case browser speechSynthesis hangs
          window.setTimeout(finishTransition, 3200);
          return;
        } catch {
          // Fall through
        }
      }
      isTransitionCuePlayingRef.current = false;
      if (onComplete) onComplete();
    }, 700);
  };

  // Play from the unified studio-mastered audio file seamlessly
  const playElevenLabsSegment = async (
    id: string,
    startSec: number,
    endSec: number | null,
    chapterIdx: number | null = null,
    chainAll = false
  ) => {
    if (activeAudioId === id && !chainAll) {
      stopAllAudio();
      return;
    }

    pauseAllEvidenceVideos();
    isTransitionCuePlayingRef.current = false;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (section3AudioRef.current) {
      section3AudioRef.current.pause();
    }
    if (executiveAppealAudioRef.current) {
      executiveAppealAudioRef.current.pause();
      setIsExecAppealPlaying(false);
    }
    if (clarificationAudioRef.current) {
      clarificationAudioRef.current.pause();
      setIsClarificationPlaying(false);
    }

    const audio = mainAudioRef.current;
    if (!audio) return;

    chainChaptersRef.current = chainAll;
    segmentEndRef.current = endSec;
    lastAnnouncedSectionRef.current = id;
    setSelectedApprovedRecordingId('main-dossier');
    setActiveAudioId(id);
    setActiveChapterIndex(chapterIdx);
    setIsFullPresentationPlaying(chainAll);
    setIsGradualAutoScroll(true);

    const domSecId =
      id === 'hero'
        ? 'hero-section'
        : id === 'section1'
        ? 'section-01'
        : id === 'section2'
        ? 'section-02'
        : id === 'section3'
        ? 'section-03'
        : id === 'section4'
        ? 'section-clarification-questions'
        : id === 'section5'
        ? 'section-05'
        : id === 'section6'
        ? 'section-executive-appeal'
        : null;
    if (domSecId) {
      const matchedBgIdx = BACKGROUND_SCENE_VIDEOS.findIndex((s) => s.sectionKey === domSecId);
      if (matchedBgIdx !== -1) {
        setBgSceneIndex(matchedBgIdx);
        setBgVideoUrl(BACKGROUND_SCENE_VIDEOS[matchedBgIdx].url);
      }
    }

    try {
      audio.currentTime = startSec;
      setCurrentTime(startSec);
      smoothFadeInAudio(audio);
      await audio.play();
    } catch {
      if (audioUrlIndex < ELEVENLABS_AUDIO_URLS.length - 1) {
        setAudioUrlIndex((prev) => prev + 1);
      } else {
        showToast(
          'warning',
          'تنبيه المشغل الصوتي',
          'تعذر تشغيل المسار الصوتي تلقائياً، يرجى النقر مرة أخرى لتفعيل الصوت في المتصفح.'
        );
      }
    }
  };

  const handlePlayChapter = (
    chapter: OriginalAudioChapter,
    index: number,
    chain = false
  ) => {
    playElevenLabsSegment(
      `chapter-${index}`,
      chapter.start,
      chain ? null : chapter.end,
      index,
      chain
    );
  };

  const handleAudioTimeUpdate = () => {
    const audio = mainAudioRef.current;
    if (!audio || isTransitionCuePlayingRef.current) return;
    let t = audio.currentTime;

    // Programmatic Auto-Skip for overlapping sentences or filler hesitations in Main Dossier
    const skipList = AUDIO_SKIP_INTERVALS['main-dossier'] || [];
    for (const interval of skipList) {
      if (t >= interval.start && t < interval.end - 0.05) {
        audio.currentTime = interval.end;
        t = interval.end;
        break;
      }
    }

    setCurrentTime(t);

    // When a section/chapter playback reaches its end timestamp:
    // Pause main audio immediately, play the Smart Audio Transition Alert with zero overlap,
    // and then AUTOMATICALLY chain to the next section in the 1 -> 2 -> 3 -> 4 -> 5 -> 6 order!
    if (
      !chainChaptersRef.current &&
      segmentEndRef.current !== null &&
      t >= segmentEndRef.current - 0.08
    ) {
      const finishedId = activeAudioId || 'hero';
      audio.pause();
      segmentEndRef.current = null;
      setActiveAudioId(null);
      setActiveChapterIndex(null);
      setIsFullPresentationPlaying(false);

      const nextSecKey = SECTION_TIMESTAMPS[finishedId]?.nextSectionKey;
      triggerSmartSlideTransitionAlert(finishedId, () => {
        if (nextSecKey === 'section4') {
          playClarificationQuestions(0, null, 'clarification-full', true);
        } else if (nextSecKey === 'section6') {
          playExecutiveAppeal(0, null, 'exec-appeal-full', true);
        } else if (nextSecKey && SECTION_TIMESTAMPS[nextSecKey]) {
          const nextRange = SECTION_TIMESTAMPS[nextSecKey];
          playElevenLabsSegment(nextSecKey, nextRange.start, nextRange.end, null, false);
        }
      });
      return;
    }

    const foundIdx = ORIGINAL_10_AUDIO_CHAPTERS.findIndex(
      (ch) => t >= ch.start && t < ch.end
    );
    if (foundIdx !== -1 && foundIdx !== activeChapterIndex) {
      setActiveChapterIndex(foundIdx);
    }

    // Determine active section key for verbatim paragraph auto-scroll & continuous mode
    let currentSecKey = activeAudioId || 'hero';
    if (chainChaptersRef.current && viewMode === 'royal') {
      if (t < 36.8) currentSecKey = 'hero';
      else if (t < 92.5) currentSecKey = 'section5';
      else if (t < 143.5) currentSecKey = 'section1';
      else if (t < 292.8) currentSecKey = 'section3';
      else if (t < 408.5) currentSecKey = 'section2';
      else if (t < 454.2) currentSecKey = 'section4';
      else currentSecKey = 'section6';

      if (currentSecKey !== activeAudioId) {
        const previousKey = activeAudioId || 'hero';
        setActiveAudioId(currentSecKey);
        const domId =
          currentSecKey === 'hero'
            ? 'hero-section'
            : `section-0${currentSecKey.replace('section', '')}`;
        const matchedBgIdx = BACKGROUND_SCENE_VIDEOS.findIndex((s) => s.sectionKey === domId);
        if (matchedBgIdx !== -1) {
          setBgSceneIndex(matchedBgIdx);
          setBgVideoUrl(BACKGROUND_SCENE_VIDEOS[matchedBgIdx].url);
        }

        if (
          smartAudioTransition &&
          lastAnnouncedSectionRef.current !== currentSecKey
        ) {
          lastAnnouncedSectionRef.current = currentSecKey;
          const resumeTime = audio.currentTime;
          audio.pause();
          triggerSmartSlideTransitionAlert(previousKey, () => {
            if (chainChaptersRef.current && mainAudioRef.current) {
              mainAudioRef.current.currentTime = resumeTime;
              mainAudioRef.current.play().catch(() => {});
            }
          });
          return;
        }
      }
    }

    // Smoothly auto-scroll to the active verbatim paragraph as the speaker progresses through the section
    if (isGradualAutoScroll && RECORDING_VERBATIM_SECTIONS[currentSecKey]) {
      const range = SECTION_TIMESTAMPS[currentSecKey];
      const paragraphs = RECORDING_VERBATIM_SECTIONS[currentSecKey].paragraphs;
      if (range && paragraphs.length > 0 && t >= range.start && t <= range.end) {
        const totalChars = Math.max(
          1,
          paragraphs.reduce((sum, p) => sum + p.length, 0)
        );
        const sectionDuration = Math.max(1, range.end - range.start);
        let accumulatedChars = 0;
        let activeParaIndex = 0;
        for (let i = 0; i < paragraphs.length; i++) {
          const pStart = range.start + (accumulatedChars / totalChars) * sectionDuration;
          accumulatedChars += paragraphs[i].length;
          const pEnd = range.start + (accumulatedChars / totalChars) * sectionDuration;
          if (t >= pStart && t <= pEnd) {
            activeParaIndex = i;
            break;
          }
        }
        const paraDomId = `verbatim-para-${currentSecKey}-${activeParaIndex}`;
        if (lastActiveVerbatimParaRef.current !== paraDomId) {
          lastActiveVerbatimParaRef.current = paraDomId;
          const paraEl = document.getElementById(paraDomId);
          if (paraEl) {
            paraEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }
  };

  // Play dynamic text (AI Advisor responses) with instant studio MP3 playback + /api/tts + speechSynthesis fallback
  const playDynamicTextAudio = async (id: string, text: string, lookupKey?: string) => {
    if (activeAudioId === id) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    pauseAllEvidenceVideos();
    setActiveAudioId(id);

    // 1. Check if we have a pre-generated studio MP3 for instant (0.05s) playback on mobile & desktop
    const pregenUrl =
      (lookupKey && ADVISOR_PREGENERATED_AUDIO_URLS[lookupKey.trim()]) ||
      ADVISOR_PREGENERATED_AUDIO_URLS[id] ||
      ADVISOR_PREGENERATED_AUDIO_URLS[text.trim()];

    if (pregenUrl && advisorAudioRef.current) {
      setIsLoadingAudio(null);
      try {
        const audioEl = advisorAudioRef.current;
        audioEl.src = pregenUrl;
        audioEl.currentTime = 0;
        audioEl.muted = false;
        await audioEl.play();
        return;
      } catch {
        // Fall through to /api/tts or speechSynthesis if needed
      }
    }

    setIsLoadingAudio(id);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`TTS HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.audioBase64) {
        setIsLoadingAudio(null);
        const dataUri = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        if (advisorAudioRef.current) {
          advisorAudioRef.current.src = dataUri;
          advisorAudioRef.current.currentTime = 0;
          advisorAudioRef.current.muted = false;
          await advisorAudioRef.current.play();
        } else {
          const ttsAudio = new Audio(dataUri);
          ttsAudio.onended = () => setActiveAudioId(null);
          await ttsAudio.play();
        }
        return;
      } else {
        throw new Error('Empty TTS audio data');
      }
    } catch {
      setIsLoadingAudio(null);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.95;
        utterance.onend = () => setActiveAudioId(null);
        utterance.onerror = () => setActiveAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setActiveAudioId(null);
      }
    }
  };

  // Start the sequential 6-section presentation (1. المقدمة -> 2. الأسئلة 06:58 -> 3. الوقائع -> 4. الفخ المستندي -> 5. التأصيل -> 6. الخلاصة 03:46)
  const startFullInteractivePresentation = () => {
    if (isFullPresentationPlaying || activeAudioId === 'hero') {
      stopAllAudio();
      return;
    }
    playElevenLabsSegment('hero', 0, SECTION_TIMESTAMPS.hero.end, 0, false);
  };

  const scrollToSections = () => {
    const el = document.getElementById('section-01');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Soft harmonic chime upon successful PDF upload, strictly suppressed if studio audio is playing
  const playSoftUploadChime = (): boolean => {
    const isStudioSessionActive = Boolean(
      isFullPresentationPlaying ||
        activeAudioId !== null ||
        (mainAudioRef.current && !mainAudioRef.current.paused) ||
        ('speechSynthesis' in window && window.speechSynthesis.speaking)
    );

    // Guarantee zero overlap or interference with an ongoing studio audio session
    if (isStudioSessionActive) {
      return false;
    }

    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // First soft note (D5 - 587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.065, now + 0.025);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      // Second soft harmonic note (A5 - 880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.11);
      gain2.gain.setValueAtTime(0.0001, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.075, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.11);
      osc2.stop(now + 0.46);

      window.setTimeout(() => {
        ctx.close().catch(() => {});
      }, 600);

      return true;
    } catch {
      return false;
    }
  };

  // Open multi-format file upload: accept PDF, MP4/Video, Images, and Presentations directly as official evidence
  const processUploadedFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const addedDocs: { doc: DocumentItem; file: File; isPdf: boolean }[] = [];

    Array.from(fileList).forEach((file) => {
      const lowerName = file.name.toLowerCase();
      const mime = file.type.toLowerCase();

      const isPdf = mime === 'application/pdf' || lowerName.endsWith('.pdf');
      const isVideo =
        mime.startsWith('video/') ||
        lowerName.endsWith('.mp4') ||
        lowerName.endsWith('.webm') ||
        lowerName.endsWith('.mov');
      const isImage =
        mime.startsWith('image/') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png') ||
        lowerName.endsWith('.webp');
      const isPresentation =
        lowerName.endsWith('.pptx') ||
        lowerName.endsWith('.ppt') ||
        lowerName.endsWith('.doc') ||
        lowerName.endsWith('.docx') ||
        mime.includes('presentation') ||
        mime.includes('powerpoint') ||
        mime.includes('word');

      if (!isPdf && !isVideo && !isImage && !isPresentation) {
        showToast(
          'error',
          'صيغة ملف غير مدعومة',
          `الملف «${file.name}» غير مدعوم. يقبل النظام ملفات PDF، الفيديوهات (MP4/WebM/MOV)، الصور، والعروض التقديمية.`
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
        showToast(
          'error',
          'تجاوز الحجم المعياري للمستند',
          `حجم الملف «${file.name}» (${fileSizeMb} ميجابايت) يتجاوز الحد الأقصى المسموح به (${MAX_FILE_SIZE_MB} ميجابايت).`
        );
        return;
      }

      const fileUrl = URL.createObjectURL(file);
      const cleanName =
        customPdfTitle.trim() || file.name.replace(/\.[a-z0-9]+$/i, '');
      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          : `${(file.size / 1024).toFixed(1)} KB`;

      const mediaType: DocumentItem['mediaType'] = isVideo
        ? 'video'
        : isImage
        ? 'image'
        : isPdf
        ? 'pdf'
        : 'presentation';

      const defaultBadge = isVideo
        ? 'دليل مرئي وميداني (MP4)'
        : isImage
        ? 'صورة إثبات ومرفق رسمي'
        : isPdf
        ? 'مستند PDF رسمي معتمد'
        : 'عرض تقديمي ومرفق رسمي';

      const newDoc: DocumentItem = {
        id: `doc-uploaded-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        badge: customPdfBadge !== 'دليل ومرفق رسمي معتمد' ? customPdfBadge : defaultBadge,
        badgeColor: isVideo ? 'gold' : isImage ? 'emerald' : 'purple',
        title: cleanName,
        mediaType,
        mimeType: file.type || undefined,
        description:
          customPdfDesc.trim() ||
          (isVideo
            ? `تسجيل مرئي (فيديو MP4 - ${formattedSize}) مدرج كدليل ومرفق رسمي ضمن سجل الوقائع والعمليات الميدانية لشركة بن كليلة العامري للتجارة والاستثمار.`
            : isImage
            ? `صورة توثيقية (${formattedSize}) مدرجة كدليل ومرفق رسمي ضمن سجل الوقائع والمطابقة المستندية.`
            : `مستند رسمي وعرض مقبول ومعالج مباشرة في النظام (${formattedSize}) دون اشتراط تحويله إلى تسجيل صوتي — متاح للاستعراض والبحث التحليلي والطباعة.`),
        fileUrl,
        previewUrl: isVideo || isImage ? fileUrl : FALLBACK_SAFE_VIDEO_URLS[0],
        fileSizeFormatted: formattedSize,
        scale: 100,
        heightMode: 'md',
        widthMode: 'normal',
        fitMode: 'cover',
        posY: 50,
        isProcessing: isPdf,
        pages: [
          {
            pageNumber: 1,
            title: cleanName,
            subtitle:
              'دليل ومرفق رسمي مدرج في سجل المتابعة الرقابية | ملف المراجع: الفاضل خالد المسروري',
            referenceCode: `EVID-${new Date().getFullYear()}`,
            content: [
              `اسم الملف المرفق: ${file.name} (${formattedSize})`,
              isVideo
                ? 'تم إدراج هذا الفيديو القصير كدليل مرئي رسمي قابل للتشغيل المباشر بالصوت والصورة أو تعيينه كخلفية تفاعلية للعرض.'
                : isImage
                ? 'تم إدراج هذه الصورة كدليل ومرفق رسمي داخل العرض التقديمي ومصفوفة الأدلة الرقابية.'
                : 'تم قبول الملف مباشرة في النظام واستخراج وفهرسة محاوره ومحتوياته نصياً ورقابياً دون الحاجة لأي تحويل صوتي.',
            ],
          },
        ],
      };

      addedDocs.push({ doc: newDoc, file, isPdf });
    });

    if (addedDocs.length > 0) {
      userModifiedMediaRef.current = true;
      isHydratingStateRef.current = false;
      const docsOnly = addedDocs.map((item) => item.doc);
      setDocuments((prev) => [...docsOnly, ...prev]);
      setCustomPdfTitle('');
      setCustomPdfDesc('');
      setShowUploadPanel(false);

      const chimePlayed = playSoftUploadChime();
      showToast(
        'success',
        'تم إدراج المرفق والدليل الرسمي بنجاح',
        `تم قبول وإدراج ${
          docsOnly.length === 1 ? `«${docsOnly[0].title}»` : `${docsOnly.length} ملفات ومرفقات`
        } مباشرة في العرض مع خيارات التكبير وتغيير الحجم${
          !chimePlayed ? ' (مع كتم التنبيه الصوتي لعدم مقاطعة الجلسة الجارية).' : '.'
        }`
      );

      // Persist each uploaded file permanently on the server (/user_uploads/...) & IndexedDB
      addedDocs.forEach(({ doc, file }) => {
        persistUploadedMediaFile(file, `doc_${doc.id}`).then(({ permanentUrl }) => {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === doc.id
                ? {
                    ...d,
                    fileUrl: permanentUrl,
                    previewUrl:
                      d.mediaType === 'video' || d.mediaType === 'image'
                        ? permanentUrl
                        : d.previewUrl,
                  }
                : d
            )
          );
          setSelectedDoc((curr) =>
            curr && curr.id === doc.id ? { ...curr, fileUrl: permanentUrl } : curr
          );
        });
      });

      // Directly process and index uploaded PDF files in the system backend
      addedDocs
        .filter((item) => item.isPdf)
        .forEach(({ doc, file }) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const resultStr = typeof reader.result === 'string' ? reader.result : '';
              const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : '';
              const res = await fetch('/api/pdf/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileName: file.name,
                  fileSizeFormatted: doc.fileSizeFormatted,
                  pdfBase64: base64Data,
                }),
              });

              if (res.ok) {
                const processed = await res.json();
                setDocuments((prev) =>
                  prev.map((d) =>
                    d.id === doc.id
                      ? {
                          ...d,
                          isProcessing: false,
                          badge: processed.badge || d.badge,
                          description: processed.summary || d.description,
                          pages:
                            Array.isArray(processed.pages) && processed.pages.length > 0
                              ? processed.pages
                              : d.pages,
                        }
                      : d
                  )
                );
                setSelectedDoc((curr) =>
                  curr && curr.id === doc.id
                    ? {
                        ...curr,
                        isProcessing: false,
                        badge: processed.badge || curr.badge,
                        description: processed.summary || curr.description,
                        pages:
                          Array.isArray(processed.pages) && processed.pages.length > 0
                            ? processed.pages
                            : curr.pages,
                      }
                    : curr
                );
              } else {
                setDocuments((prev) =>
                  prev.map((d) => (d.id === doc.id ? { ...d, isProcessing: false } : d))
                );
              }
            } catch {
              setDocuments((prev) =>
                prev.map((d) => (d.id === doc.id ? { ...d, isProcessing: false } : d))
              );
            }
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processUploadedFiles(e.target.files);
    e.target.value = '';
  };

  const handleRemoveUploadedDoc = (docId: string, docTitle: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null);
    }
    showToast('info', 'تمت إزالة الدليل / المرفق', `تم حذف «${docTitle}» من مكتبة الأدلة والمرفقات.`);
  };

  // Replace a specific Evidence / Document Card directly from Studio/Device
  const handleReplaceDocFromStudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !replacingDocId) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast(
        'error',
        'حجم الملف يتجاوز الحد المسموح',
        `الملف «${file.name}» يتجاوز الحد الأقصى (${MAX_FILE_SIZE_MB} ميجابايت).`
      );
      setReplacingDocId(null);
      return;
    }

    const tempBlobUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const formattedSize =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const lowerName = file.name.toLowerCase();
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(lowerName);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(lowerName);
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');

    const mediaType: DocumentItem['mediaType'] = isVideo
      ? 'video'
      : isImage
      ? 'image'
      : isPdf
      ? 'pdf'
      : 'presentation';

    const targetDocId = replacingDocId || studioPickerTarget?.id;
    if (!targetDocId) return;

    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== targetDocId) return d;
        const updated: DocumentItem = {
          ...d,
          title: cleanName,
          fileUrl: tempBlobUrl,
          previewUrl: isVideo || isImage ? tempBlobUrl : d.previewUrl || FALLBACK_SAFE_VIDEO_URLS[0],
          fileSizeFormatted: formattedSize,
          mediaType,
          mimeType: file.type || undefined,
          badge: isVideo
            ? 'دليل مرئي مستبدل من الاستوديو (MP4)'
            : isImage
            ? 'صورة دليل مستبدلة من الاستوديو'
            : isPdf
            ? 'مستند PDF مستبدل من الاستوديو'
            : 'عرض تقديمي مستبدل من الاستوديو',
          description: `تم استبدال هذا الدليل مباشرة من الاستوديو بالملف «${file.name}» (${formattedSize}) وحفظه بشكل دائم في سجل الأدلة الرسمية.`,
        };
        if (selectedDoc?.id === d.id) {
          setSelectedDoc(updated);
        }
        return updated;
      })
    );

    // Save permanently to server & IndexedDB
    persistUploadedMediaFile(file, `doc_${targetDocId}`).then(({ permanentUrl }) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === targetDocId
            ? {
                ...d,
                fileUrl: permanentUrl,
                previewUrl: isVideo || isImage ? permanentUrl : d.previewUrl,
              }
            : d
        )
      );
      setSelectedDoc((curr) =>
        curr && curr.id === targetDocId ? { ...curr, fileUrl: permanentUrl } : curr
      );
    });

    playSoftUploadChime();
    showToast(
      'success',
      'تم استبدال وحفظ الدليل بشكل دائم',
      `تم تحديث الدليل بالملف الجديد «${cleanName}» وحفظه نهائياً بحيث لا يتغير عند الخروج.`
    );
    setReplacingDocId(null);
    setStudioPickerTarget(null);
  };

  // Pool of all available studio videos and photos for instant cycling & Studio Picker Modal
  const studioMediaCatalog = React.useMemo(() => {
    const items: {
      url: string;
      title: string;
      subtitle: string;
      mediaType: 'video' | 'image';
      durationLabel: string;
    }[] = [];

    const extraStudioVideos: { url: string; title: string; subtitle: string; durationLabel: string }[] = [
      {
        url: '/user_uploads/media_vid_vid-warehouse-capacity.mp4',
        title: 'توثيق ميداني: طاقة الاستيعاب والمخزون الفعلي',
        subtitle: 'فيديو ميداني مُحسّن بدون تقطيع',
        durationLabel: '00:06',
      },
      {
        url: '/user_uploads/media_vid_vid-warehouse-gate.mp4',
        title: 'توثيق ميداني: خروج الشاحنات من بوابة المخازن',
        subtitle: 'فيديو ميداني مُحسّن بدون تقطيع',
        durationLabel: '00:06',
      },
      {
        url: '/user_uploads/media_vid_vid-logistics-hub.mp4',
        title: 'توثيق ميداني: عمليات المناولة والشحن التصديري',
        subtitle: 'فيديو ميداني مُحسّن بدون تقطيع',
        durationLabel: '00:05',
      },
      {
        url: '/user_uploads/media_vid_vid-multi-grid.mp4',
        title: 'توثيق ميداني: جاهزية شاحنات الـ 16 تريلا',
        subtitle: 'فيديو ميداني مُحسّن بدون تقطيع',
        durationLabel: '00:05',
      },
      {
        url: '/assets/aistudio/HnVideoEditor_2025_09_09_152621795_f8064337.mp4',
        title: 'توثيق ميداني: حركة الشاحنات في الساحة اللوجستية',
        subtitle: 'فيديو ميداني معتمد',
        durationLabel: '00:15',
      },
      {
        url: '/assets/aistudio/HnVideoEditor_2025_06_11_171749621_e28a6bd4.mp4',
        title: 'توثيق ميداني: تحميل شحنات أعلاف بركات الوطنية',
        subtitle: 'فيديو ميداني معتمد',
        durationLabel: '00:07',
      },
      {
        url: '/assets/aistudio/HnVideoEditor_2025_06_14_045357615_70101bdb.mp4',
        title: 'توثيق ميداني: انطلاق القاطرات والمقطورات للتصدير',
        subtitle: 'فيديو ميداني معتمد',
        durationLabel: '00:11',
      },
      {
        url: '/assets/aistudio/HnVideoEditor_2025_06_17_044120386_cdb20068.mp4',
        title: 'توثيق ميداني: العمليات اللوجستية في صلالة ومسقط',
        subtitle: 'فيديو ميداني معتمد',
        durationLabel: '00:11',
      },
      {
        url: '/assets/aistudio/HnVideoEditor_2025_06_04_154222028_2314c21f.mp4',
        title: 'توثيق ميداني: تجهيز الشحنات المسبقة الدفع 100%',
        subtitle: 'فيديو ميداني معتمد',
        durationLabel: '00:05',
      },
    ];

    extraStudioVideos.forEach((v) => {
      if (!items.some((x) => x.url === v.url)) {
        items.push({
          url: v.url,
          title: v.title,
          subtitle: v.subtitle,
          mediaType: 'video',
          durationLabel: v.durationLabel,
        });
      }
    });

    FIELD_VIDEOS.forEach((v) => {
      if (!items.some((x) => x.url === v.url)) {
        items.push({
          url: v.url,
          title: v.title,
          subtitle: v.subtitle,
          mediaType: v.mediaType || 'video',
          durationLabel: v.durationLabel || 'فيديو ميداني',
        });
      }
    });

    fieldVideos.forEach((v) => {
      if (!items.some((x) => x.url === v.url) && !v.url.startsWith('blob:')) {
        items.push({
          url: v.url,
          title: v.title,
          subtitle: v.subtitle,
          mediaType: v.mediaType || 'video',
          durationLabel: v.durationLabel || 'فيديو مرفوع',
        });
      }
    });

    FLEET_PHOTOS.forEach((p) => {
      if (!items.some((x) => x.url === p.url)) {
        items.push({
          url: p.url,
          title: p.title,
          subtitle: p.badge || 'صورة ميدانية معتمدة',
          mediaType: p.mediaType || 'image',
          durationLabel: p.mediaType === 'video' ? 'فيديو ميداني' : 'صورة ميدانية',
        });
      }
    });

    fleetPhotos.forEach((p) => {
      if (!items.some((x) => x.url === p.url) && !p.url.startsWith('blob:')) {
        items.push({
          url: p.url,
          title: p.title,
          subtitle: p.badge || 'مرفق ميداني',
          mediaType: p.mediaType || 'image',
          durationLabel: p.mediaType === 'video' ? 'فيديو ميداني' : 'صورة ميدانية',
        });
      }
    });

    return items;
  }, [fieldVideos, fleetPhotos]);

  // Instant 1-Click Cycle for any Document / Evidence Card in Section 5 (same as top sections!)
  const handleInstantCycleDocument = (docId: string, openPickerModal = true) => {
    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    const pool = studioMediaCatalog;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const currentUrl = doc.fileUrl || doc.previewUrl || '';
        const currentIdx = pool.findIndex((p) => p.url === currentUrl);
        const nextItem = pool[(currentIdx + 1) % pool.length] || pool[0];
        if (!nextItem) return doc;

        const updated: DocumentItem = {
          ...doc,
          fileUrl: nextItem.url,
          previewUrl: nextItem.url,
          mediaType: nextItem.mediaType,
          title: nextItem.title,
          badge:
            nextItem.mediaType === 'video'
              ? 'دليل مرئي وميداني (MP4)'
              : 'صورة إثبات ومرفق رسمي',
        };
        if (activeModalVideo?.id === doc.id) {
          setActiveModalVideo({
            id: doc.id,
            url: nextItem.url,
            title: nextItem.title,
            subtitle: doc.description,
            badge: updated.badge,
            durationLabel: nextItem.durationLabel,
            hasAudio: false,
            mediaType: nextItem.mediaType,
          });
        }
        return updated;
      })
    );

    if (openPickerModal) {
      const targetDoc = documents.find((d) => d.id === docId);
      setReplacingDocId(docId);
      setStudioPickerTarget({
        type: 'document-item',
        id: docId,
        title: targetDoc?.title || 'تغيير الفيديو أو المرفق الرسمي',
      });
    } else {
      showToast(
        'success',
        'تم تبديل الفيديو / المرفق فوراً',
        'تم تغيير المشهد في قسم الأدلة والمرفقات وحفظه بشكل دائم.'
      );
    }
  };

  // Adjust scale, heightMode, widthMode, fitMode, or posY of any Evidence / Document card in Section 5
  const updateDocumentSizing = (
    docId: string,
    changes: {
      deltaScale?: number;
      heightMode?: 'sm' | 'md' | 'lg' | 'xl';
      widthMode?: 'normal' | 'wide' | 'full';
      toggleFit?: boolean;
      deltaY?: number;
    }
  ) => {
    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const currentScale = typeof d.scale === 'number' ? d.scale : 100;
        const nextScale = changes.deltaScale
          ? Math.max(60, Math.min(200, currentScale + changes.deltaScale))
          : currentScale;
        const currentY = typeof d.posY === 'number' ? d.posY : 50;
        const nextY = changes.deltaY
          ? Math.max(0, Math.min(100, currentY + changes.deltaY))
          : currentY;
        const nextFit = changes.toggleFit
          ? d.fitMode === 'contain'
            ? 'cover'
            : 'contain'
          : d.fitMode || 'cover';
        return {
          ...d,
          scale: nextScale,
          posY: nextY,
          heightMode: changes.heightMode || d.heightMode || 'md',
          widthMode: changes.widthMode || d.widthMode || 'normal',
          fitMode: nextFit,
        };
      })
    );
  };

  // Instant 1-Click Cycle for any Field Video Card (or Opening Video) so clicking "تغيير" immediately changes the video on screen!
  const handleInstantCycleVideo = (vidId: string, openPickerModal = true) => {
    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    const videoPool = studioMediaCatalog.filter((m) => m.mediaType === 'video');
    const pool = videoPool.length > 0 ? videoPool : studioMediaCatalog;

    setFieldVideos((prev) =>
      prev.map((vid, idx) => {
        if (vid.id !== vidId) return vid;
        const currentIdx = pool.findIndex((p) => p.url === vid.url);
        const nextItem = pool[(currentIdx + 1) % pool.length] || pool[0];
        if (!nextItem) return vid;

        const keepAudio = idx === 0 || Boolean(vid.hasAudio);
        const updatedVid: FieldVideoItem = {
          ...vid,
          url: nextItem.url,
          mediaType: nextItem.mediaType,
          title: idx === 0 ? `العرض التقديمي الافتتاحي: ${nextItem.title}` : nextItem.title,
          subtitle: nextItem.subtitle,
          durationLabel: nextItem.durationLabel,
          hasAudio: keepAudio,
        };
        if (activeModalVideo?.id === vid.id) {
          setActiveModalVideo(updatedVid);
        }
        return updatedVid;
      })
    );

    if (openPickerModal) {
      const targetVid = fieldVideos.find((v) => v.id === vidId);
      replacingVideoIdRef.current = vidId;
      setReplacingVideoId(vidId);
      setStudioPickerTarget({
        type: vidId === fieldVideos[0]?.id ? 'opening-video' : 'field-video',
        id: vidId,
        title: targetVid?.title || 'تغيير الفيديو / الصورة',
      });
    } else {
      showToast(
        'success',
        'تم تبديل الفيديو فوراً',
        'تم تغيير المشهد المرئي وحفظه تلقائياً في الواجهة.'
      );
    }
  };

  // Instant 1-Click Cycle for Top 6 Showcase Slots
  const handleInstantCycleShowcaseSlot = (slotIdx: number, openPickerModal = true) => {
    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    setFleetPhotos((prev) =>
      prev.map((item, idx) => {
        if (idx !== slotIdx) return item;
        const currentIdx = studioMediaCatalog.findIndex((p) => p.url === item.url);
        const nextItem =
          studioMediaCatalog[(currentIdx + 1) % studioMediaCatalog.length] ||
          studioMediaCatalog[0];
        if (!nextItem) return item;
        return {
          ...item,
          url: nextItem.url,
          title: nextItem.title,
          mediaType: nextItem.mediaType,
          badge: nextItem.mediaType === 'video' ? 'فيديو ميداني (جدول 16 تريلا)' : 'جدول 16 تريلا',
        };
      })
    );

    if (openPickerModal) {
      setSelectedFleetIdx(slotIdx);
      setStudioPickerTarget({
        type: 'showcase-slot',
        slotIdx,
        title: `تغيير الخانة العلوية رقم ${slotIdx + 1} (صورة أو فيديو)`,
      });
    } else {
      showToast(
        'success',
        'تم تغيير محتوى الخانة فوراً',
        `تم تبديل محتوى الخانة رقم ${slotIdx + 1} وحفظه بشكل دائم.`
      );
    }
  };

  // Apply a selected video/photo from the visual Studio Picker Modal
  const handleSelectMediaFromStudioPicker = (picked: {
    url: string;
    title: string;
    subtitle: string;
    mediaType: 'video' | 'image';
    durationLabel: string;
  }) => {
    if (!studioPickerTarget) return;
    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    if (
      studioPickerTarget.type === 'field-video' ||
      studioPickerTarget.type === 'opening-video'
    ) {
      const targetId =
        studioPickerTarget.type === 'opening-video'
          ? fieldVideos[0]?.id
          : studioPickerTarget.id || replacingVideoIdRef.current;
      if (!targetId) return;

      setFieldVideos((prev) =>
        prev.map((vid, idx) => {
          if (vid.id !== targetId) return vid;
          const isConvCard = vid.id.startsWith('conv-evidence-');
          const keepAudio =
            picked.mediaType !== 'image' &&
            (studioPickerTarget.type === 'opening-video' || idx === 0 || isConvCard || Boolean(vid.hasAudio));
          const updatedVid: FieldVideoItem = {
            ...vid,
            url: picked.url,
            posterUrl: picked.mediaType === 'image' ? picked.url : undefined,
            mediaType: picked.mediaType,
            title: isConvCard
              ? `دلائل المحادثات (${idx + 1}): ${picked.title}`
              : idx === 0
              ? `العرض التقديمي الافتتاحي المعتمد: ${picked.title}`
              : picked.title,
            subtitle: picked.subtitle,
            durationLabel: picked.durationLabel,
            hasAudio: keepAudio,
          };
          if (activeModalVideo?.id === vid.id) {
            setActiveModalVideo(updatedVid);
          }
          return updatedVid;
        })
      );

      showToast(
        'success',
        'تم تغيير الفيديو وحفظه بشكل دائم',
        `تم اختيار «${picked.title}» وتثبيته في العرض بشكل دائم.`
      );
    } else if (studioPickerTarget.type === 'showcase-slot') {
      const slotIndex =
        typeof studioPickerTarget.slotIdx === 'number'
          ? studioPickerTarget.slotIdx
          : selectedFleetIdx;
      setFleetPhotos((prev) =>
        prev.map((item, idx) =>
          idx === slotIndex
            ? {
                ...item,
                url: picked.url,
                title: picked.title,
                mediaType: picked.mediaType,
                badge:
                  picked.mediaType === 'video'
                    ? 'فيديو ميداني (جدول 16 تريلا)'
                    : 'جدول 16 تريلا',
              }
            : item
        )
      );
      showToast(
        'success',
        'تم تغيير الخانة العلوية وحفظها بشكل دائم',
        `تم تثبيت «${picked.title}» في الخانة رقم ${slotIndex + 1}.`
      );
    } else if (studioPickerTarget.type === 'document-item') {
      const targetDocId = studioPickerTarget.id || replacingDocId;
      if (targetDocId) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === targetDocId
              ? {
                  ...d,
                  fileUrl: picked.url,
                  previewUrl: picked.url,
                  mediaType: picked.mediaType,
                  title: picked.title,
                  badge:
                    picked.mediaType === 'video'
                      ? 'دليل مرئي وميداني (MP4)'
                      : 'صورة إثبات ومرفق رسمي',
                }
              : d
          )
        );
        showToast(
          'success',
          'تم تغيير الفيديو / المرفق في قسم الأدلة',
          `تم تثبيت «${picked.title}» في قسم الأدلة والمرفقات بشكل دائم.`
        );
      }
    } else if (studioPickerTarget.type === 'bg-video') {
      setBgVideoUrl(picked.url);
      setAutoCycleBgScenes(false);
      showToast(
        'success',
        'تم تغيير فيديو الخلفية التفاعلية',
        `تم تعيين «${picked.title}» كخلفية تفاعلية لكامل الشاشة.`
      );
    }

    setStudioPickerTarget(null);
  };

  // Replace a specific Video Card (or Opening 30s Video) directly from Studio/Device (supports Video or Image)
  const handleReplaceVideoFromStudio = (
    e: React.ChangeEvent<HTMLInputElement>,
    forceOpeningAudio = false
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    const targetId = forceOpeningAudio
      ? fieldVideos[0]?.id
      : replacingVideoIdRef.current || replacingVideoId || studioPickerTarget?.id || fieldVideos[0]?.id;
    if (!targetId) return;

    const lowerName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(lowerName);
    const detectedMediaType: 'video' | 'image' = isImage ? 'image' : 'video';

    const tempBlobUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');

    setFieldVideos((prev) =>
      prev.map((vid, idx) => {
        if (vid.id !== targetId) return vid;
        const isConvCard = vid.id.startsWith('conv-evidence-');
        const keepAudio =
          !isImage && (forceOpeningAudio || idx === 0 || isConvCard || Boolean(vid.hasAudio));
        const updatedVid: FieldVideoItem = {
          ...vid,
          url: tempBlobUrl,
          posterUrl: isImage ? tempBlobUrl : undefined,
          mediaType: detectedMediaType,
          title: isConvCard
            ? `دلائل المحادثات (${idx + 1}): ${cleanName}`
            : idx === 0
            ? `العرض التقديمي الافتتاحي المعتمد: ${cleanName}`
            : `توثيق ميداني من الاستوديو: ${cleanName}`,
          subtitle: isImage
            ? 'صورة توثيقية ميدانية من الاستوديو — محفوظة مع الحفاظ على الدليل الأصلي'
            : isConvCard
            ? `دلائل المحادثات الموثقة بالصوت والصورة — دليل رسمي رقم (${idx + 1}) محدث من الاستوديو`
            : keepAudio
            ? 'فيديو العرض التقديمي الافتتاحي (بالصوت الكامل) — محفوظ بشكل دائم من الاستوديو'
            : 'فيديو ميداني صامت (بدون صوت) — محفوظ بشكل دائم من الاستوديو',
          badge: isConvCard
            ? vid.badge || `دلائل المحادثات · الدليل ${idx + 1}`
            : isImage
            ? 'صورة ميدانية معتمدة'
            : keepAudio
            ? 'العرض الافتتاحي (بالصوت الكامل)'
            : 'فيديو ميداني (صامت بدون صوت)',
          durationLabel: isImage
            ? 'صورة توثيقية'
            : isConvCard
            ? 'بالصوت الواضح'
            : keepAudio
            ? 'عرض افتتاحي · بصوت'
            : 'ميداني · صامت',
          hasAudio: keepAudio,
        };
        if (activeModalVideo?.id === vid.id) {
          setActiveModalVideo(updatedVid);
        }
        return updatedVid;
      })
    );

    // Save permanently to server & IndexedDB so it never resets on exit/reload
    persistUploadedMediaFile(file, `vid_${targetId}`).then(({ permanentUrl }) => {
      setFieldVideos((prev) =>
        prev.map((vid) => {
          if (vid.id !== targetId) return vid;
          const updated = { ...vid, url: permanentUrl };
          if (activeModalVideo?.id === vid.id) {
            setActiveModalVideo(updated);
          }
          return updated;
        })
      );
    });

    showToast(
      'success',
      'تم تغيير وحفظ الوسائط بشكل دائم',
      forceOpeningAudio
        ? `تم تحديث وحفظ العرض الافتتاحي «${cleanName}» بشكل دائم ولن يتغير حتى تقوم بتغييره.`
        : `تم استبدال وحفظ «${cleanName}» بشكل دائم ولن يتغير عند الخروج.`
    );
    replacingVideoIdRef.current = null;
    setReplacingVideoId(null);
    setStudioPickerTarget(null);
  };

  // Add a new Silent Field Video or Image directly from Studio/Device
  const handleAddStudioVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    const lowerName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(lowerName);
    const newVidId = `vid-studio-${Date.now()}`;
    const tempBlobUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const newVid: FieldVideoItem = {
      id: newVidId,
      url: tempBlobUrl,
      mediaType: isImage ? 'image' : 'video',
      title: `توثيق ميداني مضاف: ${cleanName}`,
      subtitle: isImage
        ? 'صورة ميدانية مضافة ومحفوظة بشكل دائم من الاستوديو الخاص بكم'
        : 'فيديو ميداني صامت (بدون صوت) مضاف ومحفوظ بشكل دائم من الاستوديو الخاص بكم',
      badge: isImage ? 'صورة ميدانية مضافة' : 'مرفق مرئي (صامت بدون صوت)',
      durationLabel: isImage ? 'صورة ميدانية' : 'ميداني · صامت',
      hasAudio: false,
      scale: 100,
      heightMode: 'md',
      fitMode: 'cover',
      posY: 50,
    };

    setFieldVideos((prev) => [...prev, newVid]);

    persistUploadedMediaFile(file, `vid_${newVidId}`).then(({ permanentUrl }) => {
      setFieldVideos((prev) =>
        prev.map((v) => (v.id === newVidId ? { ...v, url: permanentUrl } : v))
      );
    });

    showToast(
      'success',
      'تمت إضافة وحفظ المرفق الميداني بشكل دائم',
      `تم إدراج وحفظ «${cleanName}» بشكل دائم ولن يُحذف عند الخروج.`
    );
    setStudioPickerTarget(null);
  };

  // Change Background Video directly from Studio/Device
  const handleChangeBgFromStudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    const tempBlobUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setBgVideoUrl(tempBlobUrl);
    setAutoCycleBgScenes(false);

    persistUploadedMediaFile(file, 'bg_video').then(({ permanentUrl }) => {
      setBgVideoUrl(permanentUrl);
    });

    showToast(
      'success',
      'تم تغيير وحفظ فيديو الخلفية بشكل دائم',
      `تم تعيين وحفظ «${cleanName}» كخلفية فيديو متحركة صامتة (Muted) بشكل دائم.`
    );
    setStudioPickerTarget(null);
  };

  // Delete a Video Card from the gallery
  const handleDeleteFieldVideo = (vidId: string, vidTitle: string) => {
    if (fieldVideos.length <= 1) {
      showToast('warning', 'تنبيه', 'يجب الإبقاء على فيديو واحد على الأقل في الواجهة، ويمكنك استبداله من الاستوديو.');
      return;
    }
    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;
    setFieldVideos((prev) => prev.filter((v) => v.id !== vidId));
    if (activeModalVideo?.id === vidId) {
      setActiveModalVideo(null);
    }
    showToast('info', 'تم حذف الفيديو نهائياً', `تمت إزالة «${vidTitle}» وحفظ التعديل بشكل دائم.`);
  };

  // Replace current Top 6 Showcase Slot with ANY Photo OR Video directly from Studio/Device
  const handleReplaceFleetPhotoFromStudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    userModifiedMediaRef.current = true;
    isHydratingStateRef.current = false;

    const lowerName = file.name.toLowerCase();
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(lowerName);
    const slotIndex =
      typeof studioPickerTarget?.slotIdx === 'number'
        ? studioPickerTarget.slotIdx
        : selectedFleetIdx;
    const tempBlobUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');

    setFleetPhotos((prev) =>
      prev.map((item, idx) =>
        idx === slotIndex
          ? {
              ...item,
              url: tempBlobUrl,
              title: cleanName,
              mediaType: isVideo ? 'video' : 'image',
              posY: 50,
              posX: 50,
              scale: 100,
              fitMode: 'cover',
              badge: isVideo ? `فيديو ميداني (${cleanName})` : `صورة ميدانية (${cleanName})`,
            }
          : item
      )
    );

    persistUploadedMediaFile(file, `slot_${slotIndex}`).then(({ permanentUrl }) => {
      setFleetPhotos((prev) =>
        prev.map((item, idx) => (idx === slotIndex ? { ...item, url: permanentUrl } : item))
      );
    });

    showToast(
      'success',
      isVideo ? 'تم إدراج وحفظ الفيديو في الخانة بشكل دائم' : 'تم تحديث وحفظ الصورة في الخانة بشكل دائم',
      `تم وضع وحفظ «${cleanName}» في الخانة رقم ${slotIndex + 1} — ويمكنك تكبيره أو تصغيره أو فتحه بملء الشاشة.`
    );
    setStudioPickerTarget(null);
  };

  // Adjust vertical / horizontal position, zoom scale, or fit mode of the currently selected top showcase item
  const updateCurrentShowcasePosition = (
    deltaY: number,
    exactY?: number,
    toggleFit?: boolean,
    deltaScale = 0
  ) => {
    setFleetPhotos((prev) =>
      prev.map((item, idx) => {
        if (idx !== selectedFleetIdx) return item;
        const currentY = typeof item.posY === 'number' ? item.posY : 50;
        const nextY =
          typeof exactY === 'number'
            ? Math.max(0, Math.min(100, exactY))
            : Math.max(0, Math.min(100, currentY + deltaY));
        const currentScale = typeof item.scale === 'number' ? item.scale : 100;
        const nextScale = Math.max(60, Math.min(200, currentScale + deltaScale));
        const nextFit = toggleFit
          ? item.fitMode === 'contain'
            ? 'cover'
            : 'contain'
          : item.fitMode || 'cover';
        return {
          ...item,
          posY: nextY,
          scale: nextScale,
          fitMode: nextFit,
        };
      })
    );
  };

  // Adjust scale, heightMode, fitMode, or posY of any Field Video card
  const updateFieldVideoSizing = (
    vidId: string,
    changes: {
      deltaScale?: number;
      heightMode?: 'sm' | 'md' | 'lg' | 'xl';
      toggleFit?: boolean;
      deltaY?: number;
    }
  ) => {
    setFieldVideos((prev) =>
      prev.map((v) => {
        if (v.id !== vidId) return v;
        const currentScale = typeof v.scale === 'number' ? v.scale : 100;
        const nextScale = changes.deltaScale
          ? Math.max(60, Math.min(200, currentScale + changes.deltaScale))
          : currentScale;
        const currentY = typeof v.posY === 'number' ? v.posY : 50;
        const nextY = changes.deltaY
          ? Math.max(0, Math.min(100, currentY + changes.deltaY))
          : currentY;
        const nextFit = changes.toggleFit
          ? v.fitMode === 'contain'
            ? 'cover'
            : 'contain'
          : v.fitMode || 'cover';
        return {
          ...v,
          scale: nextScale,
          posY: nextY,
          heightMode: changes.heightMode || v.heightMode || 'md',
          fitMode: nextFit,
        };
      })
    );
  };

  const askAdvisor = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isAdvisorLoading) return;

    const assistantMsgId = `assistant-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');

    // If this question matches one of the 4 Quick Questions (or has a pre-generated studio MP3),
    // respond and start speaking the studio voice response IMMEDIATELY within the user's click gesture!
    const pregenAudioUrl = ADVISOR_PREGENERATED_AUDIO_URLS[trimmed];
    if (pregenAudioUrl && FALLBACK_ANSWERS[trimmed]) {
      const instantReply = FALLBACK_ANSWERS[trimmed];
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          text: instantReply,
          timestamp: new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      playDynamicTextAudio(`chat-${assistantMsgId}`, instantReply, trimmed);
      return;
    }

    // Unlock advisorAudioRef on user tap so mobile browsers allow playback when async reply arrives
    if (advisorAudioRef.current) {
      advisorAudioRef.current.muted = false;
    }

    setIsAdvisorLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const uploadedDocsContext = documents
        .filter((d) => Boolean(d.fileUrl))
        .map(
          (d) =>
            `مستند PDF مرفوع ومعالج في النظام: «${d.title}» (${d.badge}) — الملخص: ${d.description} — المحاور المستخرجة: ${d.pages
              .map((p) => `${p.title}: ${p.content.join(' | ')}`)
              .join(' // ')}`
        )
        .join('\n');

      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
          uploadedDocsContext,
        }),
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply;
      } else {
        replyText =
          FALLBACK_ANSWERS[trimmed] ||
          `بناءً على الوقائع الموثقة في الملف الرقابي لشركة بن كليلة العامري للتجارة والاستثمار (س.ت: 1111061) المرفوع بعناية الفاضل خالد المسروري:\n\n1. الالتزام المالي الكامل: تم سداد 18,640 ريال عماني نقداً ومقدماً بنسبة 100% لتمويل شحنات الـ 16 تريلا لكل دورة تشغيلية (40 يوماً) ضمن صفقة الـ 1,870,000 ر.ع لصالح العميل النهائي (مزرعة بركة الوقن) دعماً للصادرات غير النفطية في مسار رؤية عُمان 2040.\n2. الإخلال المستندي والفني: تسليم شهادة تحليل (COA) بتاريخ 23 يونيو 2026 تثبت خلو المنتج من مضادات الكوكسيديا، في تناقض صارخ مع البطاقة التعريفية المطبوعة على الكيس، مما أدى لإغلاق الطلب رقم (APH-12052026-3382929) في نظام MOCCAE الإماراتي.\n3. التدخل الخارجي (نوفل): تعمد عرقلة وحجب الأوراق البيطرية لإحراق الوقت واستنفاد مخزون المزرعة (160 ألف طير) لدفع مسار التصدير قسراً نحو الوسيط الخارجي (نوفل / أطياف جلوبال FZC)، ومحاولة فرض إتاوة 50 ر.ع لكل شحنة مع احتجاز الشاحنات 4 أيام رغم سداد 700 ر.ع مقدم نقل.\n4. التكييف القانوني: يشكّل هذا المسلك امتناعاً تعسفياً ضمنياً مقنعاً عن التسليم بالمخالفة للمادتين (9 و10) من قانون حماية المنافسة ومنع الاحتكار (67/2014) والمادة (381) والمادتين (155 و156) من قانون المعاملات المدنية (29/2013).`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      // Automatically speak the advisor's answer out loud
      playDynamicTextAudio(`chat-${assistantMsgId}`, replyText, trimmed);
    } catch {
      const fallbackReply =
        FALLBACK_ANSWERS[trimmed] ||
        `استناداً إلى سجل الوقائع المرفوع إلى وزارة التجارة والصناعة وترويج الاستثمار (ملف المراجع: الفاضل خالد المسروري)، فإن موقف شركة بن كليلة العامري للتجارة والاستثمار يستند إلى سداد نقدي مسبق بنسبة 100% (18,640 ر.ع) وعدم وجود أي مديونية، في حين ثبت التناقض المستندي بين شهادة (COA) المؤرخة 23 يونيو 2026 والملصق التعريفي، فضلاً عن حجب الأوراق البيطرية لدفع مسار التصدير قسراً نحو الوسيط الخارجي (نوفل / أطياف جلوبال FZC) واحتجاز الشاحنات 4 أيام بعد استلام 700 ر.ع مقدم نقل، وهو ما يخالف صراحة المرسوم السلطاني رقم 67/2014 والمرسوم السلطاني رقم 29/2013.`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      playDynamicTextAudio(`chat-${assistantMsgId}`, fallbackReply, trimmed);
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAdvisorLoading]);

  const toggleMicInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const sampleQ = QUICK_QUESTIONS[0].question;
      askAdvisor(sampleQ);
      return;
    }

    if (isListeningMic && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-OM';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListeningMic(true);
    recognition.onend = () => setIsListeningMic(false);
    recognition.onerror = () => {
      setIsListeningMic(false);
      showToast(
        'warning',
        'تنبيه الميكروفون',
        'تعذر التقاط الصوت من الميكروفون، يرجى التحقق من صلاحية الميكروفون في المتصفح.'
      );
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript && transcript.trim()) {
        setInputQuestion(transcript.trim());
        askAdvisor(transcript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Render clean, calm ministerial text without moving word-by-word highlight boxes
  const renderGradualSyncedWords = (
    text: string,
    _arg1?: number,
    _arg2?: number | boolean,
    _arg3?: number | boolean,
    _arg4?: boolean | string,
    _arg5?: boolean
  ) => {
    return <span>{text}</span>;
  };

  const renderSectionAudioButton = (sectionKey: string, label = 'استماع للشريحة') => {
    const isPlaying = activeAudioId === sectionKey;
    const range = SECTION_TIMESTAMPS[sectionKey] || { start: 0, end: 81 };

    return (
      <button
        type="button"
        onClick={() => playElevenLabsSegment(sectionKey, range.start, range.end, null, false)}
        className={`no-print inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
          isPlaying
            ? 'gold-metallic-card ring-2 ring-[#e7cb82]'
            : 'bg-[#2b124c] hover:bg-[#3c1a69] text-[#e7cb82] border border-[#c9a452]'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-[#e7cb82]" />
        )}
        <span>{isPlaying ? 'جاري الاستماع ومزامنة النص...' : label}</span>
      </button>
    );
  };

  const renderRecordingVerbatimBox = (sectionKey: string) => {
    const item = RECORDING_VERBATIM_SECTIONS[sectionKey];
    if (!item) return null;
    const range = SECTION_TIMESTAMPS[sectionKey] || { start: 0, end: 81 };
    const isSectionSpeaking =
      activeAudioId === sectionKey ||
      (isFullPresentationPlaying && currentTime >= range.start && currentTime < range.end);

    const totalChars = Math.max(
      1,
      item.paragraphs.reduce((sum, p) => sum + p.length, 0)
    );
    const sectionDuration = Math.max(1, range.end - range.start);
    let accumulatedChars = 0;

    const paragraphTimings = item.paragraphs.map((para) => {
      const pStart = range.start + (accumulatedChars / totalChars) * sectionDuration;
      accumulatedChars += para.length;
      const pEnd = range.start + (accumulatedChars / totalChars) * sectionDuration;
      return { para, pStart, pEnd };
    });

    const sectionProgressPct = isSectionSpeaking
      ? Math.min(100, Math.max(2, ((currentTime - range.start) / sectionDuration) * 100))
      : 0;

    return (
      <div
        className={`mt-5 rounded-2xl border-2 p-4 sm:p-5 transition-all ${
          isSectionSpeaking
            ? 'bg-[#240d42] border-[#fff2c6] shadow-2xl ring-2 ring-[#e7cb82]/60'
            : 'bg-[#1c0936] border-[#c9a452]/85'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#c9a452]/35">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="gold-metallic-card text-[10px] font-black px-2.5 py-0.5 rounded-md">
              {item.badge}
              {item.timeRange ? ` (${item.timeRange})` : ''}
            </span>
            <h4 className="text-xs sm:text-sm font-black text-[#f3dfa6]">{item.heading}</h4>
          </div>
          <button
            type="button"
            onClick={() => playElevenLabsSegment(sectionKey, range.start, range.end, null, false)}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2b124c] hover:bg-[#3c1a69] border border-[#e7cb82] text-[#f3dfa6] text-[11px] font-extrabold cursor-pointer shadow-sm"
          >
            {isSectionSpeaking ? (
              <Pause className="w-3 h-3 fill-current text-[#e7cb82]" />
            ) : (
              <Volume2 className="w-3 h-3 text-[#e7cb82]" />
            )}
            <span>
              {isSectionSpeaking
                ? 'يتلو الآن بالتزامن التدريجي مع النص...'
                : 'تشغيل مقطع التسجيل ومزامنة الكتابة'}
            </span>
          </button>
        </div>

        {/* Live Section Voice-to-Text Progress Bar */}
        {isSectionSpeaking && (
          <div className="mt-3 w-full h-1.5 bg-white/15 rounded-full overflow-hidden no-print">
            <div
              className="h-full bg-gradient-to-r from-[#c9a452] via-[#fff2c6] to-[#e7cb82] transition-all duration-200"
              style={{ width: `${sectionProgressPct}%` }}
            />
          </div>
        )}

        <div className="mt-3.5 space-y-2.5">
          {paragraphTimings.map(({ para, pStart, pEnd }, idx) => {
            const isParaSpeaking =
              isSectionSpeaking && currentTime >= pStart && currentTime <= pEnd;
            const isParaPassed = isSectionSpeaking && currentTime > pEnd;
            const paraRatio = isParaSpeaking
              ? (currentTime - pStart) / Math.max(0.5, pEnd - pStart)
              : isParaPassed
              ? 1
              : 0;

            return (
              <div
                key={idx}
                id={`verbatim-para-${sectionKey}-${idx}`}
                onClick={() => playElevenLabsSegment(sectionKey, pStart, range.end, null, false)}
                title="اضغط للاستماع مباشرة من هذه الفقرة مع التزامن التدريجي للكلمات"
                className={`rounded-xl p-3.5 border transition-all cursor-pointer ${
                  isParaSpeaking
                    ? 'bg-[#34155c] border-[#fff2c6] shadow-lg scale-[1.005]'
                    : isParaPassed
                    ? 'bg-[#1f0b38]/90 border-[#c9a452]/50'
                    : 'bg-[#160629]/65 border-[#c9a452]/30 hover:border-[#e7cb82]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#e7cb82]">
                    <Volume2
                      className={`w-3.5 h-3.5 ${
                        isParaSpeaking ? 'text-[#fff2c6]' : 'text-[#e7cb82]'
                      }`}
                    />
                    <span>
                      {isParaSpeaking
                        ? 'يُنطق الآن كلمة بكلمة بالتزامن مع الصوت'
                        : isParaPassed
                        ? 'تمت تلاوة هذه الفقرة'
                        : `الفقرة (${idx + 1}) — اضغط للاستماع المباشر`}
                    </span>
                  </span>
                  {item.timeRange && sectionKey !== 'section5' && sectionKey !== 'section6' && (
                    <span className="font-mono text-[10px] font-bold text-[#f3dfa6] bg-black/35 px-2 py-0.5 rounded tabular-nums">
                      {formatTime(pStart)} – {formatTime(pEnd)}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#f7f2eb] leading-[2.05] font-medium">
                  «
                  {renderGradualSyncedWords(
                    para,
                    paraRatio,
                    isParaSpeaking,
                    isParaPassed,
                    'dark'
                  )}
                  »
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-[#160629] via-[#240e42] to-[#120421] text-white flex items-center justify-center p-4 select-none"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-[#1f0b38]/95 border-2 border-[#c9a452] rounded-3xl p-7 sm:p-9 shadow-2xl text-center relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(231, 203, 130, 0.4), transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-b from-[#fff2c6] via-[#c9a452] to-[#8f6718] shadow-xl">
              <img
                src={CORPORATE_SEAL_LOGO}
                alt="شركة بن كليلة العامري للتجارة والاستثمار"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 gold-metallic-card px-3.5 py-1 rounded-full text-[11px] font-black shadow-md">
              <Lock className="w-3.5 h-3.5 text-[#2b124c]" />
              <span>ملف رقابي سري محمي بكلمة مرور</span>
            </div>

            <h1 className="mt-3 text-lg sm:text-xl font-black text-white leading-snug">
              شركة بن كليلة العامري للتجارة والاستثمار
            </h1>
            <p className="text-xs font-bold text-[#e7cb82] mt-1">
              ملف المراجع: الفاضل خالد المسروري | مركز حماية المنافسة ومنع الاحتكار
            </p>
            <p className="text-[11px] text-[#e8dff5]/85 mt-2 leading-relaxed">
              هذا الملف الرقابي والوثائق المرفقة مخصصة للمختصين وجهات الرقابة المعتمدة فقط. يرجى إدخال الرقم السري للدخول إلى العرض.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordInput.trim().toUpperCase() === 'SALALAH2026') {
                  setIsAuthenticated(true);
                  setPasswordError('');
                } else {
                  setPasswordError('الرقم السري غير صحيح، لا يمكن الدخول إلا للمصرح لهم.');
                }
              }}
              className="mt-6 space-y-3.5 text-right"
            >
              <div>
                <label className="block text-xs font-extrabold text-[#f3dfa6] mb-1.5">
                  الرقم السري للدخول (Password):
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="أدخل الرقم السري هنا..."
                  autoFocus
                  className="w-full bg-[#130624] border-2 border-[#c9a452] rounded-xl px-4 py-3 text-sm font-bold text-white text-center tracking-widest placeholder:tracking-normal placeholder:text-[#a695bd] focus:outline-none focus:ring-2 focus:ring-[#e7cb82]"
                />
              </div>

              {passwordError && (
                <div className="bg-[#2b124c] border border-[#e7cb82] text-[#f3dfa6] text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#e7cb82] shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full gold-metallic-card hover:brightness-105 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#2b124c]" />
                <span>تأكيد الرقم السري والدخول للملف الرقابي</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#c9a452]/30 text-[10px] text-[#e8dff5]/70 font-semibold">
              سلطنة عُمان · رؤية عُمان 2040 · حماية الصادرات العُمانية غير النفطية
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-[#f7f2eb] flex flex-col relative overflow-x-hidden transparent-hero-theme"
      style={{ '--glass-alpha': glassAlpha } as React.CSSProperties}
      dir="rtl"
    >
      {/* FIXED FULL-SCREEN VIDEO BACKGROUND WITH ROTATING FIELD/TRUCK VIDEOS ONE AFTER ANOTHER */}
      <div className="fixed inset-0 z-0 w-screen h-screen overflow-hidden pointer-events-none no-print bg-[#140526]">
        <video
          src={activeBackgroundVideoUrl}
          autoPlay
          loop={!autoCycleBgScenes}
          muted
          playsInline
          preload="auto"
          onEnded={() => {
            if (autoCycleBgScenes && allBgVideoUrls.length > 1) {
              setBgSceneIndex((prev) => (prev + 1) % allBgVideoUrls.length);
            }
          }}
          onError={() => {
            if (allBgVideoUrls.length > 1) {
              setBgSceneIndex((prev) => (prev + 1) % allBgVideoUrls.length);
            }
          }}
          className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
        />
        {allBgVideoUrls.length > 1 && (
          <video
            src={allBgVideoUrls[(bgSceneIndex + 1) % allBgVideoUrls.length]}
            muted
            playsInline
            preload="metadata"
            className="hidden"
          />
        )}
        <div className="absolute inset-0 bg-[#140526]/30" />
      </div>

      {/* Persistent Seamless Studio Audio Element + Dedicated Section 03 + Executive Appeal + Legal Advisor Audio Elements */}
      <audio
        ref={advisorAudioRef}
        preload="auto"
        onEnded={() => setActiveAudioId(null)}
        className="hidden"
      />
      {viewMode === 'royal' && (
        <>
          <audio
            ref={mainAudioRef}
            src={currentAudioSrc}
            preload="auto"
            onTimeUpdate={handleAudioTimeUpdate}
            onLoadedMetadata={(e) => {
              if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
                setDuration(e.currentTarget.duration);
              }
            }}
            onEnded={() => {
              setIsFullPresentationPlaying(false);
              setActiveAudioId(null);
              setActiveChapterIndex(null);
            }}
            onError={() => {
              if (audioUrlIndex < ELEVENLABS_AUDIO_URLS.length - 1) {
                setAudioUrlIndex((prev) => prev + 1);
              } else {
                showToast(
                  'error',
                  'تنبيه الاتصال الصوتي',
                  'تعذر تحميل المسار الصوتي، يرجى التحقق من اتصال الشبكة.'
                );
              }
            }}
            className="hidden"
          />
          <audio
            ref={section3AudioRef}
            src={SECTION3_DIRECT_AUDIO_URL}
            preload="auto"
            onEnded={() => {
              setActiveAudioId(null);
              setActiveChapterIndex(null);
            }}
            className="hidden"
          />
          <audio
            ref={executiveAppealAudioRef}
            src={EXECUTIVE_APPEAL_AUDIO_URL}
            preload="auto"
            onTimeUpdate={handleExecAppealTimeUpdate}
            onLoadedMetadata={(e) => {
              if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
                setExecAppealDuration(e.currentTarget.duration);
              }
            }}
            onEnded={() => {
              setIsExecAppealPlaying(false);
              setActiveAudioId(null);
              execAppealEndRef.current = null;
            }}
            className="hidden"
          />
          <audio
            ref={clarificationAudioRef}
            src={clarificationAudioSrc}
            preload="auto"
            onTimeUpdate={handleClarificationTimeUpdate}
            onLoadedMetadata={(e) => {
              if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
                setClarificationDuration(Math.min(418.0, e.currentTarget.duration));
              }
            }}
            onEnded={() => {
              setIsClarificationPlaying(false);
              setActiveAudioId(null);
              clarificationEndRef.current = null;
              triggerSmartSlideTransitionAlert('section4', () => {
                const sec3Range = SECTION_TIMESTAMPS.section3;
                if (sec3Range) {
                  playElevenLabsSegment('section3', sec3Range.start, sec3Range.end, null, false);
                }
              });
            }}
            onError={() => {
              if (clarificationAudioSrc !== CLARIFICATION_QUESTIONS_FALLBACK_URL) {
                setClarificationAudioSrc(CLARIFICATION_QUESTIONS_FALLBACK_URL);
              }
            }}
            className="hidden"
          />
        </>
      )}

      {/* Hidden Studio File Inputs for Direct Video, Photo, Background, Fleet Photo & Evidence Replacement */}
      <input
        id="studio-replace-opening-input"
        ref={replaceOpeningStudioInputRef}
        type="file"
        accept="video/*,image/*,.mp4,.mov,.webm,.jpg,.jpeg,.png,.webp"
        onChange={(e) => handleReplaceVideoFromStudio(e, true)}
        className="hidden"
      />
      <input
        id="studio-replace-video-input"
        ref={replaceVideoInputRef}
        type="file"
        accept="video/*,image/*,.mp4,.mov,.webm,.jpg,.jpeg,.png,.webp"
        onChange={(e) => handleReplaceVideoFromStudio(e, false)}
        className="hidden"
      />
      <input
        id="studio-add-video-input"
        ref={addStudioVideoInputRef}
        type="file"
        accept="video/*,image/*,.mp4,.mov,.webm,.jpg,.jpeg,.png,.webp"
        onChange={handleAddStudioVideo}
        className="hidden"
      />
      <input
        id="studio-change-bg-input"
        ref={changeBgStudioInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.webm"
        onChange={handleChangeBgFromStudio}
        className="hidden"
      />
      <input
        id="studio-replace-slot-input"
        ref={replaceFleetPhotoInputRef}
        type="file"
        accept="image/*,video/*,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
        onChange={handleReplaceFleetPhotoFromStudio}
        className="hidden"
      />
      <input
        id="studio-replace-doc-input"
        ref={replaceDocInputRef}
        type="file"
        accept=".pdf,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.pptx,.ppt,.doc,.docx,application/pdf,video/*,image/*"
        onChange={handleReplaceDocFromStudio}
        className="hidden"
      />

      {/* INTERACTIVE STUDIO VIDEO & PHOTO SWITCHER + DEVICE UPLOADER MODAL */}
      {studioPickerTarget && (
        <div
          className="fixed inset-0 z-[60] bg-[#0e031c]/85 backdrop-blur-md flex items-center justify-center p-4 no-print"
          onClick={() => setStudioPickerTarget(null)}
        >
          <div
            className="bg-[#1b0933] border-2 border-[#e7cb82] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#2b124c] via-[#3a1866] to-[#2b124c] px-5 py-4 border-b border-[#c9a452] flex items-center justify-between gap-3">
              <div>
                <span className="gold-metallic-card text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  لوحة تغيير واستبدال الفيديوهات والصور الفورية
                </span>
                <h3 className="font-black text-sm sm:text-base text-[#f3dfa6] mt-1">
                  {studioPickerTarget.title || 'اختر فيديو أو صورة جاهزة بضغطة واحدة أو ارفع ملفاً من جهازك'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStudioPickerTarget(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Option 1: Direct File Upload from Device / Studio using native <label> */}
              <div className="bg-[#281047] border-2 border-dashed border-[#e7cb82] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#f3dfa6]">
                    الخيار 1: رفع فيديو أو صورة جديدة مباشرة من جهازك / الاستوديو
                  </h4>
                  <p className="text-[11px] text-[#e8dff5] mt-0.5">
                    يتم حفظ الفيديو أو الصورة التي تختارها بشكل دائم بحيث لا تتغير أبداً عند الخروج أو التحديث
                  </p>
                </div>

                <label
                  htmlFor={
                    studioPickerTarget.type === 'opening-video'
                      ? 'studio-replace-opening-input'
                      : studioPickerTarget.type === 'showcase-slot'
                      ? 'studio-replace-slot-input'
                      : studioPickerTarget.type === 'document-item'
                      ? 'studio-replace-doc-input'
                      : studioPickerTarget.type === 'bg-video'
                      ? 'studio-change-bg-input'
                      : 'studio-replace-video-input'
                  }
                  className="gold-metallic-card px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
                >
                  <Upload className="w-4 h-4 text-[#2b124c]" />
                  <span>اختيار فيديو أو صورة أو ملف من جهازك الآن</span>
                </label>
              </div>

              {/* Option 2: Instant 1-Click Switch from Available Studio Videos & Photos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs sm:text-sm font-black text-[#f3dfa6]">
                    الخيار 2: أو اضغط على أي فيديو / صورة أدناه للتغيير الفوري بضغطة واحدة:
                  </h4>
                  <span className="text-[11px] text-[#e7cb82] font-bold">
                    ({studioMediaCatalog.length} مشاهد متوفرة)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {studioMediaCatalog.map((item, idx) => (
                    <div
                      key={`${item.url}-${idx}`}
                      onClick={() => handleSelectMediaFromStudioPicker(item)}
                      className="group rounded-2xl border-2 border-[#c9a452]/70 hover:border-[#fff2c6] bg-[#140526] overflow-hidden cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
                    >
                      <div className="relative h-32 bg-black overflow-hidden">
                        {item.mediaType === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.url}
                            muted
                            loop
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute top-2 right-2 bg-black/80 text-[#e7cb82] border border-[#c9a452] text-[10px] font-bold px-2 py-0.5 rounded">
                          {item.mediaType === 'image' ? 'صورة ميدانية' : 'فيديو ميداني'}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-black text-[#f3dfa6] line-clamp-1">
                          {item.title}
                        </div>
                        <button
                          type="button"
                          className="mt-2 w-full gold-metallic-card py-1.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>اختيار وتثبيت هذا المشهد</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#140526] px-5 py-3 border-t border-[#c9a452]/50 flex items-center justify-between">
              <span className="text-[11px] text-[#e8dff5]">
                ملاحظة: تم أيضاً تبديل المشهد تلقائياً للمشهد التالي عند ضغطك على زر التغيير
              </span>
              <button
                type="button"
                onClick={() => setStudioPickerTarget(null)}
                className="px-4 py-1.5 rounded-xl bg-[#2b124c] border border-[#c9a452] text-[#f3dfa6] text-xs font-bold cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 100% FULL-SCREEN AUTO-START OPENING VIDEO (30s) & UNIVERSAL FULLSCREEN MEDIA VIEWER */}
      {activeModalVideo && (
        <div
          className={`fixed inset-0 z-50 bg-[#0d031a]/95 backdrop-blur-lg flex flex-col justify-between no-print ${
            isModalFullscreen ? 'p-0' : 'p-4 sm:p-6 items-center justify-center'
          }`}
          onClick={() => setActiveModalVideo(null)}
        >
          <div
            className={`relative flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
              isModalFullscreen
                ? 'w-screen h-screen rounded-none border-0 bg-black'
                : 'bg-[#1a0833]/95 border-2 border-[#c9a452] rounded-3xl max-w-5xl w-full max-h-[92vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Floating Overlay Control Bar */}
            <div className="relative z-20 bg-gradient-to-b from-[#140526]/95 via-[#1f0b38]/85 to-transparent text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#c9a452]/40">
              <div className="flex items-center gap-3">
                <img
                  src={CORPORATE_SEAL_LOGO}
                  alt="شركة بن كليلة العامري"
                  className="w-10 h-10 rounded-full object-cover bg-white p-0.5 border border-[#e7cb82]"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="gold-metallic-card text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {activeModalVideo.id === OPENING_PRESENTATION_VIDEO.id
                        ? `العرض الافتتاحي التلقائي (يعود للواجهة خلال ${openingCountdown} ثانية)`
                        : activeModalVideo.badge}
                    </span>
                    <span className="text-[11px] font-bold text-[#f3dfa6]">
                      شركة بن كليلة العامري للتجارة والاستثمار
                    </span>
                  </div>
                  <h3 className="font-black text-xs sm:text-base mt-0.5 text-white">
                    {activeModalVideo.title}
                  </h3>
                </div>
              </div>

              {/* Fullscreen, Zoom, Fit/Cover, Replace & Close Controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isOpeningAutoMuted && activeModalVideo.hasAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      const vidEl = document.getElementById(
                        'fullscreen-modal-video-player'
                      ) as HTMLVideoElement | null;
                      if (vidEl) {
                        vidEl.muted = false;
                        vidEl.play().catch(() => {});
                      }
                      setIsOpeningAutoMuted(false);
                    }}
                    className="gold-metallic-card px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 animate-pulse cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-[#2b124c]" />
                    <span>تفعيل صوت الفيديو الافتتاحي</span>
                  </button>
                )}

                {showStudioControls && (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalZoomScale((s) => Math.min(200, s + 15))}
                      title="تكبير حجم المشهد (+)"
                      className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-[#c9a452]/60 text-[#f3dfa6] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-[#e7cb82]" />
                      <span>تكبير +</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalZoomScale((s) => Math.max(60, s - 15))}
                      title="تصغير حجم المشهد (-)"
                      className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-[#c9a452]/60 text-[#f3dfa6] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5 text-[#e7cb82]" />
                      <span>تصغير -</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setModalFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-[#c9a452]/60 text-[#f3dfa6] text-[11px] font-bold cursor-pointer"
                    >
                      {modalFitMode === 'cover' ? 'ملء الشاشة الكامل' : 'احتواء كامل الأبعاد'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsModalFullscreen((f) => !f)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-[#c9a452]/60 text-[#f3dfa6] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isModalFullscreen ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5 text-[#e7cb82]" />
                          <span>نافذة وسطية</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-[#e7cb82]" />
                          <span>تكبير للشاشة كاملة</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeModalVideo.id.startsWith('slot-')) {
                          const sIdx = parseInt(activeModalVideo.id.replace('slot-', ''), 10) || 0;
                          handleInstantCycleShowcaseSlot(sIdx, true);
                        } else if (activeModalVideo.id.startsWith('doc-')) {
                          handleInstantCycleDocument(activeModalVideo.id, true);
                        } else {
                          handleInstantCycleVideo(activeModalVideo.id, true);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#e7cb82] text-[#f3dfa6] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#e7cb82]" />
                      <span>تغيير من الاستوديو</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const wasOpening = activeModalVideo.id === OPENING_PRESENTATION_VIDEO.id;
                    setActiveModalVideo(null);
                    if (wasOpening && !isFullPresentationPlaying) {
                      startFullInteractivePresentation();
                    }
                  }}
                  className="gold-metallic-card px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <span>العودة للعرض التقديمي</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Center Fullscreen Media Canvas */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
              {activeModalVideo.mediaType === 'image' ? (
                <img
                  src={activeModalVideo.url}
                  alt={activeModalVideo.title}
                  style={{ transform: `scale(${modalZoomScale / 100})` }}
                  className={`w-full h-full transition-transform duration-200 ${
                    modalFitMode === 'cover' ? 'object-cover' : 'object-contain'
                  }`}
                />
              ) : (
                <video
                  id="fullscreen-modal-video-player"
                  key={activeModalVideo.url}
                  src={activeModalVideo.url}
                  controls
                  autoPlay
                  preload="auto"
                  muted={!activeModalVideo.hasAudio || isOpeningAutoMuted}
                  playsInline
                  onTimeUpdate={(e) => {
                    if (
                      activeModalVideo.id === OPENING_PRESENTATION_VIDEO.id &&
                      e.currentTarget.currentTime >= 30
                    ) {
                      setActiveModalVideo(null);
                      startFullInteractivePresentation();
                    }
                  }}
                  onEnded={() => {
                    const wasOpening = activeModalVideo.id === OPENING_PRESENTATION_VIDEO.id;
                    setActiveModalVideo(null);
                    if (wasOpening) {
                      startFullInteractivePresentation();
                    }
                  }}
                  style={{ transform: `scale(${modalZoomScale / 100})` }}
                  className={`w-full h-full transition-transform duration-200 ${
                    modalFitMode === 'cover' ? 'object-cover' : 'object-contain'
                  }`}
                />
              )}
            </div>

            {/* Bottom Floating Status Bar */}
            <div className="relative z-20 bg-gradient-to-t from-[#140526]/95 via-[#1f0b38]/85 to-transparent px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#c9a452]/40">
              <p className="text-[#f3dfa6] text-xs font-bold">
                {activeModalVideo.subtitle} (نسبة التكبير الحالية: {modalZoomScale}%)
              </p>
              <div className="flex items-center gap-2">
                {activeModalVideo.id === OPENING_PRESENTATION_VIDEO.id && (
                  <span className="text-xs font-extrabold text-[#e7cb82] bg-[#2b124c]/90 border border-[#c9a452] px-3 py-1 rounded-xl">
                    ينتقل تلقائياً إلى العرض المتزامن بعد {openingCountdown} ثانية
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalVideo(null);
                    startFullInteractivePresentation();
                  }}
                  className="gold-metallic-card text-xs font-black px-4 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <span>بدء العرض الصوتي وتدرج النصوص الآن</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ALERT TOAST CONTAINER */}
      {toasts.length > 0 && (
        <div
          aria-live="assertive"
          className="fixed top-20 left-4 sm:left-6 z-50 flex flex-col gap-3 max-w-md w-[calc(100%-2rem)] no-print"
        >
          {toasts.map((toast) => {
            const borderStyle = 'border-[#c9a452] bg-[#1f0b38]/95 text-white';
            const badgeColor = 'bg-[#c9a452] text-[#1e0b36]';

            return (
              <div
                key={toast.id}
                role="alert"
                className={`rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-md transition-all flex items-start justify-between gap-3 ${borderStyle}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${badgeColor}`}
                  >
                    {toast.type === 'error' || toast.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : toast.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <BellRing className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-[#f3dfa6]">
                      {toast.title}
                    </h4>
                    <p className="text-xs text-[#e8dff5] leading-relaxed mt-1">
                      {toast.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Corporate Seal Modal when user clicks the logo */}
      {showLogoLightbox && (
        <div
          className="fixed inset-0 z-50 bg-[#18082c]/85 backdrop-blur-sm flex items-center justify-center p-4 no-print"
          onClick={() => setShowLogoLightbox(false)}
        >
          <div
            className="bg-[#faf7f0] border-2 border-[#c9a452] rounded-3xl p-6 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-64 h-64 mx-auto rounded-full p-1.5 bg-gradient-to-b from-[#e7cb82] via-[#c9a452] to-[#9b7220] shadow-xl">
              <img
                src={CORPORATE_SEAL_LOGO}
                alt="شعار شركة بن كليلة العامري للتجارة والاستثمار"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <h3 className="mt-4 text-lg font-black text-[#2b124c]">
              شركة بن كليلة العامري للتجارة والاستثمار
            </h3>
            <p className="text-xs font-bold text-[#9c7625] mt-1">
              BIN KALILAH AL AMRI TRADE & INVESTMENT · SALALAH, OMAN
            </p>
            <button
              type="button"
              onClick={() => setShowLogoLightbox(false)}
              className="mt-5 px-6 py-2 rounded-xl bg-[#2b124c] text-[#e7cb82] border border-[#c9a452] text-xs font-extrabold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP STICKY BAR (ROYAL PURPLE & METALLIC GOLD) */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#1f0b38] via-[#2b124c] to-[#1f0b38] border-b-2 border-[#c9a452] text-white shadow-xl no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Right Brand & Official Corporate Seal */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setShowLogoLightbox(true)}
              title="تكبير الخاتم الرسمي لشركة بن كليلة العامري للتجارة والاستثمار"
              className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-b from-[#f3dfa6] via-[#c9a452] to-[#9b7220] shadow-lg shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              <img
                src={CORPORATE_SEAL_LOGO}
                alt="شركة بن كليلة العامري للتجارة والاستثمار"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="gold-metallic-card text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                  رؤية عُمان 2040 · ملف رقابي
                </span>
                <span className="bg-[#3d1c68] border border-[#c9a452]/50 text-[#f3dfa6] text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                  ملف المراجع / الفاضل خالد المسروري
                </span>
              </div>
              <h1 className="text-white font-extrabold text-xs sm:text-sm mt-1">
                شركة بن كليلة العامري للتجارة والاستثمار — الصادرات غير النفطية
              </h1>
            </div>
          </div>

          {/* Left Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Replay 30s Fullscreen Opening Video Button */}
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                setIsModalFullscreen(true);
                setModalFitMode('cover');
                setModalZoomScale(100);
                setActiveModalVideo(OPENING_PRESENTATION_VIDEO);
              }}
              className="px-3 py-2 rounded-xl bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#e7cb82] text-[#f3dfa6] text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#e7cb82]" />
              <span>الفيديو الافتتاحي ملء الشاشة (30ث)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                playExecutiveAppeal(0, null, 'exec-appeal-full', true)
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-md ${
                isExecAppealPlaying
                  ? 'bg-white text-[#2b124c] ring-2 ring-[#e7cb82]'
                  : 'gold-metallic-card hover:brightness-105'
              }`}
            >
              {isExecAppealPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>
                {isExecAppealPlaying
                  ? `الخلاصة التنفيذية (${formatTime(execAppealTime)} / ${formatTime(execAppealDuration)})`
                  : 'الخلاصة التنفيذية والنداء الختامي (03:46)'}
              </span>
            </button>

            <button
              type="button"
              onClick={startFullInteractivePresentation}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isFullPresentationPlaying
                  ? 'bg-white text-[#2b124c] ring-2 ring-[#e7cb82]'
                  : 'bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#e7cb82] text-[#f3dfa6]'
              }`}
            >
              {isFullPresentationPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>
                {isFullPresentationPlaying
                  ? `مزامنة العرض (${formatTime(currentTime)} / ${formatTime(duration)})`
                  : 'تشغيل العرض الشامل (08:36)'}
              </span>
            </button>

            {activeAudioId && (
              <button
                type="button"
                onClick={stopAllAudio}
                className="px-2.5 py-2 rounded-xl bg-[#381960] hover:bg-[#482278] border border-[#c9a452]/50 text-[#e8dff5] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Square className="w-3 h-3 fill-current text-[#e7cb82]" />
                <span>إيقاف الصوت</span>
              </button>
            )}

            {/* Smart Audio Transition Alert Setting Toggle ("تنبيه صوتي ذكي") */}
            <button
              type="button"
              onClick={() => {
                setSmartAudioTransition((prev) => {
                  const next = !prev;
                  showToast(
                    'info',
                    next ? 'تم تفعيل التنبيه الصوتي الذكي' : 'تم إيقاف التنبيه الصوتي الذكي',
                    next
                      ? 'سيعمل التنبيه الصوتي الذكي تلقائياً عند انتهاء المقطع الصوتي لكل شريحة للتمهيد للمحور التالي دون تداخل مع الصوت الرئيسي.'
                      : 'تم إيقاف التنبيه الصوتي التمهيدي بين الشرائح.'
                  );
                  return next;
                });
              }}
              title="تفعيل أو إيقاف التنبيه الصوتي الذكي عند انتهاء المقطع الصوتي لكل شريحة للتمهيد للمحور التالي"
              className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                smartAudioTransition
                  ? 'gold-metallic-card'
                  : 'bg-[#2b124c] border-[#c9a452]/60 text-[#f3dfa6]'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>تنبيه صوتي ذكي: {smartAudioTransition ? 'مفعّل' : 'متوقف'}</span>
            </button>

            {/* Toggle Screen Auto-Scroll (Stop / Start Upward Screen Movement) */}
            <button
              type="button"
              onClick={() => setIsGradualAutoScroll((prev) => !prev)}
              title="إيقاف أو تشغيل تحرك الشاشة التلقائي"
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                isGradualAutoScroll
                  ? 'gold-metallic-card'
                  : 'bg-[#2b124c] hover:bg-[#3d1b6a] border-[#c9a452] text-[#f3dfa6]'
              }`}
            >
              {isGradualAutoScroll ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>تثبيت الشاشة</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-[#e7cb82]" />
                  <span>تحريك الشاشة</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setViewMode((v) => (v === 'royal' ? 'manus' : 'royal'))}
              className="px-2.5 py-2 rounded-xl bg-[#381960] hover:bg-[#482278] border border-[#c9a452] text-[#f3dfa6] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#e7cb82]" />
              <span>{viewMode === 'royal' ? 'عرض موجز' : 'العرض الشامل'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-2.5 py-2 rounded-xl bg-[#381960] hover:bg-[#482278] border border-[#c9a452]/50 text-[#e8dff5] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 text-[#e7cb82]" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                setPasswordInput('');
                setIsAuthenticated(false);
              }}
              title="قفل الملف الرقابي بالرقم السري"
              className="px-2.5 py-2 rounded-xl bg-[#240b3b] hover:bg-[#38155a] border border-[#c9a452] text-[#f3dfa6] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-[#e7cb82]" />
              <span>قفل</span>
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'manus' ? (
        <ManusSpaceView
          activeChapterIndex={activeChapterIndex}
          isPlayingFull={isFullPresentationPlaying}
          onPlayChapter={handlePlayChapter}
          onStopAudio={stopAllAudio}
          audioElementRef={mainAudioRef}
          audioSrc={currentAudioSrc}
          onSwitchToRoyal={() => setViewMode('royal')}
        />
      ) : (
        <>
          {/* 2. HERO BANNER WITH ULTRA-LIGHT TRANSPARENT GLASS OVER FULL-SCREEN CYCLING BACKGROUND VIDEO */}
          <section
            id="hero-section"
            className="relative z-10 bg-[#1d0a34]/20 backdrop-blur-[1px] text-white pt-10 pb-20 px-4 overflow-hidden border-b-4 border-[#c9a452]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  'radial-gradient(circle at 50% 20%, rgba(231, 203, 130, 0.25), transparent 65%)',
              }}
            />

            <div className="max-w-5xl mx-auto text-center relative z-10">
              {/* Official Corporate Seal Medallion at Top Center */}
              <div className="flex flex-col items-center justify-center mb-5">
                <div
                  onClick={() => setShowLogoLightbox(true)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-b from-[#fff2c6] via-[#c9a452] to-[#8f6718] shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                >
                  <img
                    src={CORPORATE_SEAL_LOGO}
                    alt="شعار شركة بن كليلة العامري للتجارة والاستثمار"
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                </div>
                <div className="mt-3 inline-flex items-center gap-2 bg-[#391963]/55 border border-[#c9a452] text-[#f3dfa6] text-[11px] sm:text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  <ShieldCheck className="w-4 h-4 text-[#e7cb82]" />
                  <span>
                    شركة بن كليلة العامري للتجارة والاستثمار | ملف المراجع: الفاضل خالد المسروري
                  </span>
                </div>
              </div>

              {/* Main Updated Headline */}
              <h2 className="text-2xl sm:text-4xl md:text-[42px] font-black leading-[1.35] tracking-tight text-white max-w-4xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                «تحديات التنويع الاقتصادي:
                <span className="block gold-glow-text mt-1.5">
                  عوائق أمام الصادرات غير النفطية في مسار رؤية عُمان 2040»
                </span>
              </h2>

              {/* Subtitles */}
              <p className="text-white text-xs sm:text-sm font-bold mt-4 max-w-2xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                سجل الوقائع والحجج القانونية والمالية المرفوعة إلى وزارة التجارة والصناعة وترويج
                الاستثمار ومركز حماية المنافسة ومنع الاحتكار (بعناية الفاضل خالد المسروري)
              </p>
              <p className="text-[#ffe59e] text-[11px] sm:text-xs font-extrabold mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                بشأن الإخلال العقدي والامتناع التعسفي لشركة المطاحن العمانية ش.م.ع.ع تجاه صادرات شركة
                بن كليلة العامري للتجارة والاستثمار
              </p>

              {/* Golden Concept Pill + Synchronized Royal Quote Box (Light Glass over Moving Video) */}
              <div className="mt-8 bg-[#281047]/30 backdrop-blur-[2px] border-2 border-[#c9a452] rounded-3xl p-6 sm:p-7 max-w-3xl mx-auto relative shadow-2xl">
                <div className="-mt-10 mb-4 flex justify-center">
                  <span className="gold-metallic-card px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-black shadow-md">
                    القاعدة الذهبية للملف الرقابي: التزام مالي 100% في مواجهة تعطيل إجرائي ومستندي
                  </span>
                </div>

                <p className="text-white font-extrabold text-base sm:text-lg leading-relaxed px-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                  «يُقدم هذا الملف إلى مركز حماية المنافسة ومنع الاحتكار بوزارة التجارة والصناعة
                  وترويج الاستثمار، ويأتي في إطار حرص المستثمر الوطني على حماية الصادرات العُمانية غير
                  النفطية، ودعم مستهدفات رؤية عُمان 2040»
                </p>

                {/* 3 Status Points inside Quote Card */}
                <div className="mt-5 pt-4 border-t border-[#c9a452]/40 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] sm:text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-[#f3dfa6]">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#e7cb82]" />
                    <span>جدول 16 تريلا لكل دورة تشغيلية (40 يوماً)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#e7cb82]" />
                    <span>السداد 100% مسبقاً وبانتظام (18,640 ر.ع)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#f3dfa6]">
                    <FileText className="w-4 h-4 shrink-0 text-[#e7cb82]" />
                    <span>العميل النهائي: مزرعة بركة الوقن</span>
                  </div>
                </div>
              </div>

              {/* Verbatim Recording Transcript for Hero / Introduction */}
              <div className="max-w-4xl mx-auto text-right">
                {renderRecordingVerbatimBox('hero')}
              </div>

              {/* PROMINENT 30-SECOND OPENING PRESENTATION VIDEO AT THE BEGINNING (BOUND TO OPENING_PRESENTATION_VIDEO) */}
              <div className="mt-8 bg-[#1f0b38]/40 backdrop-blur-[2px] border-2 border-[#e7cb82] rounded-3xl p-4 sm:p-6 max-w-4xl mx-auto shadow-2xl text-right no-print">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#c9a452]/40">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="gold-metallic-card text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#2b124c]" />
                      <span>العرض التقديمي الافتتاحي في البداية (30 ثانية · بالصوت الكامل)</span>
                    </span>
                    <span className="text-[#f3dfa6] text-xs font-bold">
                      يفتح تلقائياً بملء الشاشة 30 ثانية عند الدخول ثم يعود للعرض
                    </span>
                  </div>
                </div>

                <div
                  className={`relative rounded-2xl overflow-hidden border-2 border-[#c9a452] bg-black shadow-xl transition-all ${
                    heroVideoHeight === 'sm'
                      ? 'h-56 sm:h-64'
                      : heroVideoHeight === 'md'
                      ? 'h-72 sm:h-96'
                      : heroVideoHeight === 'lg'
                      ? 'h-96 sm:h-[480px]'
                      : 'h-[480px] sm:h-[600px]'
                  }`}
                >
                  <video
                    ref={openingHeroVideoRef}
                    key={OPENING_PRESENTATION_VIDEO.url}
                    src={OPENING_PRESENTATION_VIDEO.url}
                    poster="/assets/aistudio/fleet1.jpg"
                    controls
                    playsInline
                    preload="metadata"
                    muted={false}
                    onPlay={() => {
                      stopAllAudio();
                      setIsOpeningVideoPlayingHero(true);
                    }}
                    onPause={() => setIsOpeningVideoPlayingHero(false)}
                    onEnded={() => {
                      setIsOpeningVideoPlayingHero(false);
                      showToast(
                        'info',
                        'اكتمل العرض التقديمي الافتتاحي (30 ثانية)',
                        'يبدأ الآن استعراض الموضوع الرئيسي والجلسة الصوتية الموحدة للعرض.'
                      );
                      scrollToSections();
                      startFullInteractivePresentation();
                    }}
                    style={{ transform: `scale(${heroVideoScale / 100})` }}
                    className="w-full h-full object-contain bg-black mx-auto transition-transform duration-200"
                  />
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#f3dfa6]">
                      {OPENING_PRESENTATION_VIDEO.title}
                    </h3>
                    <p className="text-[11px] text-[#e8dff5]/90 mt-0.5">
                      {OPENING_PRESENTATION_VIDEO.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        stopAllAudio();
                        setIsOpeningAutoMuted(false);
                        setIsModalFullscreen(true);
                        setModalFitMode('contain');
                        setModalZoomScale(100);
                        setActiveModalVideo(OPENING_PRESENTATION_VIDEO);
                      }}
                      className="gold-metallic-card px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>فتح العرض الافتتاحي الميداني بملء الشاشة الكاملة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (openingHeroVideoRef.current) {
                          openingHeroVideoRef.current.pause();
                        }
                        scrollToSections();
                        startFullInteractivePresentation();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#381960] hover:bg-[#49217a] border border-[#c9a452] text-[#f3dfa6] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>البدء في الموضوع ومزامنة الصوت مباشرة</span>
                      <ArrowDown className="w-3.5 h-3.5 text-[#e7cb82]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Hero CTA & Approved Audio Recordings Switcher (Dropdown + Buttons) */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 no-print">
                <button
                  type="button"
                  onClick={() =>
                    playClarificationQuestions(0, null, 'clarification-full', true)
                  }
                  className={`px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isClarificationPlaying
                      ? 'bg-white text-[#2b124c] ring-2 ring-[#e7cb82]'
                      : 'gold-metallic-card hover:brightness-105'
                  }`}
                >
                  {isClarificationPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  <span>
                    {isClarificationPlaying
                      ? `مذكرة الأسئلة الاستيضاحية (${formatTime(clarificationTime)} / ${formatTime(clarificationDuration)})`
                      : 'تشغيل مذكرة الأسئلة الاستيضاحية الـ 12 (07:26)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    playExecutiveAppeal(0, null, 'exec-appeal-full', true)
                  }
                  className={`px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isExecAppealPlaying
                      ? 'bg-white text-[#2b124c] ring-2 ring-[#e7cb82]'
                      : 'bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#e7cb82] text-[#f3dfa6]'
                  }`}
                >
                  {isExecAppealPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  <span>
                    {isExecAppealPlaying
                      ? `الخلاصة التنفيذية (${formatTime(execAppealTime)} / ${formatTime(execAppealDuration)})`
                      : 'الخلاصة التنفيذية والنداء الختامي (03:46)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={startFullInteractivePresentation}
                  className={`px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isFullPresentationPlaying || activeAudioId === 'hero'
                      ? 'bg-white text-[#2b124c] ring-2 ring-[#e7cb82]'
                      : 'bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#e7cb82] text-[#f3dfa6]'
                  }`}
                >
                  {isFullPresentationPlaying || activeAudioId === 'hero' ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  <span>
                    {isFullPresentationPlaying
                      ? 'جاري الاستماع للعرض الشامل...'
                      : 'السرد التفصيلي الشامل للملف (08:36)'}
                  </span>
                </button>
              </div>

              {/* 1. المقدمة: البيانات المالية والتشغيلية وأسطول الشاحنات (تُذكر الأرقام المالية هنا فقط دون تكرار) */}
              <div
                id="section-01"
                className="mt-8 text-right bg-[#1f0b38]/85 rounded-3xl border-2 border-[#c9a452] p-6 sm:p-8 shadow-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#c9a452]/40">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl gold-metallic-card font-black text-base flex items-center justify-center shrink-0 tabular-nums">
                      01
                    </div>
                    <div>
                      <span className="text-[#e7cb82] text-xs font-extrabold block">
                        1. المقدمة — الوقائع التعاقدية والتزام المشتري في مسار رؤية عُمان 2040
                      </span>
                      <h3 className="text-[#fff2c6] text-lg sm:text-xl font-black mt-0.5">
                        المقدمة: من صلالة إلى تأسيس خط التصدير الوطني غير النفطي
                      </h3>
                    </div>
                  </div>
                  {renderSectionAudioButton('section1', 'استماع للمقدمة')}
                </div>

                <p className="text-[#f8f3e6] text-xs sm:text-sm leading-[1.95] mt-4">
                  في شهر مايو من عام 2026م، عقب واقعة إغلاق مستودع تجارة الأعلاف في صلالة، بادر المستثمر الوطني{' '}
                  <strong className="text-[#e7cb82] font-extrabold">
                    (شركة بن كليلة العامري للتجارة والاستثمار)
                  </strong>{' '}
                  بتأسيس خط تصدير وطني مباشر نحو دولة الإمارات العربية المتحدة يواكب مستهدفات التنويع الاقتصادي ورؤية عُمان 2040، بعقد توريد استراتيجي سنوي بقيمة{' '}
                  <span className="gold-metallic-card font-black px-2.5 py-0.5 rounded mx-0.5 tabular-nums">
                    1,870,000 ريال عماني (1.87 مليون ر.ع)
                  </span>{' '}
                  لصالح العميل النهائي{' '}
                  <strong className="text-[#e7cb82] font-extrabold">
                    (مزرعة بركة الوقن - العين)
                  </strong>{' '}
                  التي تضم 160 ألف طير، مع التزام نقدي مسبق بنسبة 100% بإجمالي{' '}
                  <strong className="text-[#fff2c6] font-black tabular-nums">
                    18,640 ر.ع
                  </strong>{' '}
                  لكل دورة تشغيلية (16 تريلا كل 40 يوماً) وسداد{' '}
                  <strong className="text-[#fff2c6] font-black tabular-nums">
                    700 ر.ع
                  </strong>{' '}
                  نقداً مقدماً لتغطية نقل الشحنتين الثالثة والرابعة.
                </p>

                {/* Financial KPI Cards (Exclusively in 1. المقدمة) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  <div className="royal-purple-box rounded-2xl p-4 text-center border border-[#c9a452]">
                    <div className="text-2xl sm:text-3xl font-black gold-glow-text tabular-nums">
                      1,870,000 OMR
                    </div>
                    <p className="text-xs text-[#f3dfa6] font-bold mt-1.5">
                      القيمة الإجمالية لعقد التصدير غير النفطي (100 أسبوع) لصالح مزرعة بركة الوقن
                    </p>
                  </div>

                  <div className="royal-purple-box rounded-2xl p-4 text-center border border-[#c9a452]">
                    <div className="text-2xl sm:text-3xl font-black gold-glow-text tabular-nums">
                      100% (18,640 ر.ع)
                    </div>
                    <p className="text-xs text-[#f3dfa6] font-bold mt-1.5">
                      سداد نقدي مسبق بالكامل لكل دفعة تشغيلية لشحنات الـ 16 تريلا (لكل دورة 40 يوماً)
                    </p>
                  </div>

                  <div className="royal-purple-box rounded-2xl p-4 text-center border border-[#c9a452]">
                    <div className="text-2xl sm:text-3xl font-black gold-glow-text tabular-nums">
                      700 ر.ع
                    </div>
                    <p className="text-xs text-[#f3dfa6] font-bold mt-1.5">
                      دفعة النقل المسددة نقداً مقدماً لتسيير الشحنتين الثالثة والرابعة ضمن جدول 28 أبريل
                    </p>
                  </div>
                </div>

                {/* Fleet Media Switcher (Trucks & Warehouses Only) */}
                <div className="mt-5 bg-[#140526]/75 border border-[#c9a452]/70 rounded-2xl p-4">
                  {(() => {
                    const currentItem = fleetPhotos[selectedFleetIdx] || FLEET_PHOTOS[0];
                    const posY = typeof currentItem.posY === 'number' ? currentItem.posY : 50;
                    const posX = typeof currentItem.posX === 'number' ? currentItem.posX : 50;
                    const itemScale =
                      typeof currentItem.scale === 'number' ? currentItem.scale : 100;
                    const fitMode = currentItem.fitMode || 'cover';
                    const isVideoSlot = currentItem.mediaType === 'video';
                    const displayBadge =
                      currentItem.badge &&
                      (currentItem.badge.includes('16 تريلا') ||
                        currentItem.badge.includes('أسطول'))
                        ? 'جدول 16 تريلا'
                        : currentItem.badge;

                    return (
                      <>
                        <div
                          onClick={() => {
                            setIsModalFullscreen(true);
                            setModalFitMode('contain');
                            setModalZoomScale(100);
                            setActiveModalVideo({
                              id: `slot-${selectedFleetIdx}`,
                              url: currentItem.url,
                              title:
                                currentItem.title ||
                                `مرفق أسطول الشاحنات والمخازن رقم ${selectedFleetIdx + 1}`,
                              subtitle: 'معاينة بملء الشاشة الكاملة لأسطول الشاحنات والمخازن',
                              badge: displayBadge || 'جدول 16 تريلا',
                              durationLabel: isVideoSlot ? 'فيديو ميداني' : 'صورة ميدانية',
                              hasAudio: false,
                              mediaType: isVideoSlot ? 'video' : 'image',
                            });
                          }}
                          className={`${
                            isShowcaseExpanded ? 'h-72 sm:h-88' : 'h-52 sm:h-60'
                          } rounded-xl border-2 border-[#c9a452] overflow-hidden relative bg-[#1c0b33] select-none transition-all cursor-pointer`}
                        >
                          {isVideoSlot ? (
                            <video
                              key={currentItem.url}
                              src={currentItem.url}
                              autoPlay
                              muted
                              loop
                              playsInline
                              style={{
                                objectPosition: `${posX}% ${posY}%`,
                                transform: `scale(${itemScale / 100})`,
                              }}
                              className={`w-full h-full pointer-events-none transition-transform duration-200 ${
                                fitMode === 'contain' ? 'object-contain' : 'object-cover'
                              }`}
                            />
                          ) : (
                            <img
                              src={currentItem.url}
                              alt={currentItem.title || ''}
                              draggable={false}
                              style={{
                                objectPosition: `${posX}% ${posY}%`,
                                transform: `scale(${itemScale / 100})`,
                              }}
                              className={`w-full h-full pointer-events-none transition-transform duration-200 ${
                                fitMode === 'contain' ? 'object-contain' : 'object-cover'
                              }`}
                            />
                          )}
                          <span className="absolute bottom-2.5 right-2.5 royal-purple-box text-[#f3dfa6] text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md pointer-events-none">
                            {isVideoSlot ? (
                              <Film className="w-3 h-3 text-[#e7cb82]" />
                            ) : (
                              <ImageIcon className="w-3 h-3 text-[#e7cb82]" />
                            )}
                            <span>{displayBadge}</span>
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-1.5 flex-wrap no-print">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {fleetPhotos.map((item, i) => {
                              const isVid = item.mediaType === 'video';
                              return (
                                <button
                                  key={`${item.url}-${i}`}
                                  type="button"
                                  onClick={() => setSelectedFleetIdx(i)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                                    selectedFleetIdx === i
                                      ? 'gold-metallic-card'
                                      : 'bg-[#2b124c] text-[#f3dfa6] border-[#c9a452]/60'
                                  }`}
                                >
                                  {isVid ? (
                                    <Film className="w-3 h-3" />
                                  ) : (
                                    <ImageIcon className="w-3 h-3 opacity-75" />
                                  )}
                                  <span>شاحنة/مخزن {i + 1}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {renderRecordingVerbatimBox('section1')}
              </div>
            </div>
          </section>

          {/* 2. مذكرة الأسئلة الاستيضاحية الـ 12 (التسجيل الصوتي الجديد) */}
          <div className="max-w-5xl w-full mx-auto px-4 mt-6 mb-10 relative z-20">
            <section
              id="section-clarification-questions"
              className={`bg-[#faf7f0] rounded-3xl shadow-xl border-2 transition-all p-6 sm:p-8 ${
                isClarificationPlaying
                  ? 'border-[#e7cb82] ring-2 ring-[#c9a452]/50'
                  : 'border-[#c9a452]'
              }`}
            >
              {/* Unified Audio Recording Selector Bar (Dropdown Menu + Clean Ministerial Tabs) */}
              <div className="mb-6 p-4 rounded-2xl bg-[#1f0b38]/85 border border-[#c9a452] flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-[#e7cb82] shrink-0" />
                  <span className="text-xs font-black text-[#f3dfa6]">
                    مشغل التسجيلات الصوتية الرسمية المعتمدة (منقحة بدون أي تكرار):
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
                  <select
                    aria-label="اختيار التسجيل الصوتي المعتمد"
                    value={selectedApprovedRecordingId}
                    onChange={(e) => {
                      const recId = e.target.value;
                      setSelectedApprovedRecordingId(recId);
                      if (recId === 'rec-01-intro') {
                        playElevenLabsSegment('hero', 0, SECTION_TIMESTAMPS.hero.end, 0, false);
                      } else if (recId === 'clarification-questions') {
                        playClarificationQuestions(0, null, 'clarification-full', true);
                      } else if (recId === 'rec-03-commitment') {
                        playElevenLabsSegment('section1', SECTION_TIMESTAMPS.section1.start, SECTION_TIMESTAMPS.section1.end, 1, false);
                      } else if (recId === 'rec-04-noufal') {
                        playElevenLabsSegment('section3', SECTION_TIMESTAMPS.section3.start, SECTION_TIMESTAMPS.section3.end, 2, false);
                      } else if (recId === 'rec-06-coa') {
                        playElevenLabsSegment('section2', SECTION_TIMESTAMPS.section2.start, SECTION_TIMESTAMPS.section2.end, 3, false);
                      } else if (recId === 'rec-05-legal') {
                        playElevenLabsSegment('section5', SECTION_TIMESTAMPS.section5.start, SECTION_TIMESTAMPS.section5.end, 4, false);
                      } else if (recId === 'executive-appeal') {
                        playExecutiveAppeal(0, null, 'exec-appeal-full', true);
                      } else if (recId === 'main-dossier') {
                        startFullInteractivePresentation();
                      }
                    }}
                    className="bg-[#140526] border border-[#c9a452] text-[#f3dfa6] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#e7cb82] cursor-pointer"
                  >
                    {APPROVED_AUDIO_RECORDINGS.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.title} ({rec.durationLabel})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {APPROVED_AUDIO_RECORDINGS.map((rec) => {
                      const isActiveRec =
                        (rec.id === 'rec-01-intro' && activeAudioId === 'hero') ||
                        (rec.id === 'clarification-questions' && isClarificationPlaying) ||
                        (rec.id === 'rec-03-commitment' && activeAudioId === 'section1') ||
                        (rec.id === 'rec-04-noufal' && activeAudioId === 'section3') ||
                        (rec.id === 'rec-06-coa' && activeAudioId === 'section2') ||
                        (rec.id === 'rec-05-legal' && activeAudioId === 'section5') ||
                        (rec.id === 'executive-appeal' && isExecAppealPlaying) ||
                        (rec.id === 'main-dossier' && isFullPresentationPlaying);
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setSelectedApprovedRecordingId(rec.id);
                            if (rec.id === 'rec-01-intro') {
                              playElevenLabsSegment('hero', 0, SECTION_TIMESTAMPS.hero.end, 0, false);
                            } else if (rec.id === 'clarification-questions') {
                              playClarificationQuestions(0, null, 'clarification-full', false);
                            } else if (rec.id === 'rec-03-commitment') {
                              playElevenLabsSegment('section1', SECTION_TIMESTAMPS.section1.start, SECTION_TIMESTAMPS.section1.end, 1, false);
                            } else if (rec.id === 'rec-04-noufal') {
                              playElevenLabsSegment('section3', SECTION_TIMESTAMPS.section3.start, SECTION_TIMESTAMPS.section3.end, 2, false);
                            } else if (rec.id === 'rec-06-coa') {
                              playElevenLabsSegment('section2', SECTION_TIMESTAMPS.section2.start, SECTION_TIMESTAMPS.section2.end, 3, false);
                            } else if (rec.id === 'rec-05-legal') {
                              playElevenLabsSegment('section5', SECTION_TIMESTAMPS.section5.start, SECTION_TIMESTAMPS.section5.end, 4, false);
                            } else if (rec.id === 'executive-appeal') {
                              playExecutiveAppeal(0, null, 'exec-appeal-full', true);
                            } else {
                              startFullInteractivePresentation();
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            isActiveRec
                              ? 'gold-metallic-card'
                              : 'bg-[#2b124c] hover:bg-[#381960] text-[#f3dfa6] border-[#c9a452]/70'
                          }`}
                        >
                          {isActiveRec ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                          <span>{rec.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#dccaa3]">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl royal-purple-box text-[#e7cb82] font-black text-xs flex flex-col items-center justify-center shrink-0 border border-[#c9a452]">
                    <Volume2 className="w-4 h-4 text-[#e7cb82]" />
                    <span className="text-[10px] mt-0.5 tabular-nums">06:58</span>
                  </div>
                  <div>
                    <span className="text-[#9c7625] text-xs font-extrabold block">
                      مذكرة الاستيضاح الرسمية بعد العنوان والمقدمة | ملف المراجع: الفاضل خالد المسروري
                    </span>
                    <h3 className="text-[#2b124c] text-lg sm:text-2xl font-black mt-0.5">
                      مذكرة الأسئلة الاستيضاحية الـ 12 الموجهة رسمياً وكتابياً إلى إدارة المصنع
                    </h3>
                    <p className="text-[#4a3963] text-xs mt-1">
                      النص الرسمي المطابق للتسجيل الصوتي والمتواكب تنازلياً مع التحدث بهدوء ووضوح تام من بدايته وحتى نهايته
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap no-print">
                  <button
                    type="button"
                    onClick={() =>
                      playClarificationQuestions(0, null, 'clarification-full', false)
                    }
                    className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                      isClarificationPlaying
                        ? 'bg-[#2b124c] text-[#e7cb82] border border-[#e7cb82]'
                        : 'gold-metallic-card hover:brightness-105'
                    }`}
                  >
                    {isClarificationPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>إيقاف مؤقت ({formatTime(clarificationTime)})</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>تشغيل مذكرة الأسئلة الاستيضاحية</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (clarificationAudioRef.current) {
                        clarificationAudioRef.current.currentTime = 0;
                        setClarificationTime(0);
                      }
                      playClarificationQuestions(0, null, 'clarification-full', false);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#c9a452] text-[#f3dfa6] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#e7cb82]" />
                    <span>من البداية</span>
                  </button>
                </div>
              </div>

              {/* Calm Ministerial Audio Deck & Timeline Bar */}
              <div className="mt-5 royal-purple-box rounded-2xl p-4 sm:p-5 border border-[#c9a452] no-print">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#c9a452]/35">
                  <div className="flex items-center gap-2">
                    <span className="gold-metallic-card text-[10px] font-black px-2.5 py-0.5 rounded-md">
                      {isClarificationPlaying ? 'يتلو الآن بالتواكب التنازلي' : 'جاهز للتشغيل'}
                    </span>
                    <span className="text-xs font-extrabold text-[#f3dfa6]">
                      {activeClarificationGroup.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#e7cb82] bg-black/35 px-3 py-1 rounded-lg border border-[#c9a452]/40 tabular-nums">
                    {formatTime(clarificationTime)} / {formatTime(clarificationDuration)}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={clarificationDuration || 418}
                    step={0.1}
                    value={clarificationTime}
                    onChange={(e) => {
                      const nextTime = parseFloat(e.target.value);
                      setClarificationTime(nextTime);
                      if (clarificationAudioRef.current) {
                        clarificationAudioRef.current.currentTime = nextTime;
                      }
                    }}
                    className="w-full accent-[#e7cb82] cursor-pointer h-1.5 rounded-lg"
                  />

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {CLARIFICATION_QUESTIONS_GROUPS.map((grp) => {
                      const isCurrentGrp =
                        isClarificationPlaying &&
                        clarificationTime >= grp.start &&
                        clarificationTime < grp.end;
                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() =>
                            playClarificationQuestions(grp.start, null, 'clarification-full', false)
                          }
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                            isCurrentGrp
                              ? 'gold-metallic-card'
                              : 'bg-[#1a0833] hover:bg-[#280e4a] text-[#f3dfa6] border-[#c9a452]/50'
                          }`}
                        >
                          {grp.badge} ({grp.timeRange})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Downward Synchronized Verbatim Groups & Sentences (Clean, Calm Ministerial Layout Without Word Highlighting) */}
              <div className="mt-6 space-y-5">
                {CLARIFICATION_QUESTIONS_GROUPS.map((grp) => {
                  const isGrpActive =
                    isClarificationPlaying &&
                    clarificationTime >= grp.start &&
                    clarificationTime < grp.end;

                  return (
                    <div
                      key={grp.id}
                      id={`clar-group-${grp.id}`}
                      className={`rounded-2xl border p-5 transition-colors bg-[#1f0b38]/85 ${
                        isGrpActive
                          ? 'border-[#e7cb82] shadow-lg'
                          : 'border-[#c9a452]/70'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#c9a452]/35">
                        <div>
                          <span className="text-[11px] font-extrabold text-[#e7cb82] block">
                            {grp.badge} · ({grp.timeRange})
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-[#f3dfa6] mt-0.5">
                            {grp.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            playClarificationQuestions(grp.start, grp.end, grp.id, false)
                          }
                          className="no-print px-3 py-1.5 rounded-xl bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#c9a452] text-[#f3dfa6] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-[#e7cb82]" />
                          <span>استماع لهذا القسم ({grp.timeRange})</span>
                        </button>
                      </div>

                      <div className="mt-3.5 space-y-2.5">
                        {grp.sentences
                          .filter((s) => s.text.trim().length > 0)
                          .map((sent) => {
                            const isSentSpeaking =
                              isClarificationPlaying &&
                              clarificationTime >= sent.start &&
                              clarificationTime < sent.end;

                            return (
                              <div
                                key={sent.id}
                                id={`clar-sentence-${sent.id}`}
                                onClick={() =>
                                  playClarificationQuestions(
                                    sent.start,
                                    null,
                                    'clarification-full',
                                    false
                                  )
                                }
                                className={`rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                  isSentSpeaking
                                    ? 'bg-[#2b124c] border-[#e7cb82] shadow-md'
                                    : 'bg-[#1a0833]/55 border-[#c9a452]/35 hover:border-[#c9a452]'
                                }`}
                              >
                                <p className="text-xs sm:text-sm leading-[1.95] font-semibold text-[#f8f3e6]">
                                  {sent.text}
                                </p>
                                <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-md bg-black/35 text-[#e7cb82] border border-[#c9a452]/40 shrink-0 self-end sm:self-center tabular-nums">
                                  {sent.timeLabel}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* 3 -> 4 -> 5 -> 6: التسلسل الإجباري للأقسام الرئيسية بدون أي تكرار للمعلومات المحظورة */}
          <main className="max-w-5xl w-full mx-auto px-4 mt-8 space-y-7">
            {/* 3. الوقائع والتدخل الأجنبي (نوفل) */}
            <article
              id="section-03"
              className={`bg-[#faf7f0] rounded-3xl shadow-md border-2 transition-colors p-6 sm:p-8 ${
                activeAudioId === 'section3'
                  ? 'border-[#e7cb82]'
                  : 'border-[#c9a452]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#dccaa3]">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl royal-purple-box text-[#e7cb82] font-black text-base flex items-center justify-center shrink-0 tabular-nums">
                    03
                  </div>
                  <div>
                    <span className="text-[#9c7625] text-xs font-extrabold block">
                      3. الوقائع والتدخل الأجنبي (نوفل) — سلاسل الإمداد والحوكمة
                    </span>
                    <h3 className="text-[#2b124c] text-lg sm:text-xl font-black mt-0.5">
                      الوقائع والتدخل الأجنبي (نوفل): احتجاز الشاحنات ومحاولة إقصاء المستثمر الوطني
                    </h3>
                  </div>
                </div>
                {renderSectionAudioButton('section3', 'استماع للقسم الثالث')}
              </div>

              <p className="text-[#3b2954] text-xs sm:text-sm leading-[1.95] mt-5">
                تُثبت الوقائع الميدانية أن عرقلة وحجب الأوراق البيطرية كانت تهدف إلى إحراق الوقت
                واستنفاد مخزون الأعلاف لدى العميل النهائي{' '}
                <strong className="text-[#2b124c] font-extrabold">
                  (مزرعة بركة الوقن التي تضم 160 ألف طير)
                </strong>{' '}
                لدفع مسار التصدير قسراً نحو الوسيط الأجنبي{' '}
                <strong className="text-[#2b124c] font-extrabold">
                  (المدعو نوفل / أطياف جلوبال للتجارة FZC - المسجلة بمنطقة حرة بعجمان)
                </strong>
                ؛ حيث تحوّل هذا الوسيط إلى أداة ضغط وإقصاء للمستثمر الوطني عبر مسارين موثقين:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div className="royal-node-card rounded-2xl p-5 text-white">
                  <div className="w-7 h-7 rounded-lg gold-metallic-card font-black text-xs flex items-center justify-center mb-3 tabular-nums">
                    1
                  </div>
                  <h4 className="text-[#e7cb82] font-black text-sm">
                    فرض الوسيط الأجنبي (نوفل) والعمولات القسرية
                  </h4>
                  <p className="text-[#e8dff5] text-xs leading-relaxed mt-2">
                    تعمد حجب الأوراق البيطرية لوضع المزرعة أمام خطر نفاد العلف عن 160 ألف طير،
                    ومحاولة فرض الوسيط الأجنبي <strong className="text-white">(نوفل)</strong>{' '}
                    بعمولة إضافية قدرها 50 ريالاً عمانياً عن كل شحنة دون أي سند تعاقدي أو قيمة مضافة،
                    مع تمسك إدارة المزرعة بعقدها المباشر مع{' '}
                    <strong className="text-[#f3dfa6]">
                      شركة بن كليلة العامري للتجارة والاستثمار
                    </strong>{' '}
                    ورفضها التام للتعامل مع الوسيط الأجنبي.
                  </p>
                </div>

                <div className="bg-[#f3ede0] border-2 border-[#c9a452] rounded-2xl p-5">
                  <div className="w-7 h-7 rounded-lg bg-[#2b124c] text-[#e7cb82] font-black text-xs flex items-center justify-center mb-3 tabular-nums">
                    2
                  </div>
                  <h4 className="text-[#2b124c] font-black text-sm">
                    احتجاز الشاحنات المحملة لمدة 4 أيام متتالية
                  </h4>
                  <p className="text-[#3b2954] text-xs leading-relaxed mt-2">
                    في واقعة موثقة، تسلّم الوسيط الأجنبي{' '}
                    <strong className="text-[#2b124c]">(نوفل)</strong> دفعة النقل المقدمة نقداً، ومع
                    ذلك قام باحتجاز الشاحنات المحملة لمدة أربعة أيام متتالية مع إغلاق الهواتف وتجاهل
                    اتصالات الشركة، بينما سمح المصنع في ذات التوقيت للوسيط الأجنبي بتحميل الشاحنات
                    فوراً من البوابات في حين اعتذر للمستثمر الوطني بعدم توفر الإنتاج.
                  </p>
                </div>
              </div>

              {renderRecordingVerbatimBox('section3')}
            </article>

            {/* 4. الفخ المستندي (COA) */}
            <article
              id="section-02"
              className={`bg-[#faf7f0] rounded-3xl shadow-md border-2 transition-colors p-6 sm:p-8 ${
                activeAudioId === 'section2'
                  ? 'border-[#e7cb82]'
                  : 'border-[#c9a452]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#dccaa3]">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl royal-purple-box text-[#e7cb82] font-black text-base flex items-center justify-center shrink-0 tabular-nums">
                    04
                  </div>
                  <div>
                    <span className="text-[#9c7625] text-xs font-extrabold block">
                      4. الفخ المستندي (COA) — المطابقة الفنية والمختبرية (ISO 17025)
                    </span>
                    <h3 className="text-[#2b124c] text-lg sm:text-xl font-black mt-0.5">
                      الفخ المستندي (COA): تناقض شهادة التحليل مع البطاقة التعريفية وإقرار Layer 16%
                    </h3>
                  </div>
                </div>
                {renderSectionAudioButton('section2', 'استماع للقسم الرابع')}
              </div>

              <p className="text-[#3b2954] text-xs sm:text-sm leading-[1.95] mt-5">
                تكشف السجلات الرسمية عن فخ إجرائي وفني نُصب للمستثمر الوطني عبر تسليمه وثائق متضاربة
                صادرة عن ذات الجهة (شركة المطاحن العمانية)، مما ترتب عليه إغلاق تسجيل المنتج
                في النظام الرقمي الإماراتي التابع لوزارة التغير المناخي والبيئة (MOCCAE) تحت الطلب
                المقيد برقم:{' '}
                <span className="bg-[#2b124c] border border-[#c9a452] text-[#e7cb82] font-mono text-xs font-bold px-2.5 py-0.5 rounded tabular-nums">
                  (APH-12052026-3382929)
                </span>
                .
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div className="royal-node-card rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 text-[#e7cb82] font-black text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4 text-[#e7cb82] shrink-0" />
                    <span>شهادة التحليل المخبري (COA) مقابل البطاقة التعريفية</span>
                  </div>
                  <p className="text-[#e8dff5] text-xs leading-relaxed mt-2.5">
                    تثبت شهادة التحليل المخبري (COA) الصادرة عن دائرة الجودة بالمصنع أن المنتج{' '}
                    <strong className="font-black text-[#f3dfa6] underline">
                      خالٍ تماماً من مضادات الكوكسيديا (Anticoccidials) بنسبة صفرية (0%)
                    </strong>
                    ، بينما تُدرج البطاقة التعريفية (Label) المطبوعة على الكيس وجود برنامج تدوير
                    لمضادات الكوكسيديا وفترة سحب لا تقل عن 7 أيام، وعند طلب التصحيح جاء الرد: «هذا
                    يحتاج طباعة من جديد ومكلف!».
                  </p>
                </div>

                <div className="bg-[#f3ede0] border-2 border-[#c9a452] rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-[#2b124c] font-black text-xs sm:text-sm">
                    <FileText className="w-4 h-4 text-[#9c7625] shrink-0" />
                    <span>فخ إقرار سلامة علف البياض (Layer 16%) غير المتعاقد عليه</span>
                  </div>
                  <p className="text-[#3b2954] text-xs leading-relaxed mt-2.5">
                    رغم أن التعاقد والتصدير مخصص بالكامل لأعلاف التسمين (Broiler Starter & Finisher)،
                    قامت إدارة التصدير بإرسال إقرار سلامة لمنتج علف بياض فقط{' '}
                    <strong className="font-black text-[#2b124c]">(Layer 16%)</strong> لم يتم شراؤه
                    أصلاً، مما يعرض الشحنات الفعلية للرفض الجمركي الفوري والمساءلة القانونية في
                    المنافذ.
                  </p>
                </div>
              </div>

              {renderRecordingVerbatimBox('section2')}
            </article>

            {/* 5. التأصيل القانوني */}
            <article
              id="section-05"
              className={`bg-[#faf7f0] rounded-3xl shadow-md border-2 transition-colors p-6 sm:p-8 ${
                activeAudioId === 'section5'
                  ? 'border-[#e7cb82]'
                  : 'border-[#c9a452]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#dccaa3]">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl royal-purple-box text-[#e7cb82] font-black text-base flex items-center justify-center shrink-0 tabular-nums">
                    05
                  </div>
                  <div>
                    <span className="text-[#9c7625] text-xs font-extrabold block">
                      5. التأصيل القانوني — التكييف التشريعي والرقابي الحصري
                    </span>
                    <h3 className="text-[#2b124c] text-lg sm:text-xl font-black mt-0.5">
                      التأصيل القانوني: المرسوم السلطاني 67/2014 والمرسوم السلطاني 29/2013
                    </h3>
                  </div>
                </div>
                {renderSectionAudioButton('section5', 'استماع للقسم الخامس')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div className="royal-node-card rounded-2xl p-5 text-white">
                  <span className="text-[#e7cb82] text-xs font-extrabold block">
                    المرسوم السلطاني رقم 67/2014
                  </span>
                  <h4 className="text-white font-black text-sm sm:text-base mt-1">
                    قانون حماية المنافسة ومنع الاحتكار (المادتان 9 و10)
                  </h4>
                  <p className="text-[#e8dff5] text-xs leading-relaxed mt-3">
                    تحظر المادتان (9 و10) قطعياً إساءة استغلال الوضع المهيمن، والتفرقة في المعاملة بين
                    المتعاملين في العقود المتكافئة، والامتناع عن التعامل أو تقييد التوريد دون مسوغ
                    قانوني؛ حيث يُشكّل حجب المستندات الإلزامية اللازمة لعبور البضاعة عبر المنافذ{' '}
                    <strong className="font-black text-[#f3dfa6]">
                      امتناعاً تعسفياً مقنّعاً عن البيع وممارسة احتكارية مقيدة للمنافسة.
                    </strong>
                  </p>
                </div>

                <div className="bg-[#f3ede0] border-2 border-[#c9a452] rounded-2xl p-5">
                  <span className="text-[#9c7625] text-xs font-extrabold block">
                    المرسوم السلطاني رقم 29/2013
                  </span>
                  <h4 className="text-[#2b124c] font-black text-sm sm:text-base mt-1">
                    قانون المعاملات المدنية (المادة 381 والمادتان 155 و156)
                  </h4>
                  <p className="text-[#3b2954] text-xs leading-relaxed mt-3">
                    تلزم المادة (381) البائع بتسليم المبيع وملحقاته الضرورية للاستعمال المقصود؛ وفي
                    عقود التصدير، لا يكتمل التسليم قانوناً إلا بتسليم الشهادات والمستندات المطابقة
                    لعبور المنافذ. كما تقرر المادتان (155 و156) وجوب تنفيذ العقود بحسن نية، والمسؤولية
                    المدنية الكاملة عن كل إخلال جسيم يلحق الضرر بالمتعاقد الآخر.
                  </p>
                </div>
              </div>

              {renderRecordingVerbatimBox('section5')}
            </article>

            {/* 6. الخلاصة والنداء الختامي */}
            <section
              id="section-executive-appeal"
              className={`bg-[#faf7f0] rounded-3xl shadow-2xl border-2 transition-colors p-6 sm:p-8 ${
                isExecAppealPlaying
                  ? 'border-[#e7cb82]'
                  : 'border-[#c9a452]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b-2 border-[#dccaa3]">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl royal-purple-box text-[#e7cb82] font-black text-sm flex flex-col items-center justify-center shrink-0 shadow-lg border border-[#e7cb82]">
                    <span className="text-xs font-black">06</span>
                    <span className="text-[9px] mt-0.5 tabular-nums">03:46</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="gold-metallic-card text-[10px] font-black px-2.5 py-0.5 rounded-md">
                        6. الخلاصة والنداء الختامي
                      </span>
                      <span className="text-[#9c7625] text-xs font-extrabold">
                        بصوت المستثمر الوطني: بريك بن كليلة العامري
                      </span>
                    </div>
                    <h3 className="text-[#2b124c] text-lg sm:text-2xl font-black mt-1">
                      الخلاصة التنفيذية والنداء الختامي لإرساء العدالة التنافسية
                    </h3>
                    <p className="text-[#4a3963] text-xs mt-1">
                      نص مكتوب يواكب التسجيل الصوتي للخلاصة والنداء الختامي بهدوء ووضوح تام
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap no-print">
                  <button
                    type="button"
                    onClick={() => playExecutiveAppeal(0, null, 'exec-appeal-full', false)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                      isExecAppealPlaying && activeAudioId === 'exec-appeal-full'
                        ? 'bg-[#2b124c] text-[#e7cb82] border-2 border-[#e7cb82]'
                        : 'gold-metallic-card hover:brightness-105'
                    }`}
                  >
                    {isExecAppealPlaying && activeAudioId === 'exec-appeal-full' ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>إيقاف مؤقت ({formatTime(execAppealTime)})</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>تشغيل الخلاصة والنداء الختامي (03:46)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (executiveAppealAudioRef.current) {
                        executiveAppealAudioRef.current.currentTime = 0;
                        setExecAppealTime(0);
                      }
                      playExecutiveAppeal(0, null, 'exec-appeal-full', false);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#c9a452] text-[#f3dfa6] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#e7cb82]" />
                    <span>من البداية</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 royal-purple-box rounded-2xl p-5 sm:p-6 border-2 border-[#e7cb82] shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#c9a452]/40">
                  <div className="flex items-center gap-2">
                    <span className="gold-metallic-card text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-[#2b124c]" />
                      <span>
                        {isExecAppealPlaying ? 'يتلو الآن مع الصوت' : 'المشغل الصوتي المتزامن'}
                      </span>
                    </span>
                    <span className="text-xs font-extrabold text-[#f3dfa6]">
                      {activeExecPillar.title}
                    </span>
                  </div>

                  <span className="font-mono text-xs font-black text-[#e7cb82] bg-black/40 px-3 py-1 rounded-lg border border-[#c9a452]/50 tabular-nums">
                    {formatTime(execAppealTime)} / {formatTime(execAppealDuration)}
                  </span>
                </div>

                <div className="mt-4 space-y-2 no-print">
                  <input
                    type="range"
                    min={0}
                    max={execAppealDuration || 226.5}
                    step={0.1}
                    value={execAppealTime}
                    onChange={(e) => {
                      const nextTime = parseFloat(e.target.value);
                      setExecAppealTime(nextTime);
                      if (executiveAppealAudioRef.current) {
                        executiveAppealAudioRef.current.currentTime = nextTime;
                      }
                    }}
                    className="w-full accent-[#e7cb82] cursor-pointer h-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {EXECUTIVE_APPEAL_PILLARS.map((pillar) => {
                  const isPillarActive =
                    isExecAppealPlaying &&
                    execAppealTime >= pillar.start &&
                    execAppealTime < pillar.end;
                  const isSinglePillarPlaying =
                    isExecAppealPlaying && activeAudioId === pillar.id;

                  return (
                    <div
                      key={pillar.id}
                      id={`exec-${pillar.id}`}
                      className={`rounded-2xl border p-5 sm:p-6 transition-colors bg-[#1f0b38]/85 text-white ${
                        isPillarActive
                          ? 'border-[#e7cb82] shadow-lg'
                          : 'border-[#c9a452]/75'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#c9a452]/35">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 tabular-nums ${
                              isPillarActive
                                ? 'gold-metallic-card'
                                : 'royal-purple-box text-[#e7cb82]'
                            }`}
                          >
                            {pillar.numberLabel}
                          </div>
                          <div>
                            <span className="text-[11px] font-extrabold block text-[#e7cb82]">
                              {pillar.badge}
                            </span>
                            <h4 className="text-base sm:text-lg font-black mt-0.5 text-[#f3dfa6]">
                              {pillar.title}
                            </h4>
                            <p className="text-xs mt-0.5 text-[#e8dff5]">
                              {pillar.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 no-print">
                          <button
                            type="button"
                            onClick={() =>
                              playExecutiveAppeal(
                                pillar.start,
                                pillar.end,
                                pillar.id,
                                false
                              )
                            }
                            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
                              isSinglePillarPlaying || isPillarActive
                                ? 'gold-metallic-card shadow-md'
                                : 'bg-[#2b124c] hover:bg-[#3d1b6a] text-[#e7cb82] border border-[#c9a452]'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>استماع لهذا المحور ({pillar.timeRange})</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        {pillar.sentences
                          .filter((sent) => sent.text.trim().length > 0)
                          .map((sent) => {
                            const isSentenceSpeaking =
                              isExecAppealPlaying &&
                              execAppealTime >= sent.start &&
                              execAppealTime < sent.end;

                            return (
                              <div
                                key={sent.id}
                                id={`exec-sentence-${sent.id}`}
                                onClick={() =>
                                  playExecutiveAppeal(
                                    sent.start,
                                    null,
                                    'exec-appeal-full',
                                    false
                                  )
                                }
                                className={`rounded-xl p-3.5 transition-colors cursor-pointer border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                  isSentenceSpeaking
                                    ? 'bg-[#2b124c] border-[#e7cb82] text-[#fff2c6] shadow-md'
                                    : 'bg-[#1a0833]/55 border-[#c9a452]/35 text-[#f8f3e6] hover:border-[#c9a452]'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <Volume2 className="w-4 h-4 shrink-0 mt-1 text-[#e7cb82]" />
                                  <p
                                    className={`text-xs sm:text-sm leading-[1.9] ${
                                      sent.isHeader ? 'font-black' : 'font-semibold'
                                    }`}
                                  >
                                    {sent.text}
                                  </p>
                                </div>

                                <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 self-end sm:self-center tabular-nums bg-black/35 text-[#e7cb82] border border-[#c9a452]/40">
                                  {sent.timeLabel}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                id="section-06"
                className="mt-6 royal-purple-box rounded-3xl p-7 sm:p-10 text-center shadow-2xl"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full p-1 bg-gradient-to-b from-[#fff2c6] via-[#c9a452] to-[#8f6718] shadow-lg">
                  <img
                    src={CORPORATE_SEAL_LOGO}
                    alt="شعار شركة بن كليلة العامري للتجارة والاستثمار"
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                </div>

                <p className="text-white font-black text-base sm:text-xl md:text-2xl leading-[1.65] max-w-2xl mx-auto">
                  «يُقدم هذا الملف إلى مركز حماية المنافسة ومنع الاحتكار، ويأتي في إطار حرص المستثمر
                  الوطني على حماية الصادرات العُمانية غير النفطية،
                  <span className="block gold-glow-text mt-1.5">
                    ودعم مستهدفات رؤية عُمان 2040».
                  </span>
                </p>

                <div className="w-40 h-0.5 bg-[#c9a452]/50 mx-auto my-5" />

                <p className="text-[#f3dfa6] font-extrabold text-xs sm:text-sm">
                  شركة بن كليلة العامري للتجارة والاستثمار (س.ت: 1111061) - صلالة، سلطنة عُمان
                </p>
                <p className="text-[#e8dff5] text-xs mt-1 font-semibold">
                  ملف المراجع: الفاضل خالد المسروري | مدير عام مركز حماية المنافسة ومنع الاحتكار
                </p>
              </div>

              {renderRecordingVerbatimBox('section6')}
            </section>

            {/* 5. APPROVED OFFICIAL EVIDENCE, DOCUMENTS, VIDEOS & PRESENTATIONS LIBRARY WITH UNRESTRICTED UPLOAD */}
            <section className="bg-[#faf7f0] rounded-3xl shadow-md border-2 border-[#c9a452] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#dccaa3]">
                <div>
                  <span className="text-[#9c7625] text-xs font-extrabold block">
                    الأدلة والمرفقات الرسمية والعروض التقديمية | ملف المراجع: الفاضل خالد المسروري
                  </span>
                  <h3 className="text-[#2b124c] text-lg sm:text-xl font-black mt-0.5">
                    مكتبة الأدلة والمرفقات الرسمية الشاملة (PDF + فيديوهات MP4 + صور + عروض تقديمية)
                  </h3>
                  <p className="text-[#4a3963] text-xs mt-1">
                    تقبل الأداة رفع واستعراض كافة الصيغ مباشرة (ملفات PDF، فيديوهات قصيرة MP4، صور، وعروض تقديمية) وإدراجها كأدلة ومرفقات رسمية معتمدة داخل العرض
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.pptx,.ppt,.doc,.docx,application/pdf,video/*,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="gold-metallic-card hover:brightness-105 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-[#2b124c]" />
                    <span>رفع أدلة ومرفقات (PDF / فيديو / صور / عروض)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUploadPanel((prev) => !prev)}
                    className="royal-purple-box hover:brightness-110 text-[#e7cb82] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#e7cb82]" />
                    <span>
                      {showUploadPanel ? 'إغلاق خيارات التصنيف' : 'تخصيص بيانات المرفق'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Direct Drag & Drop Multi-Format Bar */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  processUploadedFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-5 border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer transition-all no-print ${
                  isDraggingOver
                    ? 'border-[#2b124c] bg-[#e7cb82]/30'
                    : 'border-[#c9a452] bg-[#f3ede0]/80 hover:bg-[#f3ede0]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl royal-purple-box text-[#e7cb82] flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#2b124c]">
                      أداة رفع الأدلة والمرفقات المباشرة: اسحب ملفات PDF أو فيديوهات MP4 أو الصور أو العروض التقديمية هنا
                    </h4>
                    <p className="text-[11px] text-[#4a3963] mt-0.5">
                      يتم قبول واستعراض جميع الصيغ مباشرة كأدلة رسمية في العرض دون أي قيود أو اشتراط تحويلها إلى تسجيل صوتي
                    </p>
                  </div>
                </div>
                <span className="gold-metallic-card text-[11px] font-black px-3.5 py-2 rounded-xl shrink-0">
                  اختيار ملفات (PDF / MP4 / صور / عروض)
                </span>
              </div>

              {/* Optional Expandable Custom Metadata Panel */}
              {showUploadPanel && (
                <div className="mt-4 p-5 rounded-2xl bg-[#f3ede0] border-2 border-[#c9a452] space-y-4 no-print">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-[#2b124c]">
                      بيانات إضافية اختيارية قبل رفع الدليل أو المرفق الرسمي
                    </h4>
                    <span className="text-[11px] font-bold text-[#8c671d]">
                      يدعم: PDF، MP4، MOV، JPG، PNG، PPTX، DOCX (حتى {MAX_FILE_SIZE_MB} ميجابايت)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-[#2b124c] mb-1">
                        عنوان الدليل / المرفق / العرض (اختياري)
                      </label>
                      <input
                        type="text"
                        value={customPdfTitle}
                        onChange={(e) => setCustomPdfTitle(e.target.value)}
                        placeholder="يُؤخذ اسم الملف تلقائياً إن تُرك فارغاً"
                        className="w-full bg-white border border-[#c9a452] rounded-xl px-3 py-2 text-xs text-[#23113d] focus:outline-none focus:border-[#2b124c]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-[#2b124c] mb-1">
                        تصنيف الدليل أو الوثيقة
                      </label>
                      <select
                        value={customPdfBadge}
                        onChange={(e) => setCustomPdfBadge(e.target.value)}
                        className="w-full bg-white border border-[#c9a452] rounded-xl px-3 py-2 text-xs font-bold text-[#23113d] focus:outline-none focus:border-[#2b124c]"
                      >
                        <option value="دليل ومرفق رسمي معتمد">دليل ومرفق رسمي معتمد</option>
                        <option value="دليل مرئي وميداني (MP4)">دليل مرئي وميداني (MP4)</option>
                        <option value="مستند PDF رسمي معتمد">مستند PDF رسمي معتمد</option>
                        <option value="عرض تقديمي شامل">عرض تقديمي شامل</option>
                        <option value="مذكرة رقابية">مذكرة رقابية</option>
                        <option value="مصفوفة أدلة ومرفقات">مصفوفة أدلة ومرفقات</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-[#2b124c] mb-1">
                        وصف مختصر للمرفق (اختياري)
                      </label>
                      <input
                        type="text"
                        value={customPdfDesc}
                        onChange={(e) => setCustomPdfDesc(e.target.value)}
                        placeholder="وصف موجز أو يترك للنظام لاستخلاصه تلقائياً..."
                        className="w-full bg-white border border-[#c9a452] rounded-xl px-3 py-2 text-xs text-[#23113d] focus:outline-none focus:border-[#2b124c]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                {documents.map((doc, docIdx) => {
                  const isDocAudioPlaying = activeAudioId === doc.id;
                  const isUploaded = Boolean(doc.fileUrl);
                  const hasStudioAudio =
                    typeof doc.startTime === 'number' &&
                    typeof doc.endTime === 'number';
                  const docScale = typeof doc.scale === 'number' ? doc.scale : 100;
                  const docPosY = typeof doc.posY === 'number' ? doc.posY : 50;
                  const docFit = doc.fitMode || 'cover';
                  const docHeight = doc.heightMode || 'md';
                  const docWidth = doc.widthMode || 'normal';
                  const hasUploadedMedia =
                    Boolean(doc.fileUrl) && (doc.mediaType === 'video' || doc.mediaType === 'image');
                  const visualUrl = doc.fileUrl || doc.previewUrl || '';
                  const isVisualImage =
                    doc.mediaType === 'image' ||
                    /\.(jpg|jpeg|png|webp|gif)$/i.test(visualUrl || '');

                  return (
                    <div
                      key={doc.id}
                      style={{ animationDelay: `${Math.min(docIdx * 70, 350)}ms` }}
                      className={`evidence-doc-fade-in bg-[#f3ede0] border-2 border-[#c9a452] rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-500 ${
                        docWidth === 'full' || docHeight === 'xl'
                          ? 'sm:col-span-2 lg:col-span-3'
                          : docWidth === 'wide' || docHeight === 'lg'
                          ? 'sm:col-span-2'
                          : ''
                      }`}
                    >
                      <div>
                        {/* Official Document Preview Header (or Uploaded Media Frame if user uploaded a video/image) */}
                        <div
                          onClick={() => {
                            if (hasUploadedMedia) {
                              setIsOpeningAutoMuted(false);
                              setIsModalFullscreen(true);
                              setModalFitMode('contain');
                              setModalZoomScale(100);
                              setActiveModalVideo({
                                id: doc.id,
                                url: visualUrl,
                                title: doc.title,
                                subtitle: doc.description,
                                badge: doc.badge,
                                durationLabel: isVisualImage ? 'صورة مرفقة' : 'فيديو دليل رسمي',
                                hasAudio: true,
                                mediaType: isVisualImage ? 'image' : 'video',
                              });
                              return;
                            }
                            setSelectedDoc(doc);
                            setCurrentSlideIndex(0);
                          }}
                          title="اضغط لاستعراض الوثيقة الرسمية والشرائح المعتمدة"
                          className={`relative bg-gradient-to-br from-[#2b124c] via-[#1f0b38] to-[#140526] overflow-hidden cursor-pointer ${
                            docHeight === 'sm'
                              ? 'h-40'
                              : docHeight === 'md'
                              ? 'h-48'
                              : docHeight === 'lg'
                              ? 'h-64'
                              : 'h-80'
                          }`}
                        >
                          {hasUploadedMedia ? (
                            isVisualImage ? (
                              <img
                                src={visualUrl}
                                alt={doc.title}
                                style={{
                                  objectPosition: `50% ${docPosY}%`,
                                  transform: `scale(${docScale / 100})`,
                                }}
                                className={`w-full h-full transition-transform duration-200 ${
                                  docFit === 'contain' ? 'object-contain' : 'object-cover'
                                }`}
                              />
                            ) : (
                              <SmoothVideo
                                src={visualUrl}
                                fallbackIndex={docIdx}
                                style={{
                                  objectPosition: `50% ${docPosY}%`,
                                  transform: `scale(${docScale / 100})`,
                                }}
                                className={`w-full h-full opacity-95 transition-transform duration-200 ${
                                  docFit === 'contain' ? 'object-contain' : 'object-cover'
                                }`}
                              />
                            )
                          ) : (
                            <div className="w-full h-full p-5 flex flex-col justify-between relative">
                              <div className="flex items-center justify-between gap-2">
                                <span className="gold-metallic-card text-[10px] font-black px-2.5 py-0.5 rounded flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-[#2b124c]" />
                                  <span>{doc.badge}</span>
                                </span>
                                <span className="bg-black/60 text-[#e7cb82] border border-[#c9a452] text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>استعراض الوثيقة ({doc.pages?.length || 1} صفحات)</span>
                                </span>
                              </div>

                              <div className="my-auto text-center space-y-1.5">
                                <div className="w-11 h-11 mx-auto rounded-full p-0.5 bg-gradient-to-b from-[#fff2c6] via-[#c9a452] to-[#8f6718]">
                                  <img
                                    src={CORPORATE_SEAL_LOGO}
                                    alt="شعار الشركة"
                                    className="w-full h-full rounded-full object-cover bg-white"
                                  />
                                </div>
                                <div className="text-xs font-black text-[#fff2c6] line-clamp-1">
                                  {doc.pages?.[0]?.title || doc.title}
                                </div>
                                <div className="text-[10px] font-mono font-bold text-[#e7cb82]">
                                  {doc.pages?.[0]?.referenceCode || 'OFFICIAL-DOC-2026'}
                                </div>
                              </div>

                              <div className="text-[10px] font-bold text-[#f3dfa6] text-center bg-black/35 py-1 rounded-lg border border-[#c9a452]/40">
                                اضغط لفتح واستعراض صفحات الوثيقة الرسمية كاملة
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-4 pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-[#2b124c] font-black text-xs sm:text-sm leading-snug">
                              {doc.title}
                            </h4>
                            {doc.isProcessing && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2b124c] bg-[#e7cb82]/40 px-2 py-0.5 rounded shrink-0">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>معالجة...</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[#4a3963] text-[11px] leading-relaxed mt-1.5 line-clamp-2">
                            {doc.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 pt-2 space-y-2 no-print">
                        {/* Primary Row: Open Official Document / Media */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (hasUploadedMedia) {
                                setIsOpeningAutoMuted(false);
                                setIsModalFullscreen(true);
                                setModalFitMode('contain');
                                setModalZoomScale(100);
                                setActiveModalVideo({
                                  id: doc.id,
                                  url: visualUrl,
                                  title: doc.title,
                                  subtitle: doc.description,
                                  badge: doc.badge,
                                  durationLabel: isVisualImage ? 'صورة مرفقة' : 'فيديو دليل رسمي',
                                  hasAudio: true,
                                  mediaType: isVisualImage ? 'image' : 'video',
                                });
                                return;
                              }
                              setSelectedDoc(doc);
                              setCurrentSlideIndex(0);
                            }}
                            className="flex-1 gold-metallic-card font-black text-[11px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>
                              {hasUploadedMedia
                                ? 'تكبير ملء الشاشة'
                                : `فتح واستعراض الوثيقة (${doc.pages?.length || 1} شرائح)`}
                            </span>
                          </button>

                          {showStudioControls && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleInstantCycleDocument(doc.id, false)}
                                title="تبديل الفيديو فوراً للمشهد التالي بضغطة واحدة"
                                className="px-2.5 py-2 rounded-xl bg-[#381960] hover:bg-[#49217a] border border-[#c9a452] text-[#f3dfa6] text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <RefreshCw className="w-3 h-3 text-[#e7cb82]" />
                                <span>تبديل فوري</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleInstantCycleDocument(doc.id, true)}
                                title="تغيير الفيديو أو استبداله من الاستوديو أو الجهاز"
                                className="px-2.5 py-2 rounded-xl bg-[#2b124c] hover:bg-[#3d1b6a] text-[#e7cb82] border border-[#c9a452] text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Upload className="w-3 h-3" />
                                <span>تغيير الفيديو</span>
                              </button>
                            </>
                          )}

                          {hasStudioAudio && (
                            <button
                              type="button"
                              onClick={() =>
                                playElevenLabsSegment(
                                  doc.id,
                                  doc.startTime!,
                                  doc.endTime!,
                                  null,
                                  false
                                )
                              }
                              title="استماع للمحور المرتبط بالوثيقة"
                              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                isDocAudioPlaying
                                  ? 'gold-metallic-card'
                                  : 'bg-[#2b124c] text-[#e7cb82] border-[#c9a452]'
                              }`}
                            >
                              {isDocAudioPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Screen Size, Width, Height, Zoom +/-, Fit/Contain & Vertical Position Controls (Hidden when showStudioControls is false) */}
                        {showStudioControls && (
                          <div className="pt-1.5 border-t border-[#c9a452]/30 flex flex-wrap items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => updateDocumentSizing(doc.id, { deltaScale: 15 })}
                              title="تكبير حجم الفيديو داخل الإطار (+)"
                              className="px-2 py-1 rounded-lg bg-[#2b124c] text-[#f3dfa6] border border-[#c9a452]/60 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <ZoomIn className="w-3 h-3 text-[#e7cb82]" />
                              <span>+</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateDocumentSizing(doc.id, { deltaScale: -15 })}
                              title="تصغير حجم الفيديو داخل الإطار (-)"
                              className="px-2 py-1 rounded-lg bg-[#2b124c] text-[#f3dfa6] border border-[#c9a452]/60 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <ZoomOut className="w-3 h-3 text-[#e7cb82]" />
                              <span>-</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateDocumentSizing(doc.id, {
                                  widthMode:
                                    docWidth === 'normal'
                                      ? 'wide'
                                      : docWidth === 'wide'
                                      ? 'full'
                                      : 'normal',
                                })
                              }
                              title="تغيير عرض الشاشة للبطاقة (عادي / عريض / كامل العرض)"
                              className="px-2 py-1 rounded-lg bg-[#2b124c] text-[#e7cb82] border border-[#c9a452]/60 text-[10px] font-bold cursor-pointer"
                            >
                              العرض: {docWidth === 'normal' ? 'عادي' : docWidth === 'wide' ? 'عريض' : 'كامل الشاشة'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateDocumentSizing(doc.id, {
                                  heightMode:
                                    docHeight === 'sm'
                                      ? 'md'
                                      : docHeight === 'md'
                                      ? 'lg'
                                      : docHeight === 'lg'
                                      ? 'xl'
                                      : 'sm',
                                })
                              }
                              title="تغيير ارتفاع شاشة الفيديو"
                              className="px-2 py-1 rounded-lg bg-[#2b124c] text-[#f3dfa6] border border-[#c9a452]/60 text-[10px] font-bold cursor-pointer"
                            >
                              الارتفاع: {docHeight === 'sm' ? 'صغير' : docHeight === 'md' ? 'وسط' : docHeight === 'lg' ? 'كبير' : 'عملاق'}
                            </button>

                            <button
                              type="button"
                              onClick={() => updateDocumentSizing(doc.id, { toggleFit: true })}
                              className="px-2 py-1 rounded-lg bg-[#2b124c] text-[#f3dfa6] border border-[#c9a452]/60 text-[10px] font-bold cursor-pointer"
                            >
                              {docFit === 'contain' ? 'ملء' : 'احتواء'}
                            </button>

                            <button
                              type="button"
                              onClick={() => updateDocumentSizing(doc.id, { deltaY: -12 })}
                              title="تحريك للأعلى"
                              className="px-1.5 py-1 rounded-lg bg-[#2b124c] text-[#f3dfa6] border border-[#c9a452]/60 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3 text-[#e7cb82]" />
                              <span>فوق</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateDocumentSizing(doc.id, { deltaY: 12 })}
                              title="تحريك للأسفل"
                              className="px-1.5 py-1 rounded-lg bg-[#2b124c] text-[#f3dfa6] border border-[#c9a452]/60 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3 text-[#e7cb82]" />
                              <span>تحت</span>
                            </button>

                            {documents.length > 1 && isUploaded && (
                              <button
                                type="button"
                                onClick={() => handleRemoveUploadedDoc(doc.id, doc.title)}
                                title="حذف البطاقة"
                                className="px-1.5 py-1 rounded-lg bg-[#2b124c] text-[#f3dfa6] border border-[#c9a452]/60 text-[10px] font-bold cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 6. SMART REGULATORY ADVISOR & INTERACTIVE LEGAL ASSISTANT */}
            <section className="bg-[#faf7f0] rounded-3xl shadow-md border-2 border-[#c9a452] p-6 sm:p-8 no-print">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#dccaa3]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl royal-purple-box text-[#e7cb82] flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[#2b124c] font-black text-base sm:text-lg">
                      المستشار الرقابي الذكي والمساعد القانوني التفاعلي
                    </h3>
                    <p className="text-[#8c671d] text-xs font-bold mt-0.5">
                      ملف المراجع: الفاضل خالد المسروري | شركة بن كليلة العامري للتجارة والاستثمار
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const latestAssistant = [...messages]
                        .reverse()
                        .find((m) => m.role === 'assistant');
                      if (latestAssistant) {
                        playDynamicTextAudio(
                          `chat-${latestAssistant.id}`,
                          latestAssistant.text,
                          latestAssistant.id === 'welcome-msg' ? 'welcome-msg' : undefined
                        );
                      }
                    }}
                    className="gold-metallic-card text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#2b124c]" />
                    <span>استماع للرد الصوتي للمستشار</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopAllAudio();
                      setMessages([INITIAL_WELCOME_MESSAGE]);
                    }}
                    className="bg-[#f3ede0] hover:bg-[#e6decb] border border-[#c9a452] text-[#2b124c] text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    مسح المحادثة
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 pb-4 border-b border-[#dccaa3]">
                <span className="text-[#8c671d] text-xs font-extrabold ml-1">
                  استفسارات سريعة للعرض (تعمل بالرد الصوتي الفوري والكتابة):
                </span>
                {QUICK_QUESTIONS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => askAdvisor(item.question)}
                    disabled={isAdvisorLoading}
                    className="bg-[#f3ede0] hover:bg-[#2b124c] hover:text-[#e7cb82] border border-[#c9a452] text-[#2b124c] text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Volume2 className="w-3 h-3 text-[#9c7625] shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div
                ref={chatContainerRef}
                className="min-h-[260px] max-h-[420px] overflow-y-auto py-5 space-y-4 px-1"
              >
                {messages.map((msg) => {
                  const isAssistant = msg.role === 'assistant';
                  const msgAudioId = `chat-${msg.id}`;
                  const isPlayingThisMsg = activeAudioId === msgAudioId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                          isAssistant
                            ? 'bg-[#f3ede0] border-2 border-[#c9a452] text-[#23113d]'
                            : 'royal-purple-box text-white'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.text}</div>

                        {isAssistant && (
                          <div className="mt-3 pt-2 border-t border-[#d8c59e] flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                playDynamicTextAudio(
                                  msgAudioId,
                                  msg.text,
                                  msg.id === 'welcome-msg' ? 'welcome-msg' : undefined
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                                isPlayingThisMsg
                                  ? 'bg-[#2b124c] text-[#e7cb82] border border-[#c9a452]'
                                  : 'gold-metallic-card'
                              }`}
                            >
                              {isLoadingAudio === msgAudioId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isPlayingThisMsg ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {isPlayingThisMsg ? 'إيقاف الرد الصوتي' : 'استماع للإجابة بالصوت الواضح'}
                              </span>
                            </button>
                            <span className="text-[10px] text-[#8c671d] font-bold">
                              {msg.timestamp}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isAdvisorLoading && (
                  <div className="flex items-start">
                    <div className="bg-[#f3ede0] border border-[#c9a452] rounded-2xl px-4 py-3 text-xs text-[#2b124c] font-bold flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#9c7625]" />
                      <span>يقوم المستشار الرقابي بتحليل الوقائع وتأصيل النصوص القانونية...</span>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  askAdvisor(inputQuestion);
                }}
                className="mt-3 pt-4 border-t border-[#dccaa3] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="اكتب سؤالك أو استفسارك القانوني للمستشار الرقابي هنا..."
                  className="flex-1 bg-white border-2 border-[#d8c59e] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#23113d] placeholder:text-[#8c7b9e] focus:outline-none focus:border-[#2b124c] transition-colors"
                />

                <button
                  type="button"
                  onClick={toggleMicInput}
                  title="إدخال صوتي للسؤال"
                  className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isListeningMic
                      ? 'gold-metallic-card'
                      : 'bg-[#f3ede0] hover:bg-[#e6decb] border-[#c9a452] text-[#2b124c]'
                  }`}
                >
                  {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isAdvisorLoading}
                  className="royal-purple-box hover:brightness-110 disabled:opacity-50 text-[#e7cb82] font-black text-xs px-5 py-3.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <span>إرسال</span>
                  <Send className="w-3.5 h-3.5 rotate-180" />
                </button>
              </form>
            </section>

            {/* BOTTOM SECTION ONLY: OFFICIAL WHATSAPP CONVERSATION EVIDENCE VIDEOS (1 TO 7) */}
            <section
              id="section-conversation-evidence"
              className="bg-[#faf7f0] rounded-3xl shadow-md border-2 border-[#c9a452] p-6 sm:p-8 no-print"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#dccaa3]">
                <div>
                  <span className="text-[#9c7625] text-xs font-extrabold block">
                    القسم السفلي المخصص لتوثيق المحادثات | شركة بن كليلة العامري للتجارة والاستثمار
                  </span>
                  <h3 className="text-[#2b124c] text-lg sm:text-xl font-black mt-0.5">
                    دلائل محادثات الواتساب الموثقة بالصوت والصورة (من الدليل 1 إلى الدليل 7 — أسفل الصفحة)
                  </h3>
                  <p className="text-[#4a3963] text-xs mt-1">
                    جميع فيديوهات دلائل المحادثات معروضة في القسم السفلي بالترتيب وتعمل بالصوت الواضح مع إمكانية تكبير الشاشة الكاملة
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const firstVid = fieldVideos[0];
                      if (!firstVid) return;
                      stopAllAudio();
                      const firstEl = evidenceVideoRefs.current[firstVid.id];
                      if (firstEl) {
                        firstEl.muted = false;
                        firstEl.currentTime = 0;
                        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        firstEl.play().catch(() => {});
                      }
                    }}
                    className="gold-metallic-card px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Volume2 className="w-4 h-4 text-[#2b124c]" />
                    <span>تشغيل دلائل المحادثات بالترتيب (1 ← 7)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {fieldVideos.map((vid, idx) => {
                  const vidScale = typeof vid.scale === 'number' ? vid.scale : 100;
                  const vidPosY = typeof vid.posY === 'number' ? vid.posY : 50;
                  const isImageCard = vid.mediaType === 'image';
                  const posterSrc =
                    vid.posterUrl || `/assets/aistudio/poster-conv-${(idx % 7) + 1}.jpg`;

                  return (
                    <div
                      key={vid.id}
                      id={`evidence-card-${vid.id}`}
                      className="rounded-2xl border-2 border-[#c9a452] bg-[#f3ede0] text-[#23113d] overflow-hidden flex flex-col justify-between shadow-md"
                    >
                      <div>
                        <div className="bg-[#2b124c] text-white px-4 py-2.5 flex items-center justify-between gap-2 border-b border-[#c9a452]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="gold-metallic-card text-[11px] font-black px-2.5 py-0.5 rounded-lg shrink-0">
                              دلائل المحادثات ({idx + 1})
                            </span>
                            <span className="text-[11px] font-bold text-[#e7cb82] truncate">
                              {vid.badge || `دليل رسمي رقم (${idx + 1})`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              stopAllAudio();
                              setIsOpeningAutoMuted(false);
                              setIsModalFullscreen(true);
                              setModalFitMode('contain');
                              setModalZoomScale(100);
                              setActiveModalVideo({
                                ...vid,
                                hasAudio: true,
                              });
                            }}
                            className="gold-metallic-card text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>تكبير كامل</span>
                          </button>
                        </div>

                        <div className="relative bg-[#140526] overflow-hidden">
                          {isImageCard ? (
                            <img
                              src={vid.url}
                              alt={vid.title}
                              style={{
                                objectPosition: `50% ${vidPosY}%`,
                                transform: `scale(${vidScale / 100})`,
                              }}
                              className="w-full h-64 sm:h-72 object-contain bg-black"
                            />
                          ) : (
                            <video
                              ref={(el) => {
                                evidenceVideoRefs.current[vid.id] = el;
                              }}
                              key={vid.url}
                              src={vid.url}
                              poster={posterSrc}
                              controls
                              playsInline
                              preload="metadata"
                              onPlay={(e) => {
                                const currentVideo = e.currentTarget;
                                currentVideo.muted = false;
                                stopAllAudio();
                                pauseAllEvidenceVideos(vid.id);
                                setPlayingEvidenceId(vid.id);
                                if (
                                  openingHeroVideoRef.current &&
                                  !openingHeroVideoRef.current.paused
                                ) {
                                  openingHeroVideoRef.current.pause();
                                  setIsOpeningVideoPlayingHero(false);
                                }
                              }}
                              onPause={() => {
                                if (playingEvidenceId === vid.id) {
                                  setPlayingEvidenceId(null);
                                }
                              }}
                              onEnded={() => {
                                setPlayingEvidenceId(null);
                                const nextVid = fieldVideos[idx + 1];
                                if (nextVid) {
                                  const nextEl = evidenceVideoRefs.current[nextVid.id];
                                  if (nextEl) {
                                    nextEl.muted = false;
                                    nextEl.currentTime = 0;
                                    nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    nextEl.play().catch(() => {});
                                  }
                                }
                              }}
                              className="w-full h-64 sm:h-80 object-contain bg-black"
                            />
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#2b124c] bg-[#e7cb82]/40 border border-[#c9a452] px-2 py-0.5 rounded-md">
                              <Volume2 className="w-3 h-3 text-[#2b124c]" />
                              <span>دليل صوتي ومرئي · {vid.durationLabel}</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#7c5b14]">
                              ترتيب الدليل: #{idx + 1} من {fieldVideos.length}
                            </span>
                          </div>
                          <h4 className="font-black text-sm text-[#2b124c] leading-snug">
                            {vid.title}
                          </h4>
                          <p className="text-xs text-[#4a3963] mt-1 leading-relaxed">
                            {vid.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const el = evidenceVideoRefs.current[vid.id];
                              if (el) {
                                if (el.paused) {
                                  stopAllAudio();
                                  pauseAllEvidenceVideos(vid.id);
                                  el.muted = false;
                                  el.play().catch(() => {});
                                } else {
                                  el.pause();
                                }
                              }
                            }}
                            className="flex-1 bg-[#2b124c] hover:bg-[#3d1b6a] text-[#e7cb82] border border-[#c9a452] text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>تشغيل / إيقاف بالصوت الواضح</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              replacingVideoIdRef.current = vid.id;
                              setReplacingVideoId(vid.id);
                              setStudioPickerTarget({
                                type: 'field-video',
                                id: vid.id,
                                title: `تغيير الفيديو / الصورة — ${vid.badge || `دلائل المحادثات (${idx + 1})`}`,
                              });
                            }}
                            className="flex-1 gold-metallic-card text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>تغيير الفيديو / الصورة</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </main>

          {/* 7. FOOTER */}
          <footer className="mt-12 pb-24 royal-purple-box border-t-4 border-[#c9a452] py-10 text-center relative z-10">
            <div className="max-w-4xl mx-auto px-4 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full p-0.5 bg-gradient-to-b from-[#fff2c6] via-[#c9a452] to-[#8f6718] shadow-md">
                <img
                  src={CORPORATE_SEAL_LOGO}
                  alt="شعار شركة بن كليلة العامري للتجارة والاستثمار"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <p className="text-[#f3dfa6] font-black text-sm">
                شركة بن كليلة العامري للتجارة والاستثمار — ملف المتابعة الرقابية المعتمد 2026م
              </p>
              <p className="text-white text-xs font-bold">
                ملف المراجع: الفاضل خالد المسروري | تحديات التنويع الاقتصادي: عوائق أمام الصادرات غير
                النفطية في مسار رؤية عُمان 2040
              </p>
              <p className="text-[#e8dff5]/80 text-[11px] leading-relaxed">
                جميع الوقائع والمستندات والتواريخ مسجلة رسمياً بموجب الأرقام المرجعية المعتمدة لدى
                وزارة التجارة والصناعة وترويج الاستثمار، ومركز حماية المنافسة ومنع الاحتكار، ونظام
                وزارة التغير المناخي والبيئة بدولة الإمارات.
              </p>
            </div>
          </footer>
        </>
      )}

      {/* 8. INTERACTIVE MULTI-FORMAT DOCUMENT / VIDEO / IMAGE / SLIDE VIEWER MODAL */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 bg-[#18082c]/80 backdrop-blur-xs flex items-center justify-center p-4 no-print"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-[#faf7f0] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#c9a452] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="royal-purple-box text-white px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-[#e7cb82] text-[11px] font-extrabold block">
                  {selectedDoc.badge}
                </span>
                <h3 className="font-black text-base sm:text-lg mt-0.5">{selectedDoc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!selectedDoc.fileUrl &&
                  typeof selectedDoc.startTime === 'number' &&
                  typeof selectedDoc.endTime === 'number' && (
                    <button
                      type="button"
                      onClick={() =>
                        playElevenLabsSegment(
                          selectedDoc.id,
                          selectedDoc.startTime!,
                          selectedDoc.endTime!,
                          null,
                          false
                        )
                      }
                      className="gold-metallic-card font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>قراءة صوتية</span>
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-milky-canvas">
              {selectedDoc.fileUrl ? (
                <div className="space-y-4">
                  <div className="bg-[#f3ede0] border border-[#c9a452] rounded-xl p-4 text-xs text-[#2b124c] font-bold flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        تم إدراج ومعالجة هذا المرفق الرسمي ({selectedDoc.badge}) مباشرة في النظام
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDoc.mediaType === 'video' && (
                        <button
                          type="button"
                          onClick={() => {
                            setBgVideoUrl(selectedDoc.fileUrl!);
                            setAutoCycleBgScenes(false);
                            showToast(
                              'success',
                              'تم تعيين الفيديو كخلفية للعرض',
                              `تم تعيين «${selectedDoc.title}» كخلفية تفاعلية متحركة لواجهة العرض.`
                            );
                          }}
                          className="royal-purple-box text-[#e7cb82] font-extrabold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          تعيين كخلفية للعرض
                        </button>
                      )}
                      <a
                        href={selectedDoc.fileUrl}
                        download={selectedDoc.title}
                        className="gold-metallic-card font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تنزيل المرفق الرسمي</span>
                      </a>
                    </div>
                  </div>

                  {selectedDoc.mediaType === 'video' ? (
                    <video
                      src={selectedDoc.fileUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full max-h-[520px] rounded-xl border-2 border-[#c9a452] bg-black shadow-inner"
                    />
                  ) : selectedDoc.mediaType === 'image' ? (
                    <div className="rounded-xl border-2 border-[#c9a452] bg-white p-3 flex justify-center">
                      <img
                        src={selectedDoc.fileUrl}
                        alt={selectedDoc.title}
                        className="max-h-[520px] w-auto object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <>
                      {/* Extracted & Indexed Summary/Pages from Direct PDF Processing */}
                      {selectedDoc.pages && selectedDoc.pages.length > 0 && (
                        <div className="bg-[#fffdf9] border-2 border-[#c9a452] rounded-2xl p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-[#9c7625]">
                              الفهرسة والتحليل المباشر للمستند في النظام:
                            </span>
                            {selectedDoc.isProcessing && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2b124c]">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9c7625]" />
                                <span>جاري استخلاص النقاط...</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#2b124c]">
                            {selectedDoc.description}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {selectedDoc.pages.slice(0, 4).map((pg) => (
                              <div
                                key={pg.pageNumber}
                                className="bg-[#f3ede0] border border-[#d8c59e] rounded-xl p-2.5 text-[11px] text-[#23113d]"
                              >
                                <div className="font-black text-[#2b124c]">
                                  {pg.title} {pg.referenceCode ? `(${pg.referenceCode})` : ''}
                                </div>
                                <div className="text-[#4a3963] mt-1 line-clamp-2">
                                  {pg.content.join(' • ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedDoc.mediaType === 'pdf' && (
                        <iframe
                          src={selectedDoc.fileUrl}
                          title={selectedDoc.title}
                          className="w-full h-[500px] rounded-xl border-2 border-[#c9a452] bg-white shadow-inner"
                        />
                      )}
                    </>
                  )}
                </div>
              ) : (
                selectedDoc.pages[currentSlideIndex] && (
                  <div className="bg-[#fffdf9] border-2 border-[#c9a452] rounded-2xl p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#dccaa3]">
                      <div>
                        <span className="text-[#9c7625] text-xs font-extrabold">
                          {selectedDoc.pages[currentSlideIndex].subtitle}
                        </span>
                        <h4 className="text-[#2b124c] font-black text-lg mt-1">
                          {selectedDoc.pages[currentSlideIndex].title}
                        </h4>
                      </div>
                      {selectedDoc.pages[currentSlideIndex].referenceCode && (
                        <span className="bg-[#2b124c] border border-[#c9a452] text-[#e7cb82] font-mono text-xs font-bold px-2.5 py-1 rounded">
                          {selectedDoc.pages[currentSlideIndex].referenceCode}
                        </span>
                      )}
                    </div>

                    <ul className="mt-5 space-y-3.5">
                      {selectedDoc.pages[currentSlideIndex].content.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-[#23113d] text-xs sm:text-sm leading-relaxed bg-[#f3ede0] border border-[#d8c59e] rounded-xl p-3.5"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#2b124c] text-[#e7cb82] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                            {idx + 1}
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>

            {!selectedDoc.fileUrl && (
              <div className="bg-[#f3ede0] border-t border-[#c9a452] px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#c9a452] bg-white text-xs font-bold text-[#2b124c] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>
                  <button
                    type="button"
                    disabled={currentSlideIndex === selectedDoc.pages.length - 1}
                    onClick={() =>
                      setCurrentSlideIndex((i) => Math.min(selectedDoc.pages.length - 1, i + 1))
                    }
                    className="px-3 py-1.5 rounded-lg border border-[#c9a452] bg-white text-xs font-bold text-[#2b124c] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-xs font-extrabold text-[#2b124c]">
                  صفحة {currentSlideIndex + 1} من {selectedDoc.pages.length}
                </span>

                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="royal-purple-box text-[#e7cb82] text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة المذكرة</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. LIVE SYNCHRONIZED TELEPROMPTER & AUDIO BAR (CLEAN ROYAL PURPLE & GOLD) */}
      {viewMode === 'royal' && !activeModalVideo && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-5xl z-40 bg-[#18072c]/95 backdrop-blur-md border-2 border-[#c9a452] rounded-2xl px-4 py-2.5 shadow-2xl text-white no-print">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
              <span className="gold-metallic-card text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-[#2b124c]" />
                <span>
                  {isClarificationPlaying
                    ? `الأسئلة الاستيضاحية (${formatTime(clarificationTime)} / ${formatTime(clarificationDuration)})`
                    : isExecAppealPlaying
                    ? `الخلاصة التنفيذية (${formatTime(execAppealTime)} / ${formatTime(execAppealDuration)})`
                    : activeAudioId
                    ? `التسجيل الصوتي المتزامن (${formatTime(currentTime)} / ${formatTime(duration)})`
                    : 'النص الموثق للتسجيل الصوتي'}
                </span>
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-[#f3dfa6] leading-snug line-clamp-2">
                {activeScriptSegment.text}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() =>
                  playClarificationQuestions(0, null, 'clarification-full', false)
                }
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black border cursor-pointer flex items-center gap-1 transition-colors ${
                  isClarificationPlaying
                    ? 'bg-white text-[#2b124c] border-[#e7cb82]'
                    : 'gold-metallic-card'
                }`}
              >
                {isClarificationPlaying ? (
                  <Pause className="w-3 h-3 fill-current" />
                ) : (
                  <Volume2 className="w-3 h-3 text-[#2b124c]" />
                )}
                <span>{isClarificationPlaying ? 'إيقاف الأسئلة' : 'الأسئلة (06:58)'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  playExecutiveAppeal(0, null, 'exec-appeal-full', false)
                }
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black border cursor-pointer flex items-center gap-1 transition-colors ${
                  isExecAppealPlaying
                    ? 'bg-white text-[#2b124c] border-[#e7cb82]'
                    : 'bg-[#2b124c] border-[#c9a452] text-[#f3dfa6]'
                }`}
              >
                {isExecAppealPlaying ? (
                  <Pause className="w-3 h-3 fill-current" />
                ) : (
                  <Volume2 className="w-3 h-3 text-[#e7cb82]" />
                )}
                <span>{isExecAppealPlaying ? 'إيقاف الخلاصة' : 'الخلاصة (03:46)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSmartAudioTransition((p) => !p)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black border cursor-pointer flex items-center gap-1 transition-colors ${
                  smartAudioTransition
                    ? 'gold-metallic-card'
                    : 'bg-[#2b124c] border-[#c9a452] text-[#f3dfa6]'
                }`}
              >
                <BellRing className="w-3 h-3" />
                <span>تنبيه ذكي: {smartAudioTransition ? 'مفعّل' : 'متوقف'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGradualAutoScroll((p) => !p)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer flex items-center gap-1.5 transition-colors ${
                  isGradualAutoScroll
                    ? 'gold-metallic-card'
                    : 'bg-[#2b124c] hover:bg-[#3d1b6a] border-[#c9a452] text-[#f3dfa6]'
                }`}
              >
                {isGradualAutoScroll ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>تثبيت الشاشة</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-[#e7cb82]" />
                    <span>تحريك الشاشة</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={startFullInteractivePresentation}
                className="bg-[#2b124c] hover:bg-[#3d1b6a] border border-[#c9a452] text-[#f3dfa6] px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3 text-[#e7cb82]" />
                <span>{isFullPresentationPlaying ? 'إيقاف العرض' : 'العرض الشامل'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                title="العودة لأعلى الصفحة"
                className="px-2 py-1.5 rounded-xl bg-[#2b124c] border border-[#c9a452] text-[#f3dfa6] text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
              >
                <ArrowUp className="w-3 h-3 text-[#e7cb82]" />
                <span>لأعلى</span>
              </button>
            </div>
          </div>

          {/* Synchronized Voice + Text + Screen Progress Indicator */}
          <div className="mt-2 w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c9a452] via-[#fff2c6] to-[#e7cb82] transition-all duration-300"
              style={{
                width: `${
                  isClarificationPlaying
                    ? Math.min(100, Math.max(4, (clarificationTime / Math.max(1, clarificationDuration)) * 100))
                    : isExecAppealPlaying
                    ? Math.min(100, Math.max(4, (execAppealTime / Math.max(1, execAppealDuration)) * 100))
                    : activeAudioId
                    ? Math.min(100, Math.max(4, (currentTime / Math.max(1, duration)) * 100))
                    : Math.min(100, Math.max(4, (silentTeleprompterTime / 516.78) * 100))
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
