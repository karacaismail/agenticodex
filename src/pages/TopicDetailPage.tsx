import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Grid, Group, List, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { loadClaims, loadWorkflows, meta, segmentById, toolById, topicById, topics } from '@/data';
import { useLoad } from '@/hooks/useLoad';
import { EvidenceBar, PageHeader, Section, StatusBadge, ToolCard } from '@/components/ui/atoms';
import { WorkflowCard } from '@/components/ui/cards';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import NotFoundPage from './NotFoundPage';

export default function TopicDetailPage() {
  const { id = '' } = useParams();
  const t = topicById.get(id.toUpperCase());
  const { data: wf } = useLoad(loadWorkflows);
  const { data: claims } = useLoad(loadClaims);
  if (!t) return <NotFoundPage />;
  const flow = wf?.workflows.find((w) => w.id === `konu-${t.id.toLowerCase()}`);
  const related = (wf?.workflows ?? []).filter((w) => w.topics.includes(t.id) && w.id !== flow?.id);
  const myClaims = (claims ?? []).filter((c) => c.topics.includes(t.id));
  const i = topics.findIndex((x) => x.id === t.id);
  const sections = meta.synthesis.sections.filter((s) => s.topics.includes(t.id));
  return (
    <>
      <PageHeader
        eyebrow={`Segment ${t.segment} · ${segmentById.get(t.segment)?.title ?? ''}`}
        title={`${t.id} · ${t.title}`}
        description={t.question}
        crumbs={[{ label: 'Konular', to: '/konular' }, { label: t.id }]}
        actions={
          <>
            {topics[i - 1] && <Button variant="default" component={Link} to={`/konular/${topics[i - 1].id}`}>← {topics[i - 1].id}</Button>}
            {topics[i + 1] && <Button variant="default" component={Link} to={`/konular/${topics[i + 1].id}`}>{topics[i + 1].id} →</Button>}
          </>
        }
      >
        <Group gap={6}>
          {t.tracks.map((x) => <Badge key={x} variant="light">{x}</Badge>)}
          {sections.map((s) => <Badge key={s.n} variant="outline" color="gray" style={{ textTransform: 'none' }}>Sentez §{s.n} · {s.title}</Badge>)}
        </Group>
      </PageHeader>
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, xl: 5 }}>
          <Stack gap="lg">
            <Section title="Alt sorular">
              <List type="ordered" spacing="sm" size="sm">{t.subQuestions.map((q, k) => <List.Item key={k}>{q}</List.Item>)}</List>
            </Section>
            <Section title="Beklenen çıktı"><Text size="sm">{t.expected}</Text></Section>
            {t.openCheck && (
              <Alert color="orange" variant="light" icon={<IconAlertCircle size={18} />} title="Sentezde açık kalan doğrulama">{t.openCheck}</Alert>
            )}
            <Section title={`Kanıt (${t.claimCount} iddia)`}>
              <EvidenceBar counts={t.claimStatus} size="lg" showLegend />
            </Section>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xl: 7 }}>
          <Section title="Karar akışı" description={flow?.summary}>
            {flow ? <MermaidDiagram code={flow.mermaid} fileName={flow.id} minHeight={420} /> : <AtlasLoader />}
          </Section>
        </Grid.Col>
      </Grid>
      <Stack gap="lg" mt="lg">
        {t.tools.length > 0 && (
          <Section title={`Aday araçlar (${t.tools.length})`}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
              {t.tools.slice(0, 16).map((x) => toolById.get(x)).filter(Boolean).map((x) => <ToolCard key={x!.id} t={x!} compact />)}
            </SimpleGrid>
          </Section>
        )}
        <Section title="İddialar" description="Konuya anahtar kelimeyle eşlenen iddialar.">
          {!claims && <AtlasLoader />}
          <Stack gap="xs">
            {myClaims.slice(0, 40).map((c) => (
              <Paper key={c.slug} p="sm" withBorder radius="md" component={Link} to={`/kanit/${c.slug}`} className="link-reset hover-lift">
                <Group justify="space-between" wrap="nowrap" mb={2}><Text size="xs" c="dimmed" className="mono">{c.id}</Text><StatusBadge status={c.status} size="xs" /></Group>
                <Text size="sm" lineClamp={2}>{c.statement}</Text>
              </Paper>
            ))}
            {myClaims.length > 40 && <Button variant="subtle" component={Link} to={`/kanit?konu=${t.id}`}>Tüm {myClaims.length} iddia</Button>}
          </Stack>
        </Section>
        {related.length > 0 && (
          <Section title={`İlgili iş akışları (${related.length})`}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {related.slice(0, 12).map((w) => <WorkflowCard key={w.id} w={w} familyName={wf?.families.find((f) => f.id === w.family)?.name} />)}
            </SimpleGrid>
            {related.length > 12 && <Button mt="md" variant="subtle" component={Link} to={`/akislar?konu=${t.id}`}>Tümünü katalogda gör</Button>}
          </Section>
        )}
      </Stack>
    </>
  );
}
