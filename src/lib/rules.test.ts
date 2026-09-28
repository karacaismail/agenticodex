import { describe, expect, it } from 'vitest';
import { mkTool } from '@/test/fixtures';
import { evaluate, validate, describeRule, encodeRule, decodeRule, FIELDS, cond, and, or, not, filterTools, type Rule } from './rules';

const A = mkTool({ id: 'a', name: 'İstanbul Kit', license: 'MIT', evidence: 80, tags: ['akış', 'renderer'], rTopics: ['R08', 'R09'], coverage: 8, maturity: 'Kararlı' });
const B = mkTool({ id: 'b', name: 'Bravo', license: 'Ticari', evidence: null, tags: ['animasyon'], rTopics: ['R06'], coverage: 2, maturity: 'Taslak' });
const C = mkTool({ id: 'c', name: 'charlie', license: 'Apache-2.0', evidence: 30, tags: [], rTopics: [], coverage: 5, maturity: 'RC/Beta' });

describe('koşul değerlendirme', () => {
  it('eşitlik / eşitsizlik', () => {
    expect(evaluate(cond('license', 'eq', 'MIT'), A)).toBe(true);
    expect(evaluate(cond('license', 'neq', 'MIT'), A)).toBe(false);
  });
  it('in / nin tekil alanlarda', () => {
    expect(evaluate(cond('license', 'in', ['MIT', 'Apache-2.0']), C)).toBe(true);
    expect(evaluate(cond('license', 'nin', ['MIT', 'Apache-2.0']), B)).toBe(true);
  });
  it('çok değerli alanlarda any / all / none', () => {
    expect(evaluate(cond('tags', 'any', ['renderer', 'x']), A)).toBe(true);
    expect(evaluate(cond('tags', 'all', ['akış', 'renderer']), A)).toBe(true);
    expect(evaluate(cond('tags', 'all', ['akış', 'x']), A)).toBe(false);
    expect(evaluate(cond('tags', 'none', ['animasyon']), A)).toBe(true);
    expect(evaluate(cond('rTopics', 'any', ['R06']), B)).toBe(true);
  });
  it('sayısal karşılaştırma ve aralık', () => {
    expect(evaluate(cond('coverage', 'gte', 5), C)).toBe(true);
    expect(evaluate(cond('coverage', 'gt', 5), C)).toBe(false);
    expect(evaluate(cond('coverage', 'between', [2, 5]), B)).toBe(true);
    expect(evaluate(cond('coverage', 'lt', 3), B)).toBe(true);
  });
  it('boş (null) kanıt hiçbir sayısal koşulu sağlamaz, isnull ile yakalanır', () => {
    expect(evaluate(cond('evidence', 'gte', 0), B)).toBe(false);
    expect(evaluate(cond('evidence', 'lt', 100), B)).toBe(false);
    expect(evaluate(cond('evidence', 'isnull'), B)).toBe(true);
    expect(evaluate(cond('evidence', 'notnull'), A)).toBe(true);
  });
  it('metin arama Türkçe büyük/küçük harf duyarsız (İ/i)', () => {
    expect(evaluate(cond('name', 'text', 'istanbul'), A)).toBe(true);
    expect(evaluate(cond('name', 'text', 'CHAR'), C)).toBe(true);
  });
  it('ve / veya / değil iç içe', () => {
    const r: Rule = or(and(cond('license', 'eq', 'MIT'), cond('coverage', 'gte', 7)), not(cond('evidence', 'notnull')));
    expect([A, B, C].filter((t) => evaluate(r, t)).map((t) => t.id)).toEqual(['a', 'b']);
  });
  it('boş grup: VE için doğru, VEYA için yanlış', () => {
    expect(evaluate(and(), A)).toBe(true);
    expect(evaluate(or(), A)).toBe(false);
  });
  it('filterTools sırayı korur', () => {
    expect(filterTools([C, B, A], cond('coverage', 'gte', 4)).map((t) => t.id)).toEqual(['c', 'a']);
  });
});

describe('doğrulama', () => {
  it('bilinmeyen alan ve uyumsuz işleç hatası verir', () => {
    expect(validate(cond('yok' as never, 'eq', 1))).toHaveLength(1);
    expect(validate(cond('coverage', 'any', ['x']))[0]).toMatch(/işleç/);
    expect(validate(cond('license', 'gt', 3))[0]).toMatch(/işleç/);
  });
  it('geçerli iç içe kural hatasızdır', () => {
    expect(validate(and(cond('license', 'eq', 'MIT'), or(cond('tags', 'any', ['a']), cond('evidence', 'isnull'))))).toEqual([]);
  });
  it('her alanın etiketi ve türü tanımlı', () => {
    for (const f of Object.values(FIELDS)) {
      expect(f.label.length).toBeGreaterThan(1);
      expect(['enum', 'multi', 'number', 'bool', 'text']).toContain(f.type);
    }
  });
});

describe('insan okunur açıklama ve URL kodlama', () => {
  it('Türkçe açıklama üretir', () => {
    const d = describeRule(and(cond('license', 'eq', 'MIT'), cond('evidence', 'gte', 60)));
    expect(d).toContain('Lisans');
    expect(d).toContain('VE');
    expect(d).toContain('≥ 60');
  });
  it('kodla/çöz gidiş-dönüş kayıpsız ve URL güvenli', () => {
    const r = or(and(cond('license', 'in', ['MIT', 'Apache-2.0']), cond('name', 'text', 'çğıöşü')), not(cond('evidence', 'isnull')));
    const s = encodeRule(r);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeRule(s)).toEqual(r);
  });
  it('biçimsiz kural nesneleri çökertmez, hata olarak raporlanır', () => {
    expect(validate({ kind: 'group', combinator: 'and' } as never).length).toBeGreaterThan(0);
    expect(validate(null as never).length).toBeGreaterThan(0);
    expect(validate({ kind: 'x' } as never).length).toBeGreaterThan(0);
    expect(decodeRule(encodeRule({ kind: 'group', combinator: 'and', children: [null] } as never))).toBeNull();
  });
  it('bozuk kodu çözmek null döndürür', () => {
    expect(decodeRule('%%%bozuk')).toBeNull();
  });
});
