import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Grid, Group, Paper, SimpleGrid, Stack, Table, Text, ThemeIcon } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { IconCheck, IconEdit, IconX } from '@tabler/icons-react';
import { goldenById, loadWorkflows, meta, tools } from '@/data';
import { SMART_CLUSTERS } from '@/lib/presets';
import { describeRule, encodeRule, evaluate, filterTools, type Rule } from '@/lib/rules';
import { labelFor } from '@/lib/fieldOptions';
import { groupBy } from '@/lib/grouping';
import { dimensionByKey } from '@/lib/dimensions';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, RingBadge, Section, ToolCard } from '@/components/ui/atoms';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import NotFoundPage from './NotFoundPage';

/** Kökteki koşulları tek tek değerlendirip hangi koşulun sağlandığını gösterir. */
function topConditions(rule: Rule): Rule[] {
  return rule.kind === 'group' ? rule.children : [rule];
}

export default function SmartClusterPage() {
  const { id = '' } = useParams();
  const c = SMART_CLUSTERS.find((x) => x.id === id);
  const members = useMemo(() => (c ? filterTools(tools, c.rule).sort((a, b) => b.composite - a.composite) : []), [c]);
  const { data: wf } = useLoad(loadWorkflows);
  if (!c) return <NotFoundPage />;
  const flow = wf?.workflows.find((w) => w.id === `kume-${c.id}`);
  const parts = topConditions(c.rule);
  const byGolden = groupBy(members, dimensionByKey('golden')!).map((g) => ({ name: g.label, value: g.items.length, color: `${goldenById.get(g.key)?.color ?? 'gray'}.6` }));
  const near = tools.filter((t) => !evaluate(c.rule, t) && parts.length > 1 && parts.filter((p) => evaluate(p, t)).length === parts.length - 1).slice(0, 12);

  return (
    <>
      <PageHeader
        eyebrow="Akıllı küme · koşullu"
        title={c.name}
        description={c.why}
        crumbs={[{ label: 'Kümeler', to: '/kumeler' }, { label: c.name }]}
        actions={<Button variant="light" component={Link} to={`/kumeler/ozel?r=${encodeRule(c.rule.kind === 'group' ? c.rule : { kind: 'group', combinator: 'and', children: [c.rule] })}&ad=${encodeURIComponent(c.name)}`} leftSection={<IconEdit size={16} />}>Koşulu düzenle</Button>}
      >
        <Paper p="sm" className="glass">
          <Text size="xs" c="dimmed">Koşul</Text>
          <Text className="mono" size="sm">{describeRule(c.rule, (f, v) => labelFor(f, v))}</Text>
        </Paper>
      </PageHeader>
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, xl: 8 }}>
          <Section title="Eylem akışı" description={flow?.summary}>
            {flow ? <MermaidDiagram code={flow.mermaid} fileName={flow.id} minHeight={360} /> : <AtlasLoader label="Akış yükleniyor" />}
          </Section>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xl: 4 }}>
          <Section title={`${members.length} üye`} description="Altın kümelere dağılım.">
            {members.length ? <DonutChart data={byGolden} size={180} thickness={24} mx="auto" withTooltip tooltipDataSource="segment" chartLabel={`${members.length}`} /> : <Text c="dimmed">Şu an üye yok.</Text>}
          </Section>
        </Grid.Col>
      </Grid>
      <Stack gap="lg" mt="lg">
        {parts.length > 1 && members.length > 0 && (
          <Section title="Neden bu üyeler?" description="Kökteki her koşulun her üye için sonucu.">
            <Paper p={0} style={{ overflow: 'auto' }} bg="transparent">
              <Table miw={600} verticalSpacing={6}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Üye</Table.Th>
                    {parts.map((p, i) => <Table.Th key={i} style={{ fontSize: 11, fontWeight: 500 }}>{describeRule(p, (f, v) => labelFor(f, v))}</Table.Th>)}
                    <Table.Th>Halka</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {members.slice(0, 40).map((t) => (
                    <Table.Tr key={t.id}>
                      <Table.Td><Text component={Link} to={`/araclar/${t.id}`} size="sm" fw={600} className="link-reset">{t.name}</Text></Table.Td>
                      {parts.map((p, i) => (
                        <Table.Td key={i}>
                          {evaluate(p, t) ? <ThemeIcon size="sm" color="teal" variant="light" radius="xl"><IconCheck size={12} /></ThemeIcon> : <ThemeIcon size="sm" color="gray" variant="light" radius="xl"><IconX size={12} /></ThemeIcon>}
                        </Table.Td>
                      ))}
                      <Table.Td><RingBadge ring={t.ring} size="xs" /></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Section>
        )}
        <Section title="Üyeler">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {members.map((t) => <ToolCard key={t.id} t={t} />)}
          </SimpleGrid>
        </Section>
        {near.length > 0 && (
          <Section title="Sınırda kalanlar" description="Kök koşullardan yalnız birini sağlamayan varlıklar: küme sınırını anlamak için.">
            <Group gap={6}>{near.map((t) => <Badge key={t.id} component={Link} to={`/araclar/${t.id}`} variant="outline" color="gray" style={{ cursor: 'pointer', textTransform: 'none' }}>{t.name}</Badge>)}</Group>
          </Section>
        )}
        <Text size="xs" c="dimmed">Bu küme {meta.counts.tools} varlığa çalışma anında uygulanır; veri yeniden üretildiğinde üyelik kendiliğinden güncellenir.</Text>
      </Stack>
    </>
  );
}
