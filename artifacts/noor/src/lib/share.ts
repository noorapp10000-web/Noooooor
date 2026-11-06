import { Capacitor } from '@capacitor/core';

/** Share text through the native sheet, the Web Share API, or WhatsApp as a last resort. */
export async function shareText(text: string, dialogTitle = 'مشاركة'): Promise<void> {
  const body = `${text}\n\n📱 من تطبيق نور`;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text: body, dialogTitle });
      return;
    } catch { /* fall through */ }
  }
  if (navigator.share) {
    try { await navigator.share({ text: body }); return; } catch { /* cancelled */ }
  }
  try { await navigator.clipboard.writeText(body); } catch { /* ignore */ }
  window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fallback */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}
