import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// Mantine, jsdom'da bulunmayan tarayıcı API'lerini bekler.
if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;
  if (!w.matchMedia) {
    w.matchMedia = (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    });
  }
  if (!w.ResizeObserver) {
    w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  if (!w.IntersectionObserver) {
    w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
  }
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () {};
  (window.HTMLElement.prototype as unknown as { scrollTo: () => void }).scrollTo = () => {};
}
