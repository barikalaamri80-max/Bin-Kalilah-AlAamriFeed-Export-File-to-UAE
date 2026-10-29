import {
  ApprovedAudioRecording,
  APPROVED_AUDIO_RECORDINGS,
  DocumentItem,
  FieldVideoItem,
  TopShowcaseItem,
  FIELD_VIDEOS,
  FLEET_PHOTOS,
  INITIAL_DOCUMENTS,
} from '../data/dossierData';

const STORAGE_KEY_STATE = 'binkalilah_permanent_dossier_state_v4';
const IDB_NAME = 'BinKalilahPermanentMediaDB';
const IDB_STORE = 'media_blobs';

export interface ModificationLogEntry {
  id: string;
  timestamp: string;
  action: 'إضافة' | 'استبدال' | 'حذف' | 'تحديث';
  target: string;
  details: string;
}

export interface PersistedDossierState {
  fieldVideos?: FieldVideoItem[];
  bgVideoUrl?: string;
  openingVideoUrl?: string;
  fleetPhotos?: TopShowcaseItem[];
  documents?: DocumentItem[];
  audioRecordings?: ApprovedAudioRecording[];
  deletedIds?: string[];
  bgCycleIntervalSec?: number;
  customBgUrls?: string[];
  modificationLogs?: ModificationLogEntry[];
  updatedAt: number;
}

// Pool of verified working studio video URLs on disk to heal any stale/broken blob: or missing URLs
const FALLBACK_WORKING_VIDEOS = [
  '/assets/aistudio/lv_0_20261028134636_4e4aa5be.mp4',
  '/assets/aistudio/lv_0_20261028134539_f77457c5.mp4',
  '/assets/aistudio/lv_0_20261028134455_cc14d4e3.mp4',
  '/assets/aistudio/lv_0_20261028134407_7852f706.mp4',
  '/assets/aistudio/lv_0_20261028134258_d3832aa8.mp4',
  '/assets/aistudio/lv_0_20261028133940_fa89726b.mp4',
  '/assets/aistudio/lv_0_20261028133832_1c84c9bf.mp4',
  '/assets/aistudio/lv_0_20261028133542_ab5f6431.mp4',
  '/user_uploads/media_vid_vid-warehouse-capacity.mp4',
  '/user_uploads/media_vid_vid-warehouse-gate.mp4',
  '/user_uploads/media_vid_vid-logistics-hub.mp4',
  '/user_uploads/media_vid_vid-multi-grid.mp4',
  '/assets/aistudio/HnVideoEditor_2025_09_09_152621795_f8064337.mp4',
  '/assets/aistudio/HnVideoEditor_2025_06_11_171749621_e28a6bd4.mp4',
  '/assets/aistudio/HnVideoEditor_2025_06_14_045357615_70101bdb.mp4',
  '/assets/aistudio/HnVideoEditor_2025_06_17_044120386_cdb20068.mp4',
  '/assets/aistudio/HnVideoEditor_2025_06_04_154222028_2314c21f.mp4',
  '/assets/aistudio/1749465951459_62e5fed5.mp4',
  '/assets/aistudio/1749472799812_09a6176a.mp4',
  '/assets/aistudio/VID-20231110-WA0059_1bab390b.mp4',
];

const LEGACY_TRUCK_DOC_IDS = new Set([
  'doc-uploaded-1793037240223-tiw4',
  'doc-uploaded-1793037212289-u8x8',
  'doc-uploaded-1792990920740-s48z',
  'doc-uploaded-1792990845692-i08w',
  'doc-uploaded-1792989262272-vtx6',
  'doc-uploaded-1792983040360-zkwi',
  'doc-uploaded-1792982374573-ymib',
]);

export function sanitizeDisplayText(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/_/g, ' ')
    .replace(/شركتنا\s+ب[أا]نها\s+شرك[ةه]\s+مساهم[ةه]\s+عام[ةه]/g, 'شركة بن كليلة العامري للتجارة والاستثمار')
    .replace(/شرك[ةه]\s+مساهم[ةه]\s+عام[ةه]/g, 'شركة بن كليلة العامري للتجارة والاستثمار')
    .replace(/بساعية\s+الدؤب|بسعية\s+الدؤوب/g, 'بسعيه الدؤوب')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBlobToIndexedDB(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openMediaDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore IDB quota/availability errors gracefully
  }
}

export async function loadBlobUrlFromIndexedDB(key: string): Promise<string> {
  try {
    const db = await openMediaDB();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (blob instanceof Blob && blob.size > 0) {
      return URL.createObjectURL(blob);
    }
    return '';
  } catch {
    return '';
  }
}

function blobSliceToBase64(blobSlice: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blobSlice);
  });
}

/**
 * Permanently persists an uploaded File both to IndexedDB (browser) and to the server (/user_uploads/...)
 * using 3MB chunks so even large 50MB-100MB videos never hit proxy payload limits and get automatically
 * optimized by ffmpeg on the server for smooth, stutter-free playback.
 */
export async function persistUploadedMediaFile(
  file: File,
  mediaKey: string
): Promise<{ permanentUrl: string; idbKey: string }> {
  const idbKey = `media_${mediaKey}`;
  await saveBlobToIndexedDB(idbKey, file);

  try {
    const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB per chunk (safe under any proxy limit)
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

    for (let idx = 0; idx < totalChunks; idx++) {
      const start = idx * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const slice = file.slice(start, end);
      const chunkBase64 = await blobSliceToBase64(slice);

      const chunkRes = await fetch('/api/media/upload-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaKey: idbKey,
          chunkIndex: idx,
          totalChunks,
          chunkBase64,
        }),
      });
      if (!chunkRes.ok) {
        throw new Error(`Chunk ${idx} failed`);
      }
    }

    const completeRes = await fetch('/api/media/upload-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        mediaKey: idbKey,
      }),
    });

    if (completeRes.ok) {
      const data = await completeRes.json();
      if (data.url) {
        return { permanentUrl: data.url, idbKey };
      }
    }
  } catch {
    // Fallback to IndexedDB blob restoration if server upload fails
  }

  const localBlobUrl = URL.createObjectURL(file);
  return { permanentUrl: localBlobUrl, idbKey };
}

function isStaleOrBrokenUrl(url?: string): boolean {
  if (!url) return true;
  if (url.startsWith('blob:')) return true;
  if (
    url === '/user_uploads/media_doc_doc-uploaded-1792983040360-zkwi.mp4' ||
    url === '/user_uploads/media_doc_doc-uploaded-1792982374573-ymib.mp4'
  ) {
    return true;
  }
  return false;
}

export function normalizePersistedState(
  state: PersistedDossierState | null
): PersistedDossierState | null {
  if (!state || typeof state !== 'object') return null;
  const normalized: PersistedDossierState = { ...state };
  const deletedSet = new Set(Array.isArray(normalized.deletedIds) ? normalized.deletedIds : []);

  if (Array.isArray(normalized.fleetPhotos)) {
    const existingUrls = new Set(normalized.fleetPhotos.map((p) => p.url));
    const missingFleetVideos = FLEET_PHOTOS.filter(
      (defItem) => !existingUrls.has(defItem.url) && !deletedSet.has(defItem.url)
    );
    const combinedFleet = [...missingFleetVideos, ...normalized.fleetPhotos].filter(
      (item) => !deletedSet.has(item.url)
    );
    normalized.fleetPhotos = combinedFleet.map((item, idx) => {
      let badge = sanitizeDisplayText(item.badge || '');
      if (badge.includes('16 تريلا') || badge.includes('أسطول')) {
        badge = 'جدول 16 تريلا';
      }
      const title = sanitizeDisplayText(
        (item.title || '').replace('والجاهزة للتصدير', 'ضمن جدول التصدير')
      );
      const url = isStaleOrBrokenUrl(item.url)
        ? FALLBACK_WORKING_VIDEOS[idx % FALLBACK_WORKING_VIDEOS.length]
        : item.url;
      return { ...item, badge, title, url };
    });
  }

  // Preserve user customizations (replacements, additions, and deletions) in fieldVideos
  if (Array.isArray(normalized.fieldVideos)) {
    normalized.fieldVideos = normalized.fieldVideos
      .filter((vid) => vid && !deletedSet.has(vid.id))
      .map((vid, idx) => {
        const defaultMatch = FIELD_VIDEOS.find((d) => d.id === vid.id);
        const fallbackUrl =
          defaultMatch?.url || FALLBACK_WORKING_VIDEOS[idx % FALLBACK_WORKING_VIDEOS.length];
        const healedUrl = isStaleOrBrokenUrl(vid.url) ? fallbackUrl : vid.url;
        return {
          ...vid,
          url: healedUrl,
          title: sanitizeDisplayText(vid.title || defaultMatch?.title || 'فيديو توثيقي ميداني'),
          subtitle: sanitizeDisplayText(vid.subtitle || defaultMatch?.subtitle || ''),
          badge: sanitizeDisplayText(vid.badge || defaultMatch?.badge || `دلائل المحادثات · ${idx + 1}`),
          posterUrl:
            vid.posterUrl && !vid.posterUrl.startsWith('blob:')
              ? vid.posterUrl
              : defaultMatch?.posterUrl,
          hasAudio: vid.hasAudio ?? true,
          fitMode: vid.fitMode || 'contain',
          heightMode: vid.heightMode || 'lg',
        };
      });
  }

  if (Array.isArray(normalized.documents)) {
    const existingDocIds = new Set(normalized.documents.map((d) => d?.id));
    const missingDefaultDocs = INITIAL_DOCUMENTS.filter(
      (defDoc) => !existingDocIds.has(defDoc.id) && !deletedSet.has(defDoc.id)
    );
    const combinedDocs = [...missingDefaultDocs, ...normalized.documents];

    const cleanedDocs = combinedDocs
      .filter((doc) => doc && !LEGACY_TRUCK_DOC_IDS.has(doc.id) && !deletedSet.has(doc.id))
      .map((doc, idx) => {
        const defaultDocMatch = INITIAL_DOCUMENTS.find((d) => d.id === doc.id);
        const isPdf =
          doc.mediaType === 'pdf' ||
          doc.mimeType === 'application/pdf' ||
          Boolean(doc.fileUrl && doc.fileUrl.toLowerCase().endsWith('.pdf'));

        const isPresentation = doc.mediaType === 'presentation' && !doc.fileUrl;

        let healedFileUrl = doc.fileUrl || defaultDocMatch?.fileUrl;
        if (!isPresentation && isStaleOrBrokenUrl(healedFileUrl)) {
          healedFileUrl =
            defaultDocMatch?.fileUrl ||
            (isPdf
              ? '/assets/aistudio/Evidence_of_Procedural_Obstruction__1__1__7f16e01d.pdf'
              : FALLBACK_WORKING_VIDEOS[idx % FALLBACK_WORKING_VIDEOS.length]);
        }

        // Never assign an .mp4 truck video as previewUrl for a PDF document
        let healedPreviewUrl = doc.previewUrl || defaultDocMatch?.previewUrl;
        if (isPdf) {
          if (
            !healedPreviewUrl ||
            isStaleOrBrokenUrl(healedPreviewUrl) ||
            /\.(mp4|mov|webm)$/i.test(healedPreviewUrl)
          ) {
            healedPreviewUrl =
              defaultDocMatch?.previewUrl ||
              '/assets/aistudio/Screenshot_20251102_070334349_69d4bd17.jpg';
          }
        } else if (!isPresentation) {
          if (!healedPreviewUrl || isStaleOrBrokenUrl(healedPreviewUrl)) {
            healedPreviewUrl = healedFileUrl;
          }
        }

        const sanitizedPages = Array.isArray(doc.pages)
          ? doc.pages.map((p) => ({
              ...p,
              title: sanitizeDisplayText(p.title),
              subtitle: sanitizeDisplayText(p.subtitle),
              referenceCode: sanitizeDisplayText(p.referenceCode || 'EVID2026').replace(/-/g, ''),
              content: Array.isArray(p.content)
                ? p.content.map((line) => sanitizeDisplayText(line))
                : [],
            }))
          : [];

        return {
          ...doc,
          title: sanitizeDisplayText(doc.title),
          description: sanitizeDisplayText(doc.description),
          badge: sanitizeDisplayText(doc.badge),
          mediaType: isPdf ? 'pdf' : doc.mediaType,
          fileUrl: healedFileUrl,
          previewUrl: healedPreviewUrl,
          pages: sanitizedPages,
          scale: doc.scale || 100,
          heightMode: doc.heightMode || 'md',
          widthMode: doc.widthMode || 'normal',
          fitMode: doc.fitMode || 'cover',
          posY: typeof doc.posY === 'number' ? doc.posY : 50,
        };
      });

    normalized.documents = cleanedDocs;
  }

  if (Array.isArray(normalized.audioRecordings)) {
    const mergedAudio: ApprovedAudioRecording[] = APPROVED_AUDIO_RECORDINGS.filter(
      (defRec) => !deletedSet.has(defRec.id)
    ).map((defRec) => {
      const savedMatch = normalized.audioRecordings?.find((r) => r.id === defRec.id);
      if (savedMatch && savedMatch.url && !savedMatch.url.startsWith('blob:')) {
        return {
          ...defRec,
          ...savedMatch,
          badge: sanitizeDisplayText(savedMatch.badge || defRec.badge),
          title: sanitizeDisplayText(savedMatch.title || defRec.title),
          description: sanitizeDisplayText(savedMatch.description || defRec.description),
        };
      }
      return defRec;
    });

    // Append any custom user-added audio recordings (excluding duplicate main-dossier)
    normalized.audioRecordings.forEach((customRec) => {
      if (
        customRec &&
        customRec.id !== 'main-dossier' &&
        customRec.id &&
        !deletedSet.has(customRec.id) &&
        !mergedAudio.some((m) => m.id === customRec.id) &&
        customRec.url &&
        !customRec.url.startsWith('blob:')
      ) {
        mergedAudio.push({
          ...customRec,
          badge: sanitizeDisplayText(customRec.badge),
          title: sanitizeDisplayText(customRec.title),
          description: sanitizeDisplayText(customRec.description),
        });
      }
    });

    normalized.audioRecordings = mergedAudio;
  }

  if (Array.isArray(normalized.modificationLogs)) {
    normalized.modificationLogs = normalized.modificationLogs.map((log) => ({
      ...log,
      target: sanitizeDisplayText(log.target),
      details: sanitizeDisplayText(log.details),
    }));
  }

  return normalized;
}

export function loadLocalPersistedState(): PersistedDossierState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_STATE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDossierState;
    return normalizePersistedState(parsed && typeof parsed === 'object' ? parsed : null);
  } catch {
    return null;
  }
}

export async function savePermanentDossierState(
  partial: Omit<PersistedDossierState, 'updatedAt'>
): Promise<void> {
  try {
    const current = loadLocalPersistedState() || { updatedAt: 0 };
    const rawMerged: PersistedDossierState = {
      ...current,
      ...partial,
      updatedAt: Date.now(),
    };
    const merged = normalizePersistedState(rawMerged) || rawMerged;
    window.localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(merged));

    await fetch('/api/state/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch(() => {});
  } catch {
    // Ignore storage errors
  }
}

export async function fetchServerOrLocalState(): Promise<PersistedDossierState | null> {
  const local = loadLocalPersistedState();
  try {
    const res = await fetch('/api/state/load');
    if (res.ok) {
      const rawServerData = (await res.json()) as PersistedDossierState | null;
      const serverData = normalizePersistedState(rawServerData);
      if (serverData && serverData.updatedAt) {
        if (!local || serverData.updatedAt >= local.updatedAt) {
          window.localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(serverData));
          return serverData;
        }
      }
    }
  } catch {
    // Fallback to local
  }
  return local;
}
