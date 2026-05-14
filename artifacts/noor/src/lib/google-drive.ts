/**
 * google-drive.ts — Google Drive backup via Firebase Google Sign-In
 *
 * يستخدم Firebase Auth مع scope إضافي لـ Google Drive.
 * لا يحتاج إعداد إضافي — Firebase موجود بالفعل.
 *
 * المتطلب الوحيد: تفعيل Google Drive API في مشروع Firebase:
 * https://console.cloud.google.com/apis/library/drive.googleapis.com?project=noooooor-app
 */

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'noor-backup.json';
const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

/* ══════════════════════════════════════════════════════════
   TOKEN — يُجدَّد كل استخدام (Firebase يتعامل مع التوكن تلقائياً)
══════════════════════════════════════════════════════════ */

let _cachedToken: string | null = null;
let _tokenExpiry: number = 0;

export async function getGoogleDriveToken(): Promise<string> {
  // استخدم التوكن المحفوظ لو لم ينته صلاحيته بعد
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  // حافظ على بيانات المستخدم المختارة مسبقاً
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('فشل الحصول على صلاحية Google Drive');
  }

  _cachedToken = credential.accessToken;
  _tokenExpiry = Date.now() + 55 * 60 * 1000; // ينتهي بعد 55 دقيقة
  return _cachedToken;
}

export function clearDriveToken(): void {
  _cachedToken = null;
  _tokenExpiry = 0;
}

export function getDriveEmail(): string | null {
  return auth.currentUser?.email ?? null;
}

/* ══════════════════════════════════════════════════════════
   DRIVE OPERATIONS
══════════════════════════════════════════════════════════ */

async function findBackupFile(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const res = await fetch(
    `${DRIVE_FILES_API}?q=${q}&fields=files(id,name,modifiedTime)&spaces=drive`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.status === 403) {
    const err = await res.json() as { error?: { message?: string } };
    if (err.error?.message?.includes('Drive API')) {
      throw new Error('drive_api_not_enabled');
    }
    throw new Error('permission_denied');
  }
  if (!res.ok) throw new Error(`Drive error: ${res.status}`);
  const data = await res.json() as { files: Array<{ id: string }> };
  return data.files?.[0]?.id ?? null;
}

async function createFile(token: string, content: string): Promise<string> {
  const metadata = { name: BACKUP_FILENAME, mimeType: 'application/json' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'application/json' }));

  const res = await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Drive create error: ${res.status}`);
  const data = await res.json() as { id: string };
  return data.id;
}

async function updateFile(token: string, fileId: string, content: string): Promise<void> {
  const metadata = { name: BACKUP_FILENAME };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'application/json' }));

  const res = await fetch(`${DRIVE_UPLOAD_API}/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Drive update error: ${res.status}`);
}

/* ══════════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════════ */

export interface DriveUploadResult {
  fileId: string;
  isNew: boolean;
}

/** يرفع ملف النسخة الاحتياطية إلى Google Drive (ينشئ أو يحدّث) */
export async function uploadToDrive(jsonContent: string): Promise<DriveUploadResult> {
  const token = await getGoogleDriveToken();
  const existingId = await findBackupFile(token);

  if (existingId) {
    await updateFile(token, existingId, jsonContent);
    return { fileId: existingId, isNew: false };
  } else {
    const fileId = await createFile(token, jsonContent);
    return { fileId, isNew: true };
  }
}

/** يُنزّل آخر نسخة احتياطية من Google Drive */
export async function downloadFromDrive(): Promise<string | null> {
  const token = await getGoogleDriveToken();
  const fileId = await findBackupFile(token);
  if (!fileId) return null;

  const res = await fetch(`${DRIVE_FILES_API}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download error: ${res.status}`);
  return res.text();
}

/** يحاول استعادة الملف من Drive بدون popup جديد (لو التوكن موجود) */
export async function silentRestoreFromDrive(): Promise<string | null> {
  if (!_cachedToken || Date.now() >= _tokenExpiry) return null;
  return downloadFromDrive();
}
