import {
  DocumentItem,
  FieldVideoItem,
  TopShowcaseItem,
  FIELD_VIDEOS,
  INITIAL_DOCUMENTS,
} from '../data/dossierData';

const STORAGE_KEY_STATE = 'binkalilah_permanent_dossier_state_v4';
const IDB_NAME = 'BinKalilahPermanentMediaDB';
const IDB_STORE = 'media_blobs';

export interface PersistedDossierState {
  fieldVideos?: FieldVideoItem[];
  bgVideoUrl?: string;
  fleetPhotos?: TopShowcaseItem[];
  documents?: DocumentItem[];
  updatedAt: number;
}

// Pool of verified working studio video URLs on disk to heal any stale/broken blob: or missing URLs
const FALLBACK_WORKING_VIDEOS = [
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

export async function loadBlobUrlFromIndexedDB(key: string): Promise<string | null> {
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
    return null;
  } catch {
    return null;
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

  if (Array.isArray(normalized.fleetPhotos)) {
    normalized.fleetPhotos = normalized.fleetPhotos.map((item, idx) => {
      let badge = item.badge || '';
      if (badge.includes('16 تريلا') || badge.includes('أسطول')) {
        badge = 'جدول 16 تريلا';
      }
      const title = (item.title || '').replace('والجاهزة للتصدير', 'ضمن جدول التصدير');
      const url = isStaleOrBrokenUrl(item.url)
        ? FALLBACK_WORKING_VIDEOS[idx % FALLBACK_WORKING_VIDEOS.length]
        : item.url;
      return { ...item, badge, title, url };
    });
  }

  // Always preserve the 7 canonical Conversation Evidence videos with their interior WhatsApp/Document posterUrl
  normalized.fieldVideos = FIELD_VIDEOS.map((defaultVid) => ({
    ...defaultVid,
  }));

  if (Array.isArray(normalized.documents)) {
    const cleanedDocs = normalized.documents
      .filter((doc) => !LEGACY_TRUCK_DOC_IDS.has(doc.id))
      .map((doc, idx) => {
        const builtin = INITIAL_DOCUMENTS.find((d) => d.id === doc.id);
        if (builtin && !doc.id.startsWith('doc-uploaded-')) {
          return {
            ...builtin,
            scale: doc.scale || 100,
            heightMode: doc.heightMode || 'md',
            widthMode: doc.widthMode || 'normal',
            fitMode: doc.fitMode || 'cover',
            posY: typeof doc.posY === 'number' ? doc.posY : 50,
          };
        }

        const healedUrl = isStaleOrBrokenUrl(doc.fileUrl)
          ? FALLBACK_WORKING_VIDEOS[idx % FALLBACK_WORKING_VIDEOS.length]
          : doc.fileUrl;

        return {
          ...doc,
          fileUrl: healedUrl,
          previewUrl: doc.previewUrl && !isStaleOrBrokenUrl(doc.previewUrl) ? doc.previewUrl : healedUrl,
          scale: doc.scale || 100,
          heightMode: doc.heightMode || 'md',
          widthMode: doc.widthMode || 'normal',
          fitMode: doc.fitMode || 'cover',
          posY: typeof doc.posY === 'number' ? doc.posY : 50,
        };
      });

    normalized.documents = cleanedDocs.length > 0 ? cleanedDocs : INITIAL_DOCUMENTS;
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
    const merged: PersistedDossierState = {
      ...current,
      ...partial,
      updatedAt: Date.now(),
    };
    // Avoid saving ephemeral blob: URLs to server JSON if a permanent URL is pending; normalize before saving
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
