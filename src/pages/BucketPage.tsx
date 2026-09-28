import { Link, useParams } from 'react-router-dom';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { loadWorkflows, tools } from '@/data';
import { BUCKET_SCHEMES } from '@/lib/presets';
import { bucketize } from '@/lib/grouping';
import { describeRule, encodeJSON } from '@/lib/rules';
import { labelFor } from '@/lib/fieldOptions';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section } from '@/components/ui/atoms';
import { GroupBoard } from '@/components/ui/cards';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import NotFoundPage from './NotFoundPage';

export default function BucketPage() {
  const { id = '' } = useParams();
  const s = BUCKET_SCHEMES.find((x) => x.id === id);
  const { data: wf } = useLoad(loadWorkflows);
  if (!s) return <NotFoundPage />;
  const groups = bucketize(tools, s.buckets, s.restLabel);
  const flow = wf?.workflows.find((w) => w.id === `kova-${s.id}`);
  return (
    <>
      <PageHeader
        eyebrow="Koşullu gruplama"
        title={s.name}
        description={s.why}
        crumbs={[{ label: 'Kümeler', to: '/kumeler' }, { label: 'Koşullu kovalar', to: '/kumeler' }, { label: s.name }]}
        actions={<Button variant="light" leftSection={<IconEdit size={16} />} component={Link} to={`/kumeler/ozel?k=${encodeJSON(s.buckets)}`}>Kopyala ve düzenle</Button>}
      />
      <Stack gap="lg">
        <Section title="Kovalar ve koşulları" description="Sıra önemlidir: ilk eşleşen kova kazanır.">
          <Stack gap={6}>
            {s.buckets.map((b, i) => (
              <Paper key={b.id} p="xs" withBorder radius="md">
                <Group gap="xs" wrap="nowrap"><Text fw={700} size="sm" w={24}>{i + 1}.</Text><Text fw={600} size="sm">{b.label}</Text><Text size="xs" c="dimmed" className="mono" truncate>{describeRule(b.rule, (f, v) => labelFor(f, v))}</Text></Group>
              </Paper>
            ))}
            <Text size="xs" c="dimmed">Eşleşmeyenler: {s.restLabel}</Text>
          </Stack>
        </Section>
        <Section title="Karar akışı">{flow ? <MermaidDiagram code={flow.mermaid} fileName={flow.id} minHeight={320} /> : <AtlasLoader />}</Section>
        <Section title="Sonuç"><GroupBoard groups={groups} maxItems={24} /></Section>
      </Stack>
    </>
  );
}
