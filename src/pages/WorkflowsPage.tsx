import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Badge, Button, Chip, Group, Pagination, Paper, RangeSlider, ScrollArea, Select, SimpleGrid, Stack, Text, TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import Fuse from 'fuse.js';
import { IconSearch, IconX } from '@tabler/icons-react';
import { loadWorkflows, meta, tools, topics } from '@/data';
import type { Workflow } from '@/data/types';
import { DIAGRAM_LABEL } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, ScrollSegmented } from '@/components/ui/atoms';
import { WorkflowCard } from '@/components/ui/cards';
import { AtlasLoader } from '@/components/ui/AtlasLoader';

const PER = 24;
let fuse: Fuse<Workflow> | null = null;

export default function WorkflowsPage() {
  const { id: familyId } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { data } = useLoad(loadWorkflows);
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [dq] = useDebouncedValue(q, 200);
  const page = Number(sp.get('s') ?? 1);
  const tip = sp.get('tip') ?? 'hepsi';
  const cx = (sp.get('karmasiklik') ?? '1-5').split('-').map(Number) as [number, number];

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    if (k !== 's') n.delete('s');
    setSp(n, { replace: true });
  };

  const family = data?.families.find((f) => f.id === familyId);
  const list = useMemo(() => {
    if (!data) return [];
    let l = data.workflows;
    if (familyId) l = l.filter((w) => w.family === familyId);
    if (tip !== 'hepsi') l = l.filter((w) => w.diagram === tip);
    const arac = sp.get('arac');
    const kume = sp.get('kume');
    const konu = sp.get('konu');
    if (arac) l = l.filter((w) => w.tools.includes(arac));
    if (kume) l = l.filter((w) => w.golden.includes(kume));
    if (konu) l = l.filter((w) => w.topics.includes(konu));
    l = l.filter((w) => w.complexity >= cx[0] && w.complexity <= cx[1]);
    if (dq.trim()) {
      fuse ??= new Fuse(data.workflows, { keys: [{ name: 'title', weight: 3 }, { name: 'summary', weight: 1 }, { name: 'tags', weight: 1.5 }, { name: 'conditions', weight: 0.7 }, { name: 'steps.title', weight: 0.6 }], threshold: 0.35, ignoreLocation: true });
      const allowed = new Set(l.map((w) => w.id));
      l = fuse.search(dq).map((r) => r.item).filter((w) => allowed.has(w.id));
    }
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, familyId, tip, sp, dq]);

  if (!data) return <AtlasLoader label="İş akışı kataloğu yükleniyor" />;
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const famName = (id: string) => data.families.find((f) => f.id === id)?.name;
  const counts = (['flowchart', 'sequence', 'state', 'gantt'] as const).map((d) => ({ d, n: (familyId ? data.workflows.filter((w) => w.family === familyId) : data.workflows).filter((w) => w.diagram === d).length }));

  return (
    <>
      <PageHeader
        eyebrow={family ? 'İş akışı ailesi' : 'İş akışları'}
        title={family ? family.name : 'İş akışı kataloğu'}
        description={family ? family.desc : `${data.workflows.length} iş akışı, ${data.families.length} aile. Hepsi aynı sürüm-güvenli oluşturucuyla üretildi ve derleme sırasında Mermaid 10.9, 11.17 ve 12.0 ile ayrıştırıldı. Koşullu dallar aracın ve bağlamın özelliklerinden gelir.`}
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'İş akışları', to: '/akislar' }, ...(family ? [{ label: family.name }] : [])]}
      />
      <ScrollArea type="auto" mb="md" offsetScrollbars>
        <Chip.Group>
          <Group gap={6} wrap="nowrap">
            <Chip checked={!familyId} onChange={() => navigate(`/akislar${sp.toString() ? `?${sp}` : ''}`)} variant="light">Hepsi · {data.workflows.length}</Chip>
            {data.families.map((f) => (
              <Chip key={f.id} checked={familyId === f.id} onChange={() => navigate(`/akislar/aile/${f.id}`)} variant="light">{f.name} · {f.count}</Chip>
            ))}
          </Group>
        </Chip.Group>
      </ScrollArea>
      <Paper p="md" className="glass" mb="lg">
        <Group gap="sm" wrap="wrap" align="flex-end">
          <TextInput label="Ara" placeholder="Başlık, koşul, adım…" leftSection={<IconSearch size={16} />} value={q} onChange={(e) => { setQ(e.currentTarget.value); set('q', e.currentTarget.value || null); }} style={{ flex: '1 1 260px' }}
            rightSection={q ? <IconX size={14} style={{ cursor: 'pointer' }} onClick={() => { setQ(''); set('q', null); }} /> : undefined} />
          <Stack gap={4} maw="100%" style={{ minWidth: 0 }}>
            <Text size="xs" fw={500}>Diyagram türü</Text>
            <ScrollSegmented size="xs" value={tip} onChange={(v) => set('tip', v === 'hepsi' ? null : v)} data={[{ value: 'hepsi', label: 'Hepsi' }, ...counts.map((c) => ({ value: c.d, label: `${DIAGRAM_LABEL[c.d]} ${c.n}`, disabled: !c.n }))]} />
          </Stack>
          <Select label="Altın küme" size="xs" w={210} clearable searchable data={meta.golden.map((g) => ({ value: g.id, label: g.name }))} value={sp.get('kume')} onChange={(v) => set('kume', v)} comboboxProps={{ withinPortal: true }} />
          <Select label="Araç" size="xs" w={190} clearable searchable data={tools.map((t) => ({ value: t.id, label: t.name }))} value={sp.get('arac')} onChange={(v) => set('arac', v)} comboboxProps={{ withinPortal: true }} />
          <Select label="Konu" size="xs" w={170} clearable searchable data={topics.map((t) => ({ value: t.id, label: `${t.id} · ${t.short}` }))} value={sp.get('konu')} onChange={(v) => set('konu', v)} comboboxProps={{ withinPortal: true }} />
          <Stack gap={4} w={170}>
            <Text size="xs" fw={500}>Karmaşıklık {cx[0]}–{cx[1]}</Text>
            <RangeSlider thumbFromLabel="En düşük karmaşıklık" thumbToLabel="En yüksek karmaşıklık" min={1} max={5} step={1} minRange={0} value={cx} onChange={(v) => set('karmasiklik', v[0] === 1 && v[1] === 5 ? null : `${v[0]}-${v[1]}`)} marks={[1, 2, 3, 4, 5].map((v) => ({ value: v }))} />
          </Stack>
        </Group>
      </Paper>
      <Group justify="space-between" mb="sm">
        <Text size="sm" c="dimmed">{list.length} akış · sayfa {Math.min(page, pages)}/{pages}</Text>
        {(sp.toString() || familyId) && <Button size="xs" variant="subtle" color="gray" onClick={() => { setQ(''); navigate('/akislar'); }}>Filtreleri sıfırla</Button>}
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
        {list.slice((Math.min(page, pages) - 1) * PER, Math.min(page, pages) * PER).map((w) => <WorkflowCard key={w.id} w={w} familyName={familyId ? undefined : famName(w.family)} />)}
      </SimpleGrid>
      {list.length === 0 && <Paper p="xl" ta="center" className="glass"><Text fw={600}>Eşleşen akış yok</Text></Paper>}
      {pages > 1 && (
        <Group justify="center" mt="xl">
          <Pagination getControlProps={(c) => ({ 'aria-label': ({ first: 'İlk sayfa', previous: 'Önceki sayfa', next: 'Sonraki sayfa', last: 'Son sayfa' } as const)[c] })} total={pages} value={Math.min(page, pages)} onChange={(p) => { set('s', String(p)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </Group>
      )}
      {family && <Badge mt="md" variant="light">{family.count} akış bu ailede</Badge>}
      <Text size="xs" c="dimmed" mt="lg">İpucu: araç sayfalarından <Link to="/araclar">bir aracın bütün akışlarına</Link> ulaşabilirsin.</Text>
    </>
  );
}
