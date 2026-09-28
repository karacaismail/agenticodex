import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listSaved, saveCluster, removeSaved, STORAGE_KEY } from './savedClusters';
import { and, cond } from './rules';

describe('kaydedilen özel kümeler', () => {
  beforeEach(() => localStorage.clear());

  it('kaydeder, listeler ve siler', () => {
    const a = saveCluster('Hızlı', and(cond('effort', 'eq', 'Düşük')));
    saveCluster('Riskli', and(cond('riskTier', 'eq', 'Yüksek')));
    expect(listSaved().map((x) => x.name)).toEqual(['Riskli', 'Hızlı']);
    removeSaved(a.id);
    expect(listSaved().map((x) => x.name)).toEqual(['Riskli']);
  });

  it('bozuk JSON’da boş liste döner', () => {
    localStorage.setItem(STORAGE_KEY, '{bozuk');
    expect(listSaved()).toEqual([]);
  });

  it('geçersiz kurallı kayıtları eler', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'x', name: 'x', rule: { kind: 'cond', field: 'yok', op: 'eq' }, createdAt: 1 }]));
    expect(listSaved()).toEqual([]);
  });

  it('depolama erişilemezse hata fırlatmaz', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('engelli'); });
    expect(listSaved()).toEqual([]);
    spy.mockRestore();
    const spy2 = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('dolu'); });
    expect(() => saveCluster('x', and())).not.toThrow();
    spy2.mockRestore();
  });
});
