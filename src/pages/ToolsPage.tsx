import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Badge, Button, Collapse, Group, MultiSelect, Paper, SegmentedControl, Select, SimpleGrid, Slider, Stack, Table, Text, TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconAdjustmentsHorizontal, IconLayoutGrid, IconSearch, IconTable, IconX } from '@tabler/icons-react';
import { goldenById, layerById, tools } from '@/data';
import type { Tool } from '@/data/types';
import { searchTools } from '@/lib/search';
import { optionsFor } from '@/lib/fieldOptions';
import type { FieldKey } from '@/lib/rules';
import { EvidenceBar, PageHeader, RingBadge, ToolCard } from '@/components/ui/atoms';
import { RISK_COLOR } from '@/lib/format';

const FILTERS: { key: string; field: FieldKey; label: string }[] = [
  { key: 'golden', field: 'golden', label: 'Altın küme' },
  { key: 'layer', field: 'layer', label: 'Katman' },
  { key: 'kind', field: 'kind', label: 'Tür' },
  { key: 'ring', field: 'ring', label: 'Radar halkası' },
  { key: 'stance', field: 'stance', label: 'Rapor duruşu' },
  { key: 'license', field: 'license', label: 'Lisans' },
  { key: 'maturity', field: 'maturity', label: 'Olgunluk' },
  { key: 'platform', field: 'platform', label: 'Platform' },
  { key: 'risk', field: 'riskTier', label: 'Risk' },
  { key: 'effort', field: 'effort', label: 'Yük' },
];

const SORTS: Record<string, { label: string; fn: (a: Tool, b: Tool) => number }> = {
  composite: { label: 'Bileşik puan', fn: (a, b) => b.composite - a.composite },
  evidence: { label: 'Kanıt puanı', fn: (a, b) => (b.evidence ?? -1) - (a.evidence ?? -1) },
  mentions: { label: 'Görünürlük', fn: (a, b) => b.mentionTotal - a.mentionTotal },
  claims: { label: 'İddia sayısı', fn: (a, b) => b.claimCount - a.claimCount },
  risk: { label: 'Risk (yüksekten)', fn: (a, b) => b.riskScore - a.riskScore },
  name: { label: 'Ad (A–Z)', fn: (a, b) => a.name.localeCompare(b.name, 'tr') },
};

const PAGE = 36;

export default function ToolsPage() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [dq] = useDebouncedValue(q, 180);
  const [open, setOpen] = useState(FILTERS.some((f) => sp.get(f.key)));
  const [limit, setLimit] = useState(PAGE);
  const view = sp.get('gorunum') ?? 'kart';
  const sort = sp.get('sirala') ?? 'composite';
  const minCov = Number(sp.get('kapsam') ?? 0);

  const selected = (k: string) => (sp.get(k) ? sp.get(k)!.split(',') : []);
  const update = (k: string, v: string | string[] | null) => {
    const next = new URLSearchParams(sp);
    const val = Array.isArray(v) ? v.join(',') : v;
    if (!val) next.delete(k);
    else next.set(k, val);
    setSp(next, { replace: true });
    setLimit(PAGE);
  };

  const result = useMemo(() => {
    let list = tools.filter((t) => {
      for (const f of FILTERS) {
        const sel = selected(f.key);
        if (!sel.length) continue;
        const v = String((t as unknown as Record<string, unknown>)[f.field === 'riskTier' ? 'riskTier' : f.field]);
        if (!sel.includes(v)) return false;
      }
      return t.coverage >= minCov;
    });
    list = searchTools(list, dq);
    if (!dq.trim()) list = [...list].sort(SORTS[sort]?.fn ?? SORTS.composite.fn);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, dq, sort, minCov]);

  const activeCount = FILTERS.reduce((n, f) => n + selected(f.key).length, 0) + (minCov ? 1 : 0);

  return (
    <>
      <PageHeader
        eyebrow="Keşfet"
        title="Araçlar ve varlıklar"
        description={`Araştırma korpusu ve ek kaynak incelemelerinden ${tools.length} varlık: kütüphaneler, protokoller, standartlar, tarayıcı API’leri, tasarım sistemleri, araştırmalar ve modeller. Puanlar korpus kanıtından hesaplanır; dış kaynakla eklenen araçların inceleme bilgisi detay sayfasındadır.`}
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Araçlar' }]}
      />
      <Paper p="md" className="glass" mb="lg">
        <Stack gap="sm">
          <Group gap="sm" wrap="wrap">
            <TextInput
              aria-label="Araç ara" placeholder="Ara: ad, etiket, üretici… (yazım hatasına dayanıklı)" leftSection={<IconSearch size={16} />}
              value={q} onChange={(e) => { setQ(e.currentTarget.value); update('q', e.currentTarget.value); }} style={{ flex: '1 1 280px' }}
              rightSection={q ? <IconX size={14} style={{ cursor: 'pointer' }} onClick={() => { setQ(''); update('q', null); }} /> : undefined}
            />
            <Select aria-label="Sırala" w={190} data={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))} value={sort} onChange={(v) => update('sirala', v)} allowDeselect={false} disabled={!!dq.trim()} />
            <SegmentedControl value={view} onChange={(v) => update('gorunum', v === 'kart' ? null : v)} data={[{ value: 'kart', label: <Group gap={4} wrap="nowrap"><IconLayoutGrid size={14} />Kart</Group> }, { value: 'tablo', label: <Group gap={4} wrap="nowrap"><IconTable size={14} />Tablo</Group> }]} />
            <Button variant={open ? 'light' : 'default'} leftSection={<IconAdjustmentsHorizontal size={16} />} onClick={() => setOpen((o) => !o)}>
              Filtreler{activeCount ? ` (${activeCount})` : ''}
            </Button>
            {activeCount > 0 && <Button variant="subtle" color="gray" onClick={() => { setSp(new URLSearchParams(), { replace: true }); setQ(''); }}>Temizle</Button>}
          </Group>
          <Collapse expanded={open}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="sm" pt="xs">
              {FILTERS.map((f) => (
                <MultiSelect key={f.key} label={f.label} size="xs" data={optionsFor(f.field)} value={selected(f.key)} onChange={(v) => update(f.key, v)} searchable clearable comboboxProps={{ withinPortal: true }} />
              ))}
              <Stack gap={4}>
                <Text size="xs" fw={500}>En az rapor kapsaması: {minCov}/8</Text>
                <Slider thumbLabel="En az rapor kapsaması" min={0} max={8} step={1} value={minCov} onChange={(v) => update('kapsam', v ? String(v) : null)} marks={[{ value: 0 }, { value: 4 }, { value: 8 }]} />
              </Stack>
            </SimpleGrid>
          </Collapse>
        </Stack>
      </Paper>

      <Group justify="space-between" mb="sm">
        <Text size="sm" c="dimmed">{result.length} sonuç{dq.trim() ? ' · alaka sırasına göre' : ` · ${SORTS[sort]?.label.toLocaleLowerCase('tr')}`}</Text>
        <Button size="xs" variant="subtle" component={Link} to={`/karsilastir?ids=${result.slice(0, 3).map((t) => t.id).join(',')}`} disabled={result.length < 2}>İlk 3’ü karşılaştır</Button>
      </Group>

      {view === 'tablo' ? (
        <Paper className="glass" p={0} style={{ overflow: 'auto' }}>
          <Table striped highlightOnHover stickyHeader miw={980} verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ad</Table.Th><Table.Th>Tür</Table.Th><Table.Th>Altın küme</Table.Th><Table.Th>Katman</Table.Th><Table.Th>Halka</Table.Th>
                <Table.Th>Puan</Table.Th><Table.Th w={150}>Kanıt</Table.Th><Table.Th>Kapsama</Table.Th><Table.Th>Risk</Table.Th><Table.Th>Lisans</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {result.slice(0, limit).map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td><Text component={Link} to={`/araclar/${t.id}`} fw={600} size="sm" className="link-reset">{t.name}</Text></Table.Td>
                  <Table.Td><Text size="xs">{t.kind}</Text></Table.Td>
                  <Table.Td><Text size="xs">{goldenById.get(t.golden)?.name}</Text></Table.Td>
                  <Table.Td><Text size="xs">{layerById.get(t.layer)?.name}</Text></Table.Td>
                  <Table.Td><RingBadge ring={t.ring} size="xs" /></Table.Td>
                  <Table.Td><Text size="sm" fw={700}>{t.composite}</Text></Table.Td>
                  <Table.Td><EvidenceBar counts={t.claimStatus} size="sm" /></Table.Td>
                  <Table.Td><Text size="xs">{t.coverage}/8</Text></Table.Td>
                  <Table.Td><Badge size="xs" color={RISK_COLOR[t.riskTier]} variant="light">{t.riskTier}</Badge></Table.Td>
                  <Table.Td><Text size="xs">{t.license}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {result.slice(0, limit).map((t) => <ToolCard key={t.id} t={t} />)}
        </SimpleGrid>
      )}
      {result.length > limit && (
        <Group justify="center" mt="lg">
          <Button variant="light" onClick={() => setLimit((l) => l + PAGE)}>Daha fazla göster ({result.length - limit} kaldı)</Button>
        </Group>
      )}
      {result.length === 0 && (
        <Paper p="xl" className="glass" ta="center">
          <Text fw={600}>Eşleşen varlık yok</Text>
          <Text size="sm" c="dimmed">Filtreleri gevşet veya aramayı değiştir.</Text>
        </Paper>
      )}
    </>
  );
}
