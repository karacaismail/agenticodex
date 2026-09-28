import { Link, useParams } from 'react-router-dom';
import { Badge, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { meta, segmentById, tools, topics } from '@/data';
import { EvidenceBar, PageHeader, Section, ToolCard } from '@/components/ui/atoms';
import NotFoundPage from './NotFoundPage';

export default function SegmentPage() {
  const { id = '' } = useParams();
  const s = segmentById.get(id.toUpperCase());
  if (!s) return <NotFoundPage />;
  const ts = topics.filter((t) => t.segment === s.id);
  const segTools = tools.filter((t) => t.segments.includes(s.id)).sort((a, b) => b.composite - a.composite);
  const idx = meta.segments.findIndex((x) => x.id === s.id);
  return (
    <>
      <PageHeader eyebrow={`Segment ${s.id}`} title={s.title} description={`${ts.length} araştırma konusu ve ${segTools.length} ilgili varlık.`} crumbs={[{ label: 'Konular', to: '/konular' }, { label: `Segment ${s.id}` }]}>
        <Group gap={6}>
          {meta.segments[idx - 1] && <Badge component={Link} to={`/segmentler/${meta.segments[idx - 1].id}`} variant="outline" color="gray" style={{ cursor: 'pointer' }}>← {meta.segments[idx - 1].id}</Badge>}
          {meta.segments[idx + 1] && <Badge component={Link} to={`/segmentler/${meta.segments[idx + 1].id}`} variant="outline" color="gray" style={{ cursor: 'pointer' }}>{meta.segments[idx + 1].id} →</Badge>}
        </Group>
      </PageHeader>
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {ts.map((t) => (
            <Paper key={t.id} component={Link} to={`/konular/${t.id}`} p="md" className="glass hover-lift link-reset">
              <Badge variant="light" color="grape" mb={4}>{t.id}</Badge>
              <Title order={5}>{t.title}</Title>
              <Text size="sm" c="dimmed" my={6}>{t.question}</Text>
              <EvidenceBar counts={t.claimStatus} size="xs" />
            </Paper>
          ))}
        </SimpleGrid>
        <Section title="Segmentin varlıkları">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">{segTools.map((t) => <ToolCard key={t.id} t={t} compact />)}</SimpleGrid>
        </Section>
      </Stack>
    </>
  );
}
