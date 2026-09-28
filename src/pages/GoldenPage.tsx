import { Link } from 'react-router-dom';
import { Badge, Box, Group, Paper, SimpleGrid, Stack, Table, Text, Tooltip } from '@mantine/core';
import { meta, toolById, tools } from '@/data';
import { EvidenceBar, PageHeader, Section } from '@/components/ui/atoms';
import { hexOf } from '@/lib/format';
import { mix, readableOn } from '@/lib/color';
import { useComputedColorScheme } from '@mantine/core';
import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';
import type { ClaimStatus } from '@/data/types';

function sumStatus(ids: string[]) {
  const out: Record<ClaimStatus, number> = { supported: 0, unverified: 0, disputed: 0, rejected: 0 };
  ids.forEach((id) => {
    const t = toolById.get(id);
    if (t) (Object.keys(out) as ClaimStatus[]).forEach((k) => (out[k] += t.claimStatus[k]));
  });
  return out;
}

export default function GoldenPage() {
  const pageBg = useComputedColorScheme('dark') === 'dark' ? '#16172a' : '#ffffff';
  const layers = meta.layers;
  const max = Math.max(...meta.golden.flatMap((g) => layers.map((l) => tools.filter((t) => t.golden === g.id && t.layer === l.id).length)));
  return (
    <>
      <PageHeader
        eyebrow="İdeal gruplama"
        title="Altın kümeler"
        description="Varlıklar ürünü kurarken çözdükleri işe göre 12 çekirdek kümeye ve 3 destek halkasına ayrıldı. Her kümenin tek bir işi var; bir kümeden tek ana seçim yapıp diğerlerini yedek tutmak, aynı katmanda çakışan araç yığınını önler."
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Altın kümeler' }]}
      />
      <Stack gap="xl">
        {(['core', 'support'] as const).map((ring) => (
          <Section key={ring} title={ring === 'core' ? 'Çekirdek kümeler' : 'Destek halkaları'} description={ring === 'core' ? 'Ürünün doğrudan yapı taşları.' : 'Kararları besleyen kanıt, arka uç ve platform.'}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {meta.golden.filter((g) => g.ring === ring).map((g) => {
                const members = g.members.map((m) => toolById.get(m)!).filter(Boolean);
                const core = members.filter((t) => t.stance === 'Çekirdek aday');
                const proto = members.filter((t) => t.stance === 'Prototip adayı');
                const avg = Math.round(members.reduce((s, t) => s + t.composite, 0) / Math.max(1, members.length));
                return (
                  <Link key={g.id} to={`/altin-kumeler/${g.id}`} className="link-reset" aria-label={g.name}>
                    <SpotlightCard className="hover-lift" spotlightColor="rgba(112, 80, 253, 0.16)">
                      <Box h={4} style={{ background: hexOf(g.color), borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
                      <Stack gap={8} p="md">
                        <Group justify="space-between" wrap="nowrap">
                          <Badge color={g.color} variant="filled">{g.id}</Badge>
                          <Group gap={6}><Badge variant="light" color="gray">{members.length} üye</Badge><Badge variant="light" color="aurora">ort. {avg}</Badge></Group>
                        </Group>
                        <Text fw={700} size="lg" lh={1.25}>{g.name}</Text>
                        <Text size="sm" c="dimmed" lineClamp={2}>{g.job}</Text>
                        <Group gap={4}>
                          {core.map((t) => <Badge key={t.id} size="xs" color="teal" variant="light" style={{ textTransform: 'none' }}>★ {t.name}</Badge>)}
                          {proto.slice(0, 4).map((t) => <Badge key={t.id} size="xs" color="blue" variant="light" style={{ textTransform: 'none' }}>{t.name}</Badge>)}
                        </Group>
                        <EvidenceBar counts={sumStatus(g.members)} size="xs" />
                      </Stack>
                    </SpotlightCard>
                  </Link>
                );
              })}
            </SimpleGrid>
          </Section>
        ))}
        <Section title="Altın küme × mimari katman matrisi" description="Hücre koyuluğu üye sayısını gösterir. Aynı hücrede birden fazla araç çoğu zaman alternatiftir.">
          <Paper p={0} style={{ overflow: 'auto' }} bg="transparent">
            <Table withTableBorder={false} miw={1100} verticalSpacing={4} horizontalSpacing={4}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th />
                  {layers.map((l) => (
                    <Table.Th key={l.id} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 130, fontSize: 11, fontWeight: 500 }}>{l.name}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {meta.golden.map((g) => (
                  <Table.Tr key={g.id}>
                    <Table.Td><Text size="xs" fw={600} component={Link} to={`/altin-kumeler/${g.id}`} className="link-reset">{g.name}</Text></Table.Td>
                    {layers.map((l) => {
                      const cell = tools.filter((t) => t.golden === g.id && t.layer === l.id);
                      return (
                        <Table.Td key={l.id} p={2}>
                          {cell.length ? (
                            <Tooltip label={cell.map((t) => t.name).join(', ')} multiline w={260}>
                              <Box component={Link} to={`/gruplar/golden/${g.id}`} h={28} className="link-reset" aria-label={`${g.name} × ${l.name}: ${cell.length}`}
                                style={{ display: 'grid', placeItems: 'center', borderRadius: 6, fontSize: 12, fontWeight: 700, ...(() => { const bg = mix(hexOf(g.color), pageBg, 0.22 + 0.78 * (cell.length / max)); return { background: bg, color: readableOn(bg) }; })() }}>
                                {cell.length}
                              </Box>
                            </Tooltip>
                          ) : (
                            <Box h={28} style={{ borderRadius: 6, background: 'var(--atlas-muted-line)' }} />
                          )}
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Section>
      </Stack>
    </>
  );
}
