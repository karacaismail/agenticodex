import { Link, useParams } from 'react-router-dom';
import { Badge, Grid, Group, Paper, Progress, SimpleGrid, Stack, Text } from '@mantine/core';
import { communityById, goldenById, loadEdges, loadWorkflows, meta, toolById } from '@/data';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section, ToolCard, ToolChip } from '@/components/ui/atoms';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import NotFoundPage from './NotFoundPage';

export default function CommunityPage() {
  const { id = '' } = useParams();
  const c = communityById.get(id);
  const { data: wf } = useLoad(loadWorkflows);
  const { data: edges } = useLoad(loadEdges);
  if (!c) return <NotFoundPage />;
  const members = c.members.map((m) => toolById.get(m)!).filter(Boolean);
  const flow = wf?.workflows.find((w) => w.id === `topluluk-${c.id.toLowerCase()}`);
  const ids = new Set(c.members);
  const inner = (edges ?? []).filter((e) => ids.has(e.a) && ids.has(e.b)).slice(0, 20);
  const golden = Object.entries(members.reduce<Record<string, number>>((acc, t) => ((acc[t.golden] = (acc[t.golden] ?? 0) + 1), acc), {})).sort((a, b) => b[1] - a[1]);
  const idx = meta.communities.findIndex((x) => x.id === c.id);
  return (
    <>
      <PageHeader
        eyebrow={`Veri güdümlü topluluk · ${c.id}`}
        title={c.name}
        description={`${members.length} varlık raporlarda aynı paragraflarda sıkça birlikte geçiyor. Yoğunluk ${c.density}, iç bağ ortalaması ${c.cohesion}. Baskın altın küme: ${goldenById.get(c.dominantGolden)?.name}.`}
        crumbs={[{ label: 'Kümeler', to: '/kumeler' }, { label: 'Topluluklar', to: '/kumeler' }, { label: c.id }]}
      >
        <Group gap={6}>
          {meta.communities[idx - 1] && <Badge component={Link} to={`/kumeler/topluluk/${meta.communities[idx - 1].id}`} variant="outline" color="gray" style={{ cursor: 'pointer' }}>← {meta.communities[idx - 1].id}</Badge>}
          {meta.communities[idx + 1] && <Badge component={Link} to={`/kumeler/topluluk/${meta.communities[idx + 1].id}`} variant="outline" color="gray" style={{ cursor: 'pointer' }}>{meta.communities[idx + 1].id} →</Badge>}
        </Group>
      </PageHeader>
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, xl: 8 }}>
          <Section title="Katman katman birlikte çalışma hattı" description={flow?.summary}>
            {flow ? <MermaidDiagram code={flow.mermaid} fileName={flow.id} minHeight={380} /> : <AtlasLoader />}
          </Section>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xl: 4 }}>
          <Stack gap="lg">
            <Section title="Altın kümelerle karşılaştırma" description="Topluluk birden çok altın kümeye yayılıyorsa, raporlar bu işleri birlikte düşünüyor demektir.">
              <Stack gap={8}>
                {golden.map(([g, n]) => (
                  <Stack key={g} gap={2}>
                    <Group justify="space-between"><Text size="xs" component={Link} to={`/altin-kumeler/${g}`} className="link-reset">{goldenById.get(g)?.name}</Text><Text size="xs" fw={700}>{n}</Text></Group>
                    <Progress value={(n / members.length) * 100} color={goldenById.get(g)?.color} radius="xl" size="sm" aria-label={`${goldenById.get(g)?.name}: ${n}`} />
                  </Stack>
                ))}
              </Stack>
            </Section>
            <Section title="En güçlü iç bağlar">
              {!edges && <AtlasLoader />}
              <Stack gap={6}>
                {inner.map((e) => (
                  <Group key={`${e.a}-${e.b}`} gap={6} wrap="nowrap">
                    <ToolChip id={e.a} name={toolById.get(e.a)?.name ?? e.a} />
                    <Text size="xs" c="dimmed">↔</Text>
                    <ToolChip id={e.b} name={toolById.get(e.b)?.name ?? e.b} />
                    <Text size="xs" c="dimmed" ml="auto">{e.c}</Text>
                  </Group>
                ))}
              </Stack>
            </Section>
          </Stack>
        </Grid.Col>
      </Grid>
      <Section title="Üyeler">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {members.map((t) => <ToolCard key={t.id} t={t} />)}
        </SimpleGrid>
      </Section>
      <Paper p="sm" mt="md" className="glass"><Text size="xs" c="dimmed">Yöntem: {meta.counts.paragraphs} tekrarsız paragraf, en az 3 ortak paragraf eşiği, kosinüs ağırlığı ≥ 0,05, Louvain modülerlik. Topluluk adı en sık geçen üç üyeden oluşur.</Text></Paper>
    </>
  );
}
