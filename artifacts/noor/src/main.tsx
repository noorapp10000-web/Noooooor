import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent browser refresh (F5, Ctrl+R)
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (
    e.key === 'F5' ||
    (e.ctrlKey && (e.key === 'r' || e.key === 'R'))
  ) {
    e.preventDefault();
  }
  // Prevent Ctrl+/- zoom and Ctrl+0 reset zoom
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')) {
    e.preventDefault();
  }
});

// Prevent Ctrl+scroll zoom
document.addEventListener('wheel', (e: WheelEvent) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent pinch zoom on mobile (touchpad or touch screen)
document.addEventListener('touchmove', (e: TouchEvent) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Disable context menu (long-press menu) for native app feel
document.addEventListener('contextmenu', (e: MouseEvent) => {
  e.preventDefault();
});

// Disable text selection via keyboard shortcut
document.addEventListener('selectstart', (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable) return;
  e.preventDefault();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister().catch(() => {}));
    }).catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
