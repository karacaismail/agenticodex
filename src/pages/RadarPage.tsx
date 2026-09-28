import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Anchor, Badge, Grid, Group, Paper, SimpleGrid, Stack, Text, useComputedColorScheme } from '@mantine/core';
import { tools } from '@/data';
import type { Tool } from '@/data/types';
import { RING_COLOR, hexOf } from '@/lib/format';
import { PageHeader, Section } from '@/components/ui/atoms';

const QUADS = [
  { name: 'GenUI omurgası', golden: ['G02', 'G03', 'G04', 'G05'] },
  { name: 'Deneyim katmanı', golden: ['G01', 'G07', 'G08', 'G11'] },
  { name: 'Veri, dosya ve kanıt', golden: ['G06', 'G09', 'S1'] },
  { name: 'Güven, kalite ve platform', golden: ['G10', 'G12', 'S2', 'S3'] },
];
const RINGS = ['Benimse', 'Dene', 'Değerlendir', 'Beklet'];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export default function RadarPage() {
  const dark = useComputedColorScheme('dark') === 'dark';
  const navigate = useNavigate();
  const [hover, setHover] = useState<Tool | null>(null);
  const S = 720;
  const C = S / 2;
  const R = C - 20;
  const bands = [0, 0.34, 0.58, 0.8, 1].map((f) => f * R);

  const blips = useMemo(
    () =>
      tools.filter((t) => t.radarEligible).map((t) => {
        const qi = QUADS.findIndex((q) => q.golden.includes(t.golden));
        const ri = RINGS.indexOf(t.ring);
        const a0 = (qi * Math.PI) / 2 + 0.12;
        const a1 = ((qi + 1) * Math.PI) / 2 - 0.12;
        const ang = a0 + hash(t.id) * (a1 - a0);
        const inner = bands[ri] + 10;
        const outer = bands[ri + 1] - 10;
        const rr = inner + hash(t.id + 'r') * Math.max(4, outer - inner);
        return { t, qi, x: C + rr * Math.cos(ang), y: C + rr * Math.sin(ang) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Benimseme"
        title="Teknoloji radarı"
        description="Kullanılabilir türdeki varlıklar dört çeyrekte ve dört halkada. Halka karar farkındadır: bileşik puan (%33 kanıt + %25 rapor kapsaması + %24 olgunluk + %18 duruş) yetmez, üst halkalar için raporların çekirdek/prototip önerisi de gerekir. Ertelenenler doğrudan Beklet halkasındadır."
        crumbs={[{ label: 'Keşfet', to: '/araclar' }, { label: 'Radar' }]}
      />
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, xl: 7 }}>
          <Paper p="md" className="glass">
            <svg viewBox={`0 0 ${S} ${S}`} width="100%" role="img" aria-label="Teknoloji radarı">
              {bands.slice(1).reverse().map((b, i) => (
                <circle key={i} cx={C} cy={C} r={b} fill={dark ? `rgba(112,80,253,${0.04 + i * 0.03})` : `rgba(112,80,253,${0.03 + i * 0.025})`} stroke={dark ? '#34335a' : '#d0c9ff'} />
              ))}
              <line x1={C} y1={20} x2={C} y2={S - 20} stroke={dark ? '#34335a' : '#d0c9ff'} />
              <line x1={20} y1={C} x2={S - 20} y2={C} stroke={dark ? '#34335a' : '#d0c9ff'} />
              {RINGS.map((r, i) => (
                <text key={r} x={C + 6} y={C - (bands[i] + bands[i + 1]) / 2 + 4} fontSize={11} fill={dark ? '#9d97c7' : '#6b6690'} fontWeight={700}>{r}</text>
              ))}
              {QUADS.map((q, i) => {
                const pos = [[S - 24, S - 16, 'end'], [24, S - 16, 'start'], [24, 24, 'start'], [S - 24, 24, 'end']][i] as [number, number, 'end' | 'start'];
                return <text key={q.name} x={pos[0]} y={pos[1]} textAnchor={pos[2]} fontSize={14} fontWeight={800} fill={dark ? '#dcdaf5' : '#1a1b2e'}>{q.name}</text>;
              })}
              {blips.map((b) => (
                <circle key={b.t.id} className="radar-blip" cx={b.x} cy={b.y} r={hover?.id === b.t.id ? 9 : 6} fill={hexOf(RING_COLOR[b.t.ring])} stroke={dark ? '#0b0c14' : '#fff'} strokeWidth={1.5}
                  onMouseEnter={() => setHover(b.t)} onMouseLeave={() => setHover(null)} onClick={() => navigate(`/araclar/${b.t.id}`)}>
                  <title>{`${b.t.name} · ${b.t.ring} · ${b.t.composite}`}</title>
                </circle>
              ))}
              {hover && (
                <text x={C} y={S - 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={dark ? '#eceaff' : '#1a1b2e'}>{hover.name} · {hover.ring} · puan {hover.composite}</text>
              )}
            </svg>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xl: 5 }}>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 1 }} spacing="md">
            {QUADS.map((q, qi) => (
              <Section key={q.name} title={q.name}>
                <Stack gap={8}>
                  {RINGS.map((r) => {
                    const list = blips.filter((b) => b.qi === qi && b.t.ring === r).sort((a, b) => b.t.composite - a.t.composite);
                    if (!list.length) return null;
                    return (
                      <Group key={r} gap={6} align="flex-start" wrap="nowrap">
                        <Badge color={RING_COLOR[r]} variant="light" w={100} style={{ flexShrink: 0 }}>{r}</Badge>
                        <Text size="xs">
                          {list.map((b, i) => (
                            <span key={b.t.id}>
                              <Anchor component={Link} to={`/araclar/${b.t.id}`} size="xs" onMouseEnter={() => setHover(b.t)} onMouseLeave={() => setHover(null)}>{b.t.name}</Anchor>
                              {i < list.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </Text>
                      </Group>
                    );
                  })}
                </Stack>
              </Section>
            ))}
          </SimpleGrid>
        </Grid.Col>
      </Grid>
    </>
  );
}
