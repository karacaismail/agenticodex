import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderUI } from '@/test/render';
import { RuleBuilder } from './RuleBuilder';
import { and, cond, type Group } from '@/lib/rules';

function setup(value: Group) {
  const onChange = vi.fn();
  renderUI(<RuleBuilder value={value} onChange={onChange} />);
  return onChange;
}

describe('RuleBuilder', () => {
  it('mevcut koşulun insan okunur açıklamasını gösterir', () => {
    setup(and(cond('license', 'eq', 'MIT')));
    expect(screen.getByTestId('rule-description')).toHaveTextContent('Lisans = MIT');
  });

  it('“Koşul ekle” yeni bir koşul ekler', () => {
    const onChange = setup(and(cond('license', 'eq', 'MIT')));
    fireEvent.click(screen.getByRole('button', { name: /koşul ekle/i }));
    const next = onChange.mock.calls.at(-1)![0] as Group;
    expect(next.children).toHaveLength(2);
  });

  it('“Grup ekle” iç içe grup ekler', () => {
    const onChange = setup(and(cond('license', 'eq', 'MIT')));
    fireEvent.click(screen.getByRole('button', { name: /grup ekle/i }));
    const next = onChange.mock.calls.at(-1)![0] as Group;
    expect(next.children[1].kind).toBe('group');
  });

  it('birleştirici VEYA’ya çevrilebilir', () => {
    const onChange = setup(and(cond('license', 'eq', 'MIT'), cond('coverage', 'gte', 5)));
    fireEvent.click(screen.getAllByRole('radio', { name: 'VEYA' })[0]);
    expect((onChange.mock.calls.at(-1)![0] as Group).combinator).toBe('or');
  });

  it('koşul silinebilir', () => {
    const onChange = setup(and(cond('license', 'eq', 'MIT'), cond('coverage', 'gte', 5)));
    fireEvent.click(screen.getAllByRole('button', { name: /koşulu sil/i })[0]);
    const next = onChange.mock.calls.at(-1)![0] as Group;
    expect(next.children).toHaveLength(1);
    expect(next.children[0]).toEqual(cond('coverage', 'gte', 5));
  });

  it('DEĞİL anahtarı grubu tersine çevirir', () => {
    const onChange = setup(and(cond('license', 'eq', 'MIT')));
    fireEvent.click(screen.getAllByRole('switch', { name: 'DEĞİL' })[0]);
    expect((onChange.mock.calls.at(-1)![0] as Group).not).toBe(true);
  });
});
