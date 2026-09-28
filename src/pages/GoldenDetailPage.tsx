import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Grid, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconLayersIntersect } from '@tabler/icons-react';
import { goldenById, loadWorkflows, meta, toolById } from '@/data';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section, ToolCard } from '@/components/ui/atoms';
import { WorkflowCard } from '@/components/ui/cards';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import { STANCE_ORDER, STANCE_COLOR } from '@/lib/dimensions';
import NotFoundPage from './NotFoundPage';

export default function GoldenDetailPage() {
  const { id = '' } = useParams();
  const g = goldenById.get(id);
  const { data: wf } = useLoad(loadWorkflows);
  if (!g) return <NotFoundPage />;
  const members = g.members.map((m) => toolById.get(m)!).filter(Boolean);
  const pipeline = wf?.workflows.find((w) => w.id === `altin-${g.id.toLowerCase()}`);
  const related = (wf?.workflows ?? []).filter((w) => w.golden.includes(g.id) && w.id !== pipeline?.id);
  const idx = meta.golden.findIndex((x) => x.id === g.id);
  const prev = meta.golden[idx - 1];
  const next = meta.golden[idx + 1];
  return (
    <>
      <PageHeader
        eyebrow={`${g.ring === 'core' ? 'Çekirdek küme' : 'Destek halkası'} · ${g.id}`}
        title={g.name}
        description={g.job}
        crumbs={[{ label: 'Altın kümeler', to: '/altin-kumeler' }, { label: g.name }]}
        actions={
          <>
            <Button variant="light" component={Link} to={`/gruplar/golden/${g.id}`} leftSection={<IconLayersIntersect size={16} />}>Grup profili</Button>
            {prev && <Button variant="subtle" component={Link} to={`/altin-kumeler/${prev.id}`}>← {prev.id}</Button>}
            {next && <Button variant="subtle" component={Link} to={`/altin-kumeler/${next.id}`}>{next.id} →</Button>}
          </>
        }
      />
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, xl: 7 }}>
          <Section title="Küme hattı" description={pipeline?.summary}>
            {pipeline ? <MermaidDiagram code={pipeline.mermaid} fileName={pipeline.id} minHeight={360} /> : <AtlasLoader label="Hat yükleniyor" />}
          </Section>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xl: 5 }}>
          <Section title="Rol dağılımı" description="Raporların önerdiği duruşa göre.">
            <Stack gap="sm">
              {STANCE_ORDER.map((s) => {
                const list = members.filter((t) => t.stance === s);
                if (!list.length) return null;
                return (
                  <Stack key={s} gap={4}>
                    <Group gap={6}><Badge color={STANCE_COLOR[s]} variant="light">{s}</Badge><Text size="xs" c="dimmed">{list.length}</Text></Group>
                    <Group gap={4}>
                      {list.map((t) => <Badge key={t.id} component={Link} to={`/araclar/${t.id}`} variant="outline" color="gray" style={{ cursor: 'pointer', textTransform: 'none' }}>{t.name}</Badge>)}
                    </Group>
                  </Stack>
                );
              })}
            </Stack>
          </Section>
        </Grid.Col>
      </Grid>
      <Stack gap="lg" mt="lg">
        <Section title={`Üyeler (${members.length})`} description="Bileşik puana göre sıralı.">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {members.map((t) => <ToolCard key={t.id} t={t} />)}
          </SimpleGrid>
        </Section>
        {related.length > 0 && (
          <Section title={`Bu kümeye dokunan iş akışları (${related.length})`}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {related.slice(0, 18).map((w) => <WorkflowCard key={w.id} w={w} familyName={wf?.families.find((f) => f.id === w.family)?.name} />)}
            </SimpleGrid>
            {related.length > 18 && <Button mt="md" variant="subtle" component={Link} to={`/akislar?kume=${g.id}`}>Tümünü katalogda gör</Button>}
          </Section>
        )}
      </Stack>
    </>
  );
}
