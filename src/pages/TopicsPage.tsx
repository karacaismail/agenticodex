import { Link } from 'react-router-dom';
import { Badge, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { meta, topics } from '@/data';
import { EvidenceBar, PageHeader, Section } from '@/components/ui/atoms';

export default function TopicsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Araştırma programı"
        title="28 araştırma konusu"
        description="Brief’in 7 segmenti ve 28 dosyası. Her konu ana soruyu, dört alt soruyu, beklenen çıktıyı, sentezdeki açık doğrulamayı, eşlenen iddiaları ve aday araçları taşır."
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Konular' }]}
      />
      <Stack gap="lg">
        <Section title="Bağımlılık ve yürütme hatları" description="Her dosya tek başına araştırılabilir; kararlar hat içinde birlikte verilmelidir.">
          <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }} spacing="sm">
            {meta.tracks.map((t) => (
              <Paper key={t.name} p="sm" withBorder radius="md">
                <Text fw={700} size="sm">{t.name}</Text>
                <Group gap={4} my={6}>{t.topics.map((r) => <Badge key={r} size="xs" component={Link} to={`/konular/${r}`} variant="light" style={{ cursor: 'pointer' }}>{r}</Badge>)}</Group>
                <Text size="xs" c="dimmed">{t.output}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Section>
        {meta.segments.map((s) => (
          <Section key={s.id} title={<Group gap="xs"><Badge size="lg" variant="filled">{s.id}</Badge><Text component={Link} to={`/segmentler/${s.id}`} className="link-reset" fw={700} fz={20}>{s.title}</Text></Group>}>
            <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
              {topics.filter((t) => t.segment === s.id).map((t) => (
                <Paper key={t.id} component={Link} to={`/konular/${t.id}`} p="md" className="glass hover-lift link-reset">
                  <Group justify="space-between" mb={4}><Badge variant="light" color="grape">{t.id}</Badge><Text size="xs" c="dimmed">{t.claimCount} iddia · {t.tools.length} araç</Text></Group>
                  <Title order={5} lh={1.3} mb={4}>{t.title}</Title>
                  <Text size="xs" c="dimmed" lineClamp={3} mb="xs">{t.question}</Text>
                  <EvidenceBar counts={t.claimStatus} size="xs" />
                </Paper>
              ))}
            </SimpleGrid>
          </Section>
        ))}
      </Stack>
    </>
  );
}
