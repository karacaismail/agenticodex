import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Badge, Group, Pagination, Paper, SegmentedControl, SimpleGrid, Stack, Switch, Text, TextInput } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { loadSources, toolById } from '@/data';
import { pathOf } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section } from '@/components/ui/atoms';
import { AtlasLoader } from '@/components/ui/AtlasLoader';

const PER = 40;

export default function SourcesPage() {
  const { data } = useLoad(loadSources);
  const [q, setQ] = useState('');
  const [dq] = useDebouncedValue(q, 200);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'liste' | 'alan'>('liste');
  const [hidePh, setHidePh] = useState(true);
  const list = useMemo(() => (data ?? []).filter((s) => (!hidePh || !s.placeholder) && (!dq || s.url.toLowerCase().includes(dq.toLowerCase()))).sort((a, b) => b.reports.length - a.reports.length || b.claims.length - a.claims.length), [data, dq, hidePh]);
  const domains = useMemo(() => {
    const m = new Map<string, number>();
    list.forEach((s) => m.set(s.domain, (m.get(s.domain) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [list]);
  if (!data) return <AtlasLoader label="Kaynak sicili yükleniyor" />;
  const pages = Math.max(1, Math.ceil(list.length / PER));
  return (
    <>
      <PageHeader
        eyebrow="Kaynak sicili"
        title="Kaynaklar"
        description="Kanıt sicilindeki 550 URL kaydı. Bu sayı 550 güvenilir veya bağımsız kaynak doğrulandığı anlamına gelmez; örnek adresleri ve tekrarlı kanıt zincirleri de bulunur."
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Kaynaklar' }]}
      />
      <Paper p="md" className="glass" mb="md">
        <Group gap="sm" wrap="wrap">
          <TextInput placeholder="URL içinde ara" leftSection={<IconSearch size={16} />} value={q} onChange={(e) => { setQ(e.currentTarget.value); setPage(1); }} style={{ flex: '1 1 260px' }} aria-label="URL ara" />
          <SegmentedControl value={view} onChange={(v) => setView(v as 'liste' | 'alan')} data={[{ value: 'liste', label: 'Liste' }, { value: 'alan', label: 'Alan adlarına göre' }]} />
          <Switch label="Örnek/yer tutucu adresleri gizle" checked={hidePh} onChange={(e) => setHidePh(e.currentTarget.checked)} />
          <Badge variant="light" size="lg">{list.length} kaynak · {domains.length} alan adı</Badge>
        </Group>
      </Paper>
      {view === 'alan' ? (
        <Section title="Alan adı dağılımı" description="En çok kaynak içeren 30 alan adı.">
          <BarChart h={760} data={domains.slice(0, 30).map(([d, n]) => ({ alan: d, Kaynak: n }))} dataKey="alan" orientation="vertical" yAxisProps={{ width: 190 }} series={[{ name: 'Kaynak', color: 'cyan.5' }]} barProps={{ radius: 5 }} gridAxis="x" />
        </Section>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="sm">
            {list.slice((page - 1) * PER, page * PER).map((s) => (
              <Paper key={s.id} p="sm" className="glass hover-lift">
                <Group justify="space-between" wrap="nowrap" mb={4}>
                  <Anchor component={Link} to={`/kaynaklar/${s.id}`} fw={600} size="sm" truncate style={{ minWidth: 0 }}>{s.domain}</Anchor>
                  <Group gap={4} wrap="nowrap"><Badge size="xs" variant="light">{s.reports.length} rapor</Badge><Badge size="xs" variant="light" color="grape">{s.claims.length} iddia</Badge></Group>
                </Group>
                <Text size="xs" c="dimmed" truncate>{pathOf(s.url, 90) || '/'}</Text>
                {s.tools.length > 0 && <Group gap={4} mt={6}>{s.tools.slice(0, 5).map((t) => <Badge key={t} size="xs" variant="dot" color="gray" style={{ textTransform: 'none' }}>{toolById.get(t)?.name}</Badge>)}</Group>}
              </Paper>
            ))}
          </SimpleGrid>
          {pages > 1 && <Group justify="center" mt="lg"><Pagination getControlProps={(c) => ({ 'aria-label': ({ first: 'İlk sayfa', previous: 'Önceki sayfa', next: 'Sonraki sayfa', last: 'Son sayfa' } as const)[c] })} total={pages} value={page} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></Group>}
        </>
      )}
      <Stack mt="md"><Text size="xs" c="dimmed">Doğrulama notu: kayıtlardaki “URL recorded; source content/support not independently verified” ifadesi korunmuştur.</Text></Stack>
    </>
  );
}
