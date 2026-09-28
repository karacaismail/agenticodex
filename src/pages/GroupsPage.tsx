import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Badge, Box, Button, Collapse, Grid, Group, NavLink, Paper, ScrollArea, SegmentedControl, Select, Stack, Table, Text, ThemeIcon, Title, Tooltip,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconFilter, IconHelpCircle, IconLayoutBoard, IconTable, IconChartBar } from '@tabler/icons-react';
import { tools } from '@/data';
import { DIMENSIONS, dimensionByKey } from '@/lib/dimensions';
import { groupBy, nestedGroupBy } from '@/lib/grouping';
import { and, decodeRule, describeRule, encodeRule, filterTools, type Group as RGroup } from '@/lib/rules';
import { labelFor } from '@/lib/fieldOptions';
import { hexOf } from '@/lib/format';
import { mix, readableOn } from '@/lib/color';
import { useComputedColorScheme } from '@mantine/core';
import { PageHeader } from '@/components/ui/atoms';
import { GroupBoard } from '@/components/ui/cards';
import { RuleBuilder } from '@/components/ui/RuleBuilder';

export default function GroupsPage() {
  const pageBg = useComputedColorScheme('dark') === 'dark' ? '#16172a' : '#ffffff';
  const { dim = 'golden' } = useParams();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const d = dimensionByKey(dim) ?? DIMENSIONS[0];
  const inner = sp.get('ic') ? dimensionByKey(sp.get('ic')!) : undefined;
  const view = sp.get('gorunum') ?? 'pano';
  const rKey = sp.get('r') ?? '';
  const rule: RGroup = useMemo(() => {
    const decoded = rKey ? decodeRule(rKey) : null;
    return decoded && decoded.kind === 'group' ? decoded : and();
  }, [rKey]);
  const [showRule, setShowRule] = useState(rule.children.length > 0);

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };

  const pool = useMemo(() => filterTools(tools, rule), [rule]);
  const groups = useMemo(() => (inner && inner.key !== d.key ? nestedGroupBy(pool, d, inner) : groupBy(pool, d)), [pool, d, inner]);
  const chartData = groups.map((g) => ({ grup: g.label.length > 26 ? g.label.slice(0, 25) + '…' : g.label, Sayı: g.items.length }));
  const innerKeys = useMemo(() => (inner ? groupBy(pool, inner).map((g) => ({ key: g.key, label: g.label })) : []), [pool, inner]);
  const qs = sp.toString() ? `?${sp.toString()}` : '';

  return (
    <>
      <PageHeader
        eyebrow="Dinamik gruplar"
        title="Gruplama laboratuvarı"
        description="Aynı varlıkları farklı sorulara göre grupla, iç içe geçir ve koşulla daralt. Her boyut bir karar sorusunu yanıtlar; seçim URL’ye yazılır, bağlantıyı paylaşabilirsin."
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Gruplama laboratuvarı' }, { label: d.label }]}
      />
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper className="glass" p="xs" pos="sticky" top={76}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" py={6}>Neye göre?</Text>
            <ScrollArea.Autosize mah="calc(100vh - 170px)" type="hover" viewportProps={{ tabIndex: 0, 'aria-label': 'Gruplama boyutları' }}>
              {DIMENSIONS.map((x) => (
                <NavLink
                  key={x.key}
                  active={x.key === d.key}
                  label={x.label}
                  description={x.question}
                  onClick={() => navigate(`/gruplar/${x.key}${qs}`)}
                  rightSection={x.type === 'multi' ? <Tooltip label="Çok değerli: bir varlık birden çok grupta olabilir"><Badge size="xs" variant="light" color="grape">çoklu</Badge></Tooltip> : undefined}
                  styles={{ description: { lineHeight: 1.3 } }}
                  style={{ borderRadius: 10 }}
                />
              ))}
            </ScrollArea.Autosize>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 9 }}>
          <Stack gap="md">
            <Paper p="md" className="glass">
              <Group align="flex-start" wrap="nowrap" gap="md">
                <ThemeIcon size={40} radius="md" variant="light"><IconHelpCircle size={22} /></ThemeIcon>
                <Stack gap={4}>
                  <Title order={3} fz={20}>{d.label}: {d.question}</Title>
                  <Text size="sm" c="dimmed">{d.rationale}</Text>
                </Stack>
              </Group>
              <Group mt="md" gap="sm" wrap="wrap">
                <Select
                  label="İç gruplama (ikinci boyut)" size="xs" w={260} clearable placeholder="Yok"
                  data={DIMENSIONS.filter((x) => x.key !== d.key).map((x) => ({ value: x.key, label: x.label }))}
                  value={inner?.key ?? null} onChange={(v) => set('ic', v)} comboboxProps={{ withinPortal: true }}
                />
                <Stack gap={4}>
                  <Text size="xs" fw={500}>Görünüm</Text>
                  <SegmentedControl size="xs" value={view} onChange={(v) => set('gorunum', v === 'pano' ? null : v)}
                    data={[
                      { value: 'pano', label: <Group gap={4} wrap="nowrap"><IconLayoutBoard size={14} />Pano</Group> },
                      { value: 'matris', label: <Group gap={4} wrap="nowrap"><IconTable size={14} />Matris</Group> },
                      { value: 'grafik', label: <Group gap={4} wrap="nowrap"><IconChartBar size={14} />Grafik</Group> },
                    ]} />
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" fw={500}>Koşullu filtre</Text>
                  <Button size="xs" variant={rule.children.length ? 'filled' : 'light'} leftSection={<IconFilter size={14} />} onClick={() => setShowRule((s) => !s)}>
                    {rule.children.length ? `${rule.children.length} koşul` : 'Koşul ekle'}
                  </Button>
                </Stack>
                <Badge size="lg" variant="light" color="aurora" mt="lg">{pool.length} / {tools.length} varlık · {groups.length} grup</Badge>
              </Group>
              <Collapse expanded={showRule}>
                <Box mt="md">
                  <RuleBuilder value={rule} onChange={(g) => set('r', g.children.length ? encodeRule(g) : null)} />
                  {rule.children.length > 0 && (
                    <Group mt="xs" gap="xs">
                      <Button size="xs" variant="subtle" component={Link} to={`/kumeler/ozel?r=${encodeRule(rule)}`}>Bu koşulu dinamik kümeye çevir</Button>
                      <Button size="xs" variant="subtle" color="gray" onClick={() => set('r', null)}>Koşulu temizle</Button>
                    </Group>
                  )}
                </Box>
              </Collapse>
              {rule.children.length > 0 && !showRule && <Text size="xs" c="dimmed" mt="xs">Koşul: {describeRule(rule, (f, v) => labelFor(f, v))}</Text>}
            </Paper>

            {view === 'pano' && (
              <GroupBoard groups={groups} linkFor={(g) => (g.key === '—' ? undefined : `/gruplar/${d.key}/${encodeURIComponent(g.key)}`)} />
            )}

            {view === 'grafik' && (
              <Paper p="md" className="glass">
                <BarChart h={Math.max(260, groups.length * 30)} data={chartData} dataKey="grup" orientation="vertical" yAxisProps={{ width: 190 }} series={[{ name: 'Sayı', color: 'aurora.5' }]} barProps={{ radius: 6 }} gridAxis="x" />
              </Paper>
            )}

            {view === 'matris' && (
              <Paper p={0} className="glass" style={{ overflow: 'auto' }}>
                {!inner ? (
                  <Text p="md" size="sm" c="dimmed">Matris için bir iç gruplama (ikinci boyut) seç.</Text>
                ) : (
                  <Table miw={Math.max(600, innerKeys.length * 64 + 240)} verticalSpacing={4} horizontalSpacing={6} withColumnBorders={false}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{d.label} \ {inner.label}</Table.Th>
                        {innerKeys.map((k) => <Table.Th key={k.key} style={{ fontSize: 11, fontWeight: 500, maxWidth: 90 }}>{k.label}</Table.Th>)}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {groups.map((g) => {
                        const max = Math.max(1, ...groups.flatMap((x) => (x.children ?? []).map((c) => c.items.length)));
                        return (
                          <Table.Tr key={g.key}>
                            <Table.Td><Text size="xs" fw={600} component={Link} to={`/gruplar/${d.key}/${encodeURIComponent(g.key)}`} className="link-reset">{g.label}</Text></Table.Td>
                            {innerKeys.map((k) => {
                              const c = g.children?.find((x) => x.key === k.key);
                              const n = c?.items.length ?? 0;
                              return (
                                <Table.Td key={k.key} p={2}>
                                  <Tooltip label={n ? c!.items.map((t) => t.name).join(', ') : 'Boş'} multiline w={260} disabled={!n}>
                                    <Box h={26} style={{ display: 'grid', placeItems: 'center', borderRadius: 6, fontSize: 12, fontWeight: 700, ...(n ? (() => { const bg = mix(hexOf(g.color ?? 'aurora'), pageBg, 0.22 + 0.78 * (n / max)); return { background: bg, color: readableOn(bg) }; })() : { background: 'var(--atlas-muted-line)' }) }}>
                                      {n || ''}
                                    </Box>
                                  </Tooltip>
                                </Table.Td>
                              );
                            })}
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                )}
              </Paper>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
}
