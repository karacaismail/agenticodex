import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Anchor, Badge, Group, MultiSelect, Paper, SimpleGrid, Stack, Table, Text } from '@mantine/core';
import { RadarChart } from '@mantine/charts';
import { goldenById, layerById, loadToolDetails, loadWorkflows, tools, toolById } from '@/data';
import { useLoad } from '@/hooks/useLoad';
import { EvidenceBar, PageHeader, RingBadge, Section } from '@/components/ui/atoms';
import { WorkflowCard } from '@/components/ui/cards';

const COLORS = ['aurora.5', 'teal.5', 'orange.5', 'pink.5'];

export default function ComparePage() {
  const [sp, setSp] = useSearchParams();
  const ids = (sp.get('ids') ?? 'a2ui,json-render').split(',').filter((i) => toolById.has(i)).slice(0, 4);
  const sel = ids.map((i) => toolById.get(i)!);
  const { data: wf } = useLoad(loadWorkflows);
  const { data: details } = useLoad(loadToolDetails);
  const radar = useMemo(() => {
    const axes: [string, (t: (typeof sel)[number]) => number][] = [
      ['Bileşik', (t) => t.composite], ['Kanıt', (t) => t.evidence ?? 0], ['Kapsama', (t) => Math.round((t.coverage / 8) * 100)],
      ['Görünürlük', (t) => t.visibility], ['Güvenlik (100−risk)', (t) => 100 - t.riskScore], ['Kaynak', (t) => Math.min(100, t.sourceCount * 5)],
    ];
    return axes.map(([k, f]) => Object.fromEntries([['eksen', k], ...sel.map((t) => [t.name, f(t)])]));
  }, [sel]);
  const shared = (wf?.workflows ?? []).filter((w) => sel.length > 1 && sel.every((t) => w.tools.includes(t.id))).slice(0, 9);
  const rows: [string, (t: (typeof sel)[number]) => React.ReactNode][] = [
    ['Tür', (t) => t.kind], ['Altın küme', (t) => goldenById.get(t.golden)?.name], ['Katman', (t) => layerById.get(t.layer)?.name],
    ['Halka', (t) => <RingBadge ring={t.ring} size="xs" />], ['Bileşik puan', (t) => t.composite], ['Kanıt', (t) => <EvidenceBar counts={t.claimStatus} size="sm" />],
    ['Kanıt puanı', (t) => t.evidence ?? '—'], ['Rapor kapsaması', (t) => `${t.coverage}/8`], ['Lisans', (t) => t.license], ['Olgunluk', (t) => `${t.maturity}${t.version ? ` · ${t.version}` : ''}`],
    ['Platform', (t) => t.platform], ['Yük', (t) => t.effort], ['Duruş', (t) => t.stance], ['Risk', (t) => `${t.riskTier} (${t.riskScore})`],
    ['Üretici', (t) => t.vendor], ['Konular', (t) => t.rTopics.join(', ')], ['Riskler', (t) => <Text size="xs">{details?.[t.id]?.risks.join(' · ') ?? '…'}</Text>],
  ];
  return (
    <>
      <PageHeader eyebrow="Yan yana" title="Karşılaştır" description="En fazla dört varlığı aynı ölçütlerle karşılaştır. Seçim URL’ye yazılır." crumbs={[{ label: 'Araçlar', to: '/araclar' }, { label: 'Karşılaştır' }]} />
      <Paper p="md" className="glass" mb="lg">
        <MultiSelect label="Varlıklar" searchable maxValues={4} data={tools.map((t) => ({ value: t.id, label: t.name }))} value={ids} onChange={(v) => setSp(v.length ? { ids: v.join(',') } : {}, { replace: true })} comboboxProps={{ withinPortal: true }} />
      </Paper>
      {sel.length < 2 ? (
        <Text c="dimmed">Karşılaştırmak için en az iki varlık seç.</Text>
      ) : (
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <Section title="Puan profili">
              <RadarChart h={320} data={radar} dataKey="eksen" withPolarRadiusAxis={false} withLegend series={sel.map((t, i) => ({ name: t.name, color: COLORS[i], opacity: 0.18 }))} />
            </Section>
            <Section title="Ortak iş akışları" description="Seçilen bütün varlıkları birlikte içeren akışlar.">
              <Stack gap="sm">
                {shared.map((w) => <WorkflowCard key={w.id} w={w} />)}
                {!shared.length && <Text size="sm" c="dimmed">Hepsini birlikte içeren akış yok. <Anchor component={Link} to="/uretici">Akış üreticiyle</Anchor> birlikte kurgula.</Text>}
              </Stack>
            </Section>
          </SimpleGrid>
          <Paper className="glass" p={0} style={{ overflow: 'auto' }}>
            <Table miw={720} verticalSpacing="sm" striped>
              <Table.Thead>
                <Table.Tr><Table.Th w={170} />{sel.map((t) => <Table.Th key={t.id}><Anchor component={Link} to={`/araclar/${t.id}`} fw={700}>{t.name}</Anchor></Table.Th>)}</Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map(([k, f]) => (
                  <Table.Tr key={k}><Table.Td><Text size="sm" c="dimmed">{k}</Text></Table.Td>{sel.map((t) => <Table.Td key={t.id}><Text size="sm" component="div">{f(t)}</Text></Table.Td>)}</Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          <Group gap={6}>{sel.map((t) => <Badge key={t.id} variant="light" style={{ textTransform: 'none' }}>{t.name}: {t.desc}</Badge>)}</Group>
        </Stack>
      )}
    </>
  );
}
