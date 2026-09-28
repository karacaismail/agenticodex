import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Box, Group, Paper, SegmentedControl, Slider, Stack, Text, TextInput, useComputedColorScheme } from '@mantine/core';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { communityById, goldenById, loadEdges, meta, toolById, tools } from '@/data';
import { hexOf } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader } from '@/components/ui/atoms';
import { AtlasLoader } from '@/components/ui/AtlasLoader';

interface N extends SimulationNodeDatum { id: string; r: number }
interface L extends SimulationLinkDatum<N> { w: number; c: number }

const PALETTE = ['#7050fd', '#12b886', '#fd7e14', '#e64980', '#15aabf', '#fab005', '#be4bdb', '#40c057', '#228be6', '#fa5252'];

export default function NetworkPage() {
  const { data: edges } = useLoad(loadEdges);
  const dark = useComputedColorScheme('dark') === 'dark';
  const navigate = useNavigate();
  const [minW, setMinW] = useState(0.2);
  const [colorBy, setColorBy] = useState<'golden' | 'community'>('community');
  const [hover, setHover] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const W = 1200;
  const H = 900;

  const graph = useMemo(() => {
    if (!edges) return null;
    const es = edges.filter((e) => e.w >= minW);
    const ids = new Set(es.flatMap((e) => [e.a, e.b]));
    const nodes: N[] = tools.filter((t) => ids.has(t.id)).map((t) => ({ id: t.id, r: 4 + (t.visibility / 100) * 12 }));
    const links: L[] = es.map((e) => ({ source: e.a, target: e.b, w: e.w, c: e.c }));
    const sim = forceSimulation<N>(nodes)
      .force('link', forceLink<N, L>(links).id((d) => d.id).distance((l) => 60 + (1 - l.w) * 160).strength((l) => Math.min(1, l.w * 2)))
      .force('charge', forceManyBody().strength(-260))
      .force('center', forceCenter(W / 2, H / 2))
      .force('x', forceX(W / 2).strength(0.04))
      .force('y', forceY(H / 2).strength(0.06))
      .force('collide', forceCollide<N>().radius((d) => d.r + 3))
      .stop();
    for (let i = 0; i < 320; i++) sim.tick();
    return { nodes, links };
  }, [edges, minW]);

  const colorOf = (id: string) => {
    const t = toolById.get(id)!;
    if (colorBy === 'golden') return hexOf(goldenById.get(t.golden)?.color);
    const idx = meta.communities.findIndex((c) => c.id === t.community);
    return idx >= 0 ? PALETTE[idx % PALETTE.length] : '#868e96';
  };
  const focus = hover ?? (q.trim() ? tools.find((t) => t.name.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')))?.id ?? null : null);
  const nbr = useMemo(() => {
    if (!graph || !focus) return null;
    const s = new Set([focus]);
    graph.links.forEach((l) => {
      const a = (l.source as N).id;
      const b = (l.target as N).id;
      if (a === focus) s.add(b);
      if (b === focus) s.add(a);
    });
    return s;
  }, [graph, focus]);

  return (
    <>
      <PageHeader
        eyebrow="Veri güdümlü ilişki"
        title="Birlikte anılma ağı"
        description="Düğümler varlıklar, kenarlar raporlarda aynı paragrafta birlikte geçişlerdir (kosinüs ağırlığı). Renk topluluğu veya altın kümeyi, boyut görünürlüğü gösterir. Üzerine gel: komşular vurgulanır; tıkla: araç sayfası."
        crumbs={[{ label: 'Keşfet', to: '/araclar' }, { label: 'Ağ' }]}
      />
      <Paper p="md" className="glass" mb="md">
        <Group gap="lg" wrap="wrap" align="flex-end">
          <Stack gap={4} w={260}>
            <Text size="xs" fw={500}>Kenar eşiği (ağırlık ≥ {minW.toFixed(2)})</Text>
            <Slider thumbLabel="Kenar eşiği" min={0.05} max={0.4} step={0.01} value={minW} onChange={setMinW} label={(v) => v.toFixed(2)} />
          </Stack>
          <Stack gap={4}>
            <Text size="xs" fw={500}>Renk</Text>
            <SegmentedControl size="xs" value={colorBy} onChange={(v) => setColorBy(v as 'golden' | 'community')} data={[{ value: 'community', label: 'Topluluk' }, { value: 'golden', label: 'Altın küme' }]} />
          </Stack>
          <TextInput size="xs" label="Vurgula" placeholder="ör. Motion" value={q} onChange={(e) => setQ(e.currentTarget.value)} w={200} />
          {graph && <Badge variant="light" size="lg">{graph.nodes.length} düğüm · {graph.links.length} kenar</Badge>}
        </Group>
      </Paper>
      {!graph ? (
        <AtlasLoader label="Ağ hesaplanıyor" />
      ) : (
        <Paper className="glass" p={0} style={{ overflow: 'hidden' }}>
          <TransformWrapper minScale={0.5} maxScale={4} wheel={{ step: 0.08, activationKeys: ['Control', 'Meta'] }} centerOnInit>
            <TransformComponent wrapperStyle={{ width: '100%', height: 'min(78vh, 820px)' }} contentStyle={{ width: '100%' }}>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Birlikte anılma ağı" className={nbr ? 'graph-dim' : undefined} style={{ display: 'block' }}>
                <g>
                  {graph.links.map((l, i) => {
                    const a = l.source as N;
                    const b = l.target as N;
                    const active = !!nbr && nbr.has(a.id) && nbr.has(b.id) && (a.id === focus || b.id === focus);
                    return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={dark ? '#9d97c7' : '#5c5a7a'} strokeOpacity={0.12 + l.w * 0.8} strokeWidth={0.6 + l.w * 4} className={active ? 'graph-active' : undefined} />;
                  })}
                </g>
                <g>
                  {graph.nodes.map((n) => {
                    const t = toolById.get(n.id)!;
                    const active = !nbr || nbr.has(n.id);
                    return (
                      <g key={n.id} className={`graph-node ${nbr && active ? 'graph-active' : ''}`} transform={`translate(${n.x},${n.y})`}
                        onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => navigate(`/araclar/${n.id}`)}>
                        <circle r={n.r} fill={colorOf(n.id)} stroke={dark ? '#0b0c14' : '#fff'} strokeWidth={1.5} />
                        {((!nbr && n.r > 13) || (nbr && active)) && (
                          <text y={-n.r - 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={dark ? '#eceaff' : '#1a1b2e'} style={{ pointerEvents: 'none', paintOrder: 'stroke', stroke: dark ? '#0b0c14' : '#fff', strokeWidth: 3 }}>{t.name}</text>
                        )}
                        <title>{`${t.name} · ${communityById.get(t.community)?.name ?? 'Bağımsız'}`}</title>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </TransformComponent>
          </TransformWrapper>
        </Paper>
      )}
      <Group gap={6} mt="md">
        {colorBy === 'community'
          ? meta.communities.map((c, i) => <Badge key={c.id} variant="light" leftSection={<Box w={8} h={8} style={{ borderRadius: 8, background: PALETTE[i % PALETTE.length] }} />} style={{ textTransform: 'none' }}>{c.id} · {c.name}</Badge>)
          : meta.golden.map((g) => <Badge key={g.id} variant="light" color={g.color} style={{ textTransform: 'none' }}>{g.name}</Badge>)}
      </Group>
    </>
  );
}
