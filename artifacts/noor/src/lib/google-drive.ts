/**
 * google-drive.ts — Google Drive backup/restore via OAuth2 + Drive REST API
 *
 * يستخدم Google Identity Services (GIS) بدون backend.
 * المتطلب: VITE_GOOGLE_CLIENT_ID في البيئة.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'noor-backup.json';
const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

/* ══════════════════════════════════════════════════════════
   TOKEN MANAGEMENT
══════════════════════════════════════════════════════════ */

let _accessToken: string | null = null;
let _tokenClient: unknown = null;

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: object) => { requestAccessToken: (opts?: object) => void };
        };
      };
    };
    onGoogleGISLoad?: () => void;
  }
}

export function hasClientId(): boolean {
  return !!(CLIENT_ID && CLIENT_ID.trim());
}

function loadGISScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const existing = document.getElementById('google-gis-script');
    if (existing) {
      window.onGoogleGISLoad = resolve;
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { window.onGoogleGISLoad?.(); resolve(); };
    script.onerror = () => reject(new Error('فشل تحميل Google Identity Services'));
    document.head.appendChild(script);
  });
}

export async function getAccessToken(): Promise<string> {
  if (_accessToken) return _accessToken;
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID غير مضبوط');

  await loadGISScript();

  return new Promise((resolve, reject) => {
    if (!_tokenClient) {
      _tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp: { access_token?: string; error?: string }) => {
          if (resp.error) { reject(new Error(resp.error)); return; }
          if (resp.access_token) { _accessToken = resp.access_token; resolve(resp.access_token); }
        },
      });
    }
    (
      _tokenClient as { requestAccessToken: (o?: object) => void }
    ).requestAccessToken({ prompt: _accessToken ? '' : 'consent' });
  });
}

export function clearAccessToken(): void { _accessToken = null; }

/* ══════════════════════════════════════════════════════════
   DRIVE OPERATIONS
══════════════════════════════════════════════════════════ */

async function findBackupFile(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const res = await fetch(`${DRIVE_FILES_API}?q=${q}&fields=files(id,name,modifiedTime)&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json() as { files: Array<{ id: string }> };
  return data.files?.[0]?.id ?? null;
}

async function createFile(token: string, content: string): Promise<string> {
  const metadata = { name: BACKUP_FILENAME, mimeType: 'application/json' };
  const body = new FormData();
  body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  body.append('file', new Blob([content], { type: 'application/json' }));

  const res = await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive create error: ${res.status}`);
  const data = await res.json() as { id: string };
  return data.id;
}

async function updateFile(token: string, fileId: string, content: string): Promise<void> {
  const metadata = { name: BACKUP_FILENAME, mimeType: 'application/json' };
  const body = new FormData();
  body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  body.append('file', new Blob([content], { type: 'application/json' }));

  const res = await fetch(`${DRIVE_UPLOAD_API}/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive update error: ${res.status}`);
}

export async function uploadToDrive(jsonContent: string): Promise<{ fileId: string; isNew: boolean }> {
  const token = await getAccessToken();
  const existingId = await findBackupFile(token);

  if (existingId) {
    await updateFile(token, existingId, jsonContent);
    return { fileId: existingId, isNew: false };
  } else {
    const fileId = await createFile(token, jsonContent);
    return { fileId, isNew: true };
  }
}

export async function downloadFromDrive(): Promise<string | null> {
  const token = await getAccessToken();
  const fileId = await findBackupFile(token);
  if (!fileId) return null;

  const res = await fetch(`${DRIVE_FILES_API}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download error: ${res.status}`);
  return res.text();
}
