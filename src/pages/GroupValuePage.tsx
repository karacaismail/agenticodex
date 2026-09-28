import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconAffiliate, IconArrowLeft } from '@tabler/icons-react';
import { loadWorkflows, tools } from '@/data';
import { DIMENSIONS, dimensionByKey, ruleForGroup } from '@/lib/dimensions';
import { groupBy } from '@/lib/grouping';
import { encodeRule, filterTools } from '@/lib/rules';
import { hexOf } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section, ToolCard } from '@/components/ui/atoms';
import { WorkflowCard } from '@/components/ui/cards';
import NotFoundPage from './NotFoundPage';

export default function GroupValuePage() {
  const { dim = '', value = '' } = useParams();
  const d = dimensionByKey(dim);
  const key = decodeURIComponent(value);
  const rule = d ? ruleForGroup(d.key, key) : null;
  const members = useMemo(() => (rule ? filterTools(tools, rule).sort((a, b) => b.composite - a.composite) : []), [rule]);
  const { data: wf } = useLoad(loadWorkflows);
  if (!d || !rule || !members.length) return <NotFoundPage />;
  const label = d.labelFor ? d.labelFor(key) : key;
  const ids = new Set(members.map((m) => m.id));
  const related = (wf?.workflows ?? [])
    .map((w) => ({ w, n: w.tools.filter((t) => ids.has(t)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.w.id.localeCompare(b.w.id))
    .slice(0, 12);
  const siblings = groupBy(tools, d);
  const pos = siblings.findIndex((g) => g.key === key);
  const others = DIMENSIONS.filter((x) => x.key !== d.key && x.type === 'single').slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow={`${d.label} grubu`}
        title={label}
        description={d.descFor?.(key) || `${d.question} sorusuna göre “${label}” grubunda ${members.length} varlık var.`}
        crumbs={[{ label: 'Gruplama laboratuvarı', to: '/gruplar' }, { label: d.label, to: `/gruplar/${d.key}` }, { label }]}
        actions={
          <>
            <Button variant="default" component={Link} to={`/gruplar/${d.key}`} leftSection={<IconArrowLeft size={16} />}>Bütün gruplar</Button>
            <Button variant="light" component={Link} to={`/kumeler/ozel?r=${encodeRule(rule)}`} leftSection={<IconAffiliate size={16} />}>Koşullu kümeye çevir</Button>
          </>
        }
      >
        <Group gap={6}>
          {pos > 0 && <Badge component={Link} to={`/gruplar/${d.key}/${encodeURIComponent(siblings[pos - 1].key)}`} variant="outline" color="gray" style={{ cursor: 'pointer', textTransform: 'none' }}>← {siblings[pos - 1].label}</Badge>}
          {pos < siblings.length - 1 && pos >= 0 && <Badge component={Link} to={`/gruplar/${d.key}/${encodeURIComponent(siblings[pos + 1].key)}`} variant="outline" color="gray" style={{ cursor: 'pointer', textTransform: 'none' }}>{siblings[pos + 1].label} →</Badge>}
        </Group>
      </PageHeader>

      <Stack gap="lg">
        <Section title="Bu grubun profili" description="Diğer boyutlara göre dağılım: grubun iç yapısı.">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {others.map((o) => {
              const gs = groupBy(members, o).slice(0, 5);
              return (
                <Paper key={o.key} p="sm" withBorder radius="md">
                  <Title order={6} mb={6}>{o.label}</Title>
                  <Stack gap={6}>
                    {gs.map((g) => (
                      <Stack key={g.key} gap={2}>
                        <Group justify="space-between" gap={4} wrap="nowrap">
                          <Text size="xs" truncate style={{ minWidth: 0 }}>{g.label}</Text>
                          <Text size="xs" fw={700}>{g.items.length}</Text>
                        </Group>
                        <Progress value={(g.items.length / members.length) * 100} size="sm" radius="xl" color={g.color ?? 'aurora'} aria-label={`${g.label}: ${g.items.length}`} />
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Section>
        <Section title={`Üyeler (${members.length})`}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {members.map((t) => <ToolCard key={t.id} t={t} />)}
          </SimpleGrid>
        </Section>
        {related.length > 0 && (
          <Section title="Bu grubun üyelerini en çok içeren iş akışları">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {related.map(({ w }) => <WorkflowCard key={w.id} w={w} familyName={wf?.families.find((f) => f.id === w.family)?.name} />)}
            </SimpleGrid>
          </Section>
        )}
        <Paper p="sm" className="glass" style={{ borderLeft: `3px solid ${hexOf(d.colorFor?.(key) ?? 'aurora')}` }}>
          <Text size="xs" c="dimmed">Neye göre? {d.rationale}</Text>
        </Paper>
      </Stack>
    </>
  );
}
