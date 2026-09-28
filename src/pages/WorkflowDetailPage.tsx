import { Link, useParams } from 'react-router-dom';
import {
  Anchor, Badge, Button, Grid, Group, List, Paper, SimpleGrid, Stack, Text, ThemeIcon, Timeline, Tooltip,
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconCircleCheck, IconGitBranch } from '@tabler/icons-react';
import { goldenById, layerById, loadWorkflows, toolById, topicById } from '@/data';
import { DIAGRAM_COLOR, DIAGRAM_LABEL } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section, ToolChip } from '@/components/ui/atoms';
import { Complexity, DIAGRAM_ICON, WorkflowCard } from '@/components/ui/cards';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import NotFoundPage from './NotFoundPage';

const loadReport = () => import('@/data/generated/mermaid-report.json').then((m) => m.default as { versions: Record<string, { exact: string }>; failures: { id: string }[] });

export default function WorkflowDetailPage() {
  const { id = '' } = useParams();
  const { data } = useLoad(loadWorkflows);
  const { data: report } = useLoad(loadReport);
  if (!data) return <AtlasLoader label="İş akışı yükleniyor" />;
  const w = data.workflows.find((x) => x.id === id);
  if (!w) return <NotFoundPage />;
  const fam = data.families.find((f) => f.id === w.family);
  const sameFam = data.workflows.filter((x) => x.family === w.family);
  const i = sameFam.findIndex((x) => x.id === w.id);
  const prev = sameFam[i - 1];
  const next = sameFam[i + 1];
  const tset = new Set(w.tools);
  const similar = data.workflows
    .filter((x) => x.id !== w.id)
    .map((x) => ({ x, s: x.tools.filter((t) => tset.has(t)).length * 2 + x.topics.filter((t) => w.topics.includes(t)).length + (x.family === w.family ? 0.5 : 0) }))
    .filter((o) => o.s > 1)
    .sort((a, b) => b.s - a.s || a.x.id.localeCompare(b.x.id))
    .slice(0, 6)
    .map((o) => o.x);
  const Icon = DIAGRAM_ICON[w.diagram];
  const failed = report?.failures.some((f) => f.id === w.id);

  return (
    <>
      <PageHeader
        eyebrow={fam?.name ?? 'İş akışı'}
        title={w.title}
        description={w.summary}
        crumbs={[{ label: 'İş akışları', to: '/akislar' }, ...(fam ? [{ label: fam.name, to: `/akislar/aile/${fam.id}` }] : []), { label: w.title }]}
        actions={
          <>
            {prev && <Button variant="default" component={Link} to={`/akislar/${prev.id}`} leftSection={<IconArrowLeft size={16} />}>Önceki</Button>}
            {next && <Button variant="default" component={Link} to={`/akislar/${next.id}`} rightSection={<IconArrowRight size={16} />}>Sonraki</Button>}
          </>
        }
      >
        <Group gap={6}>
          <Badge color={DIAGRAM_COLOR[w.diagram]} variant="light" leftSection={<Icon size={12} />}>{DIAGRAM_LABEL[w.diagram]}</Badge>
          <Complexity n={w.complexity} />
          <Text size="xs" c="dimmed">{w.steps.length} adım · {w.conditions.length} koşul</Text>
          {report && (
            <Tooltip label={`Derleme doğrulaması: ${Object.values(report.versions).map((v) => v.exact).join(' · ')}`}>
              <Badge color={failed ? 'red' : 'teal'} variant="dot">{failed ? 'Doğrulama hatası' : 'Mermaid 10.9 · 11.17 · 12.0 ✓'}</Badge>
            </Tooltip>
          )}
        </Group>
      </PageHeader>

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, xl: 8 }}>
          <Section title="Diyagram">
            <MermaidDiagram code={w.mermaid} title={undefined} fileName={w.id} minHeight={460} />
          </Section>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xl: 4 }}>
          <Stack gap="lg">
            {w.conditions.length > 0 && (
              <Section title="Neden bu dallar?" description="Akışı biçimlendiren koşullar.">
                <List spacing={6} size="sm" icon={<ThemeIcon size={18} radius="xl" variant="light" color="orange"><IconGitBranch size={12} /></ThemeIcon>}>
                  {w.conditions.map((c, k) => <List.Item key={k}>{c}</List.Item>)}
                </List>
              </Section>
            )}
            <Section title="Bağlam">
              <Stack gap="sm">
                {w.tools.length > 0 && <Group gap={4}>{w.tools.map((t) => <ToolChip key={t} id={t} name={toolById.get(t)?.name ?? t} />)}</Group>}
                {w.topics.length > 0 && (
                  <Group gap={4}>
                    {w.topics.map((t) => <Badge key={t} component={Link} to={`/konular/${t}`} variant="outline" color="grape" style={{ cursor: 'pointer', textTransform: 'none' }}>{t} · {topicById.get(t)?.short}</Badge>)}
                  </Group>
                )}
                {w.golden.length > 0 && (
                  <Group gap={4}>{w.golden.map((g) => <Badge key={g} component={Link} to={`/altin-kumeler/${g}`} color={goldenById.get(g)?.color} variant="light" style={{ cursor: 'pointer', textTransform: 'none' }}>{goldenById.get(g)?.name}</Badge>)}</Group>
                )}
                {w.layers.length > 0 && <Text size="xs" c="dimmed">Katmanlar: {w.layers.map((l) => layerById.get(l)?.name).join(' · ')}</Text>}
                {w.tags.length > 0 && <Group gap={4}>{w.tags.map((t) => <Badge key={t} size="xs" variant="dot" color="gray" style={{ textTransform: 'none' }}>{t}</Badge>)}</Group>}
              </Stack>
            </Section>
          </Stack>
        </Grid.Col>
      </Grid>

      <Grid gap="lg" mt="lg">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Section title="Adımlar" description="Diyagramla aynı sırada; koşullu adımlar etiketlidir.">
            <Timeline active={w.steps.length} bulletSize={22} lineWidth={2}>
              {w.steps.map((s, k) => (
                <Timeline.Item key={k} bullet={<IconCircleCheck size={13} />} title={<Text size="sm" fw={600}>{s.title}</Text>}>
                  {s.detail && <Text size="xs" c="dimmed">{s.detail}</Text>}
                  {s.condition && <Badge size="xs" mt={4} variant="light" color="orange" style={{ textTransform: 'none' }}>Koşul: {s.condition}</Badge>}
                </Timeline.Item>
              ))}
            </Timeline>
          </Section>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Section title="Benzer akışlar" description="Ortak araç ve konu sayısına göre.">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {similar.map((x) => <WorkflowCard key={x.id} w={x} familyName={data.families.find((f) => f.id === x.family)?.name} />)}
            </SimpleGrid>
            {!similar.length && <Text size="sm" c="dimmed">Belirgin benzer akış yok.</Text>}
          </Section>
          <Paper p="sm" mt="md" className="glass">
            <Text size="xs" c="dimmed">
              Aile içinde {i + 1}/{sameFam.length}. <Anchor component={Link} to={`/akislar/aile/${w.family}`} size="xs">Aileyi gör</Anchor> · <Anchor component={Link} to="/mermaid-sagligi" size="xs">Sürüm doğrulama raporu</Anchor>
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </>
  );
}
