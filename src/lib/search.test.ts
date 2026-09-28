import { describe, expect, it } from 'vitest';
import { tools } from '@/data';
import { searchTools } from './search';

describe('bulanık araç araması', () => {
  it('boş sorgu alt kümeyi olduğu gibi döndürür', () => {
    expect(searchTools(tools.slice(0, 5), '  ')).toHaveLength(5);
  });
  it('yazım hatasına dayanıklı: "motoin" → Motion', () => {
    expect(searchTools(tools, 'motoin').map((t) => t.id)).toContain('motion');
  });
  it('etiketle bulur: "sürdürme" → Tus/Uppy', () => {
    const ids = searchTools(tools, 'sürdürme').map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['tus', 'uppy']));
  });
  it('sonuç verilen alt kümeyle sınırlıdır', () => {
    const subset = tools.filter((t) => t.id !== 'motion');
    expect(searchTools(subset, 'motion').map((t) => t.id)).not.toContain('motion');
  });
});

import { rankActions } from './search';

describe('Spotlight alaka sıralaması', () => {
  const acts = [
    { id: 'w-benimseme-uppy', label: 'Uppy · Benimseme akışı', group: 'İş akışları' },
    { id: 't-tus', label: 'Tus', description: 'Uppy ile sürdürülebilir yükleme', group: 'Araçlar' },
    { id: 't-uppy', label: 'Uppy', description: 'Dosya yükleyici', group: 'Araçlar' },
    { id: 'p-x', label: 'Genel bakış', group: 'Sayfalar' },
  ];
  it('tam etiket eşleşmesi ilk sırada', () => {
    expect(rankActions('uppy', acts).map((a) => a.id)[0]).toBe('t-uppy');
  });
  it('etiket eşleşmesi açıklama eşleşmesinden önce gelir; eşleşmeyenler elenir', () => {
    expect(rankActions('Uppy', acts).map((a) => a.id)).toEqual(['t-uppy', 'w-benimseme-uppy', 't-tus']);
  });
  it('Türkçe büyük/küçük harf duyarsız: "İDDİA" → "iddia"', () => {
    expect(rankActions('İDDİA', [{ id: 'a', label: 'İddialar' }, { id: 'b', label: 'Başka' }]).map((a) => a.id)).toEqual(['a']);
  });
  it('boş sorgu bütün eylemleri değiştirmeden döndürür', () => {
    expect(rankActions('  ', acts)).toHaveLength(4);
  });
});
