// Birden fazla Mermaid ana sürümünü aynı süreçte yükleyip ayrıştırma (parse) yapar.
// Derleme doğrulaması ve testler aynı yardımcıyı kullanır.
import { JSDOM } from 'jsdom';

export const MERMAID_TARGETS = {
  v10: { pkg: 'mermaid-v10', label: '10.9' },
  v11: { pkg: 'mermaid', label: '11.17 (uygulama)' },
  v12: { pkg: 'mermaid-v12', label: '12.0' },
};

function ensureDom() {
  if (typeof globalThis.document !== 'undefined' && typeof globalThis.window !== 'undefined') return;
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  for (const k of ['DOMParser', 'Element', 'HTMLElement', 'Node', 'SVGElement', 'XMLSerializer']) {
    if (!globalThis[k] && dom.window[k]) globalThis[k] = dom.window[k];
  }
  try { if (!globalThis.navigator) globalThis.navigator = dom.window.navigator; } catch { /* salt okunur */ }
}

export async function loadParsers(versions = Object.keys(MERMAID_TARGETS)) {
  ensureDom();
  const out = {};
  for (const v of versions) {
    const mod = await import(MERMAID_TARGETS[v].pkg);
    const mermaid = mod.default ?? mod;
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    out[v] = async (code) => {
      try {
        await mermaid.parse(code);
        return null;
      } catch (e) {
        return String(e?.message ?? e).split('\n').slice(0, 4).join(' ⏎ ');
      }
    };
  }
  return out;
}
