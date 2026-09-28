import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Anchor, Badge, Blockquote, Button, Grid, Group, List, Paper, RingProgress, SimpleGrid, Stack, Tabs, Text, ThemeIcon, Title,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconAlertTriangle, IconBook2, IconExternalLink, IconGitCompare, IconInfoCircle, IconLink, IconRoute, IconTopologyStar3 } from '@tabler/icons-react';
import { loadClaims, loadSources, loadToolDetails, loadWorkflows, meta, toolById, tools, topicById, communityById } from '@/data';
import type { ClaimStatus } from '@/data/types';
import { SMART_CLUSTERS, BUCKET_SCHEMES } from '@/lib/presets';
import { evaluate } from '@/lib/rules';
import { bucketize } from '@/lib/grouping';
import { RING_COLOR, STATUS_LABEL, STATUS_ORDER, hostOf, nf, pathOf, reportLabel } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { EvidenceBar, GoldenBadge, KeyValue, LayerBadge, PageHeader, RingBadge, RiskBadge, Section, StatusBadge, ToolChip, ScrollSegmented } from '@/components/ui/atoms';
import { WorkflowCard } from '@/components/ui/cards';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import NotFoundPage from './NotFoundPage';

export default function ToolDetailPage() {
  const { id = '' } = useParams();
  const t = toolById.get(id);
  const { data: wf } = useLoad(loadWorkflows);
  const { data: claims } = useLoad(loadClaims);
  const { data: sources } = useLoad(loadSources);
  const { data: details } = useLoad(loadToolDetails);
  const [statusFilter, setStatusFilter] = useState<'all' | ClaimStatus>('all');

  const smart = useMemo(() => (t ? SMART_CLUSTERS.filter((c) => evaluate(c.rule, t)) : []), [t]);
  const buckets = useMemo(
    () => (t ? BUCKET_SCHEMES.map((s) => ({ s, g: bucketize([t], s.buckets, s.restLabel).find((g) => g.items.length)! })) : []),
    [t],
  );
  if (!t) return <NotFoundPage />;
  const d = details?.[t.id];

  const adoption = wf?.workflows.find((w) => w.id === `benimseme-${t.id}`);
  const related = (wf?.workflows ?? []).filter((w) => w.tools.includes(t.id) && w.id !== `benimseme-${t.id}`);
  const familyName = (fid: string) => wf?.families.find((f) => f.id === fid)?.name;
  const myClaims = (claims ?? []).filter((c) => c.tools.includes(t.id) && (statusFilter === 'all' || c.status === statusFilter));
  const mySources = (sources ?? []).filter((s) => s.tools.includes(t.id) && !s.placeholder);
  const alternatives = tools.filter((x) => x.id !== t.id && x.layer === t.layer).sort((a, b) => b.composite - a.composite).slice(0, 8);
  const mentionData = [...meta.reports.map((r) => r.id), 'synthesis', 'partials'].map((r) => ({ rapor: reportLabel(r, meta.reportLabels).replace(' · ', '\n'), Geçiş: d?.mentions[r] ?? 0 }));

  return (
    <>
      <PageHeader
        eyebrow={`${t.kind} · ${t.vendor}`}
        title={t.name}
        description={t.desc}
        crumbs={[{ label: 'Araçlar', to: '/araclar' }, { label: t.name }]}
        actions={
          <>
            {t.url && <Button variant="default" component="a" href={t.url} target="_blank" rel="noreferrer" leftSection={<IconExternalLink size={16} />}>Resmî sayfa</Button>}
            <Button variant="light" component={Link} to={`/karsilastir?ids=${[t.id, ...alternatives.slice(0, 2).map((a) => a.id)].join(',')}`} leftSection={<IconGitCompare size={16} />}>Alternatiflerle karşılaştır</Button>
          </>
        }
      >
        <Group gap={6}>
          <GoldenBadge id={t.golden} />
          <LayerBadge id={t.layer} />
          <RingBadge ring={t.ring} />
          <RiskBadge tier={t.riskTier} />
          <Badge variant="outline" color="gray">{t.license}</Badge>
          <Badge variant="outline" color="gray">{t.maturity}{t.version ? ` · ${t.version}` : ''}</Badge>
          <Badge variant="light" color="gray">{t.stance}</Badge>
        </Group>
      </PageHeader>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb="lg">
        {[
          { l: 'Bileşik puan', v: t.composite, s: '/100', c: RING_COLOR[t.ring] },
          { l: 'Kanıt puanı', v: t.evidence ?? 0, s: t.evidence === null ? ' (yok)' : '/100', c: 'teal' },
          { l: 'Rapor kapsaması', v: Math.round((t.coverage / 8) * 100), s: `% (${t.coverage}/8)`, c: 'aurora' },
          { l: 'Görünürlük', v: t.visibility, s: '/100', c: 'cyan' },
          { l: 'Risk puanı', v: t.riskScore, s: '/100', c: t.riskTier === 'Yüksek' ? 'red' : t.riskTier === 'Orta' ? 'yellow' : 'teal' },
        ].map((k) => (
          <Paper key={k.l} p="md" className="glass">
            <Group gap="sm" wrap="nowrap">
              <RingProgress size={58} thickness={6} roundCaps sections={[{ value: k.v, color: k.c ?? 'gray' }]} label={<Text ta="center" size="xs" fw={700}>{k.v}</Text>} />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">{k.l}</Text>
                <Text fw={700} size="sm">{k.v}{k.s}</Text>
              </Stack>
            </Group>
          </Paper>
        ))}
        <Paper p="md" className="glass">
          <Text size="xs" c="dimmed">İddialar ({t.claimCount})</Text>
          <EvidenceBar counts={t.claimStatus} size="lg" />
          <Text size="xs" c="dimmed" mt={4}>{t.sourceCount} kaynak · {nf.format(t.mentionTotal)} geçiş</Text>
        </Paper>
      </SimpleGrid>

      <Tabs defaultValue="genel" keepMounted={false} variant="pills" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="genel" leftSection={<IconInfoCircle size={16} />}>Genel</Tabs.Tab>
          <Tabs.Tab value="akis" leftSection={<IconRoute size={16} />}>İş akışları {wf ? `(${related.length + 1})` : ''}</Tabs.Tab>
          <Tabs.Tab value="kanit" leftSection={<IconBook2 size={16} />}>Kanıt ({t.claimCount})</Tabs.Tab>
          <Tabs.Tab value="iliski" leftSection={<IconTopologyStar3 size={16} />}>İlişkiler</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="genel">
          <Grid gap="lg">
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="lg">
                <Section title={t.provenance ? "Kaynak incelemesi" : "Korpus özeti"}>
                  {t.provenance && <Text size="sm" mb="sm">Korpus dışı ekleme · {t.provenance.checkedAt} · <Anchor href={t.provenance.url} target="_blank" rel="noreferrer">Birincil kaynak</Anchor></Text>}
                  <Text>{d?.summary || t.desc}</Text>
                  {d && d.facts.length > 0 && (
                    <>
                      <Title order={5} mt="md" mb="xs">Somut olgular</Title>
                      <List spacing="xs" size="sm">
                        {d.facts.map((f, i) => (
                          <List.Item key={i}>{f.text} <Text span size="xs" c="dimmed">— {reportLabel(f.report, meta.reportLabels)}</Text></List.Item>
                        ))}
                      </List>
                    </>
                  )}
                  {d && d.risks.length > 0 && (
                    <>
                      <Title order={5} mt="md" mb="xs">Riskler ve sınırlar</Title>
                      <List spacing="xs" size="sm" icon={<ThemeIcon size={18} color="orange" variant="light" radius="xl"><IconAlertTriangle size={12} /></ThemeIcon>}>
                        {d.risks.map((r, i) => <List.Item key={i}>{r}</List.Item>)}
                      </List>
                    </>
                  )}
                </Section>
                {d && d.excerpts.length > 0 && (
                  <Section title="Raporlardan temsilî cümleler" description="Araştırma korpusundan otomatik seçildi.">
                    <Stack gap="sm">
                      {d.excerpts.map((e, i) => (
                        <Blockquote key={i} color="aurora" p="sm" cite={`— ${reportLabel(e.report, meta.reportLabels)}`}>
                          <Text size="sm">{e.text}</Text>
                        </Blockquote>
                      ))}
                    </Stack>
                  </Section>
                )}
                <Section title="Rapor bazında geçiş" description="Aynı kaynağın birden çok raporda tekrarı bağımsız doğrulama değildir.">
                  <BarChart h={240} data={mentionData} dataKey="rapor" series={[{ name: 'Geçiş', color: 'aurora.5' }]} tickLine="none" gridAxis="y" barProps={{ radius: 6 }} xAxisProps={{ tick: { fontSize: 10 } }} />
                </Section>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="lg">
                <Section title="Özellikler">
                  <KeyValue k="Tür" v={t.kind} />
                  <KeyValue k="Üretici" v={t.vendor} />
                  <KeyValue k="Lisans" v={t.license} />
                  <KeyValue k="Olgunluk" v={t.maturity} />
                  {t.version && <KeyValue k="Sürüm (korpus)" v={t.version} />}
                  <KeyValue k="Platform bağı" v={t.platform} />
                  <KeyValue k="Entegrasyon yükü" v={t.effort} />
                  <KeyValue k="Rapor duruşu" v={t.stance} />
                  <KeyValue k="Konsensüs" v={t.consensus} />
                  <KeyValue k="Kanıt düzeyi" v={t.evidenceTier} />
                  <KeyValue k="Topluluk" v={<Anchor component={Link} to={`/kumeler/topluluk/${t.community}`} size="sm">{communityById.get(t.community)?.name ?? 'Bağımsız'}</Anchor>} />
                  <KeyValue k="Ara analizlerde" v={`${t.partialCoverage}/${meta.partialCount}`} />
                  <Group gap={4} mt="sm">{t.tags.map((g) => <Badge key={g} size="xs" variant="dot" component={Link} to={`/gruplar/tag/${encodeURIComponent(g)}`} style={{ cursor: 'pointer', textTransform: 'none' }}>{g}</Badge>)}</Group>
                </Section>
                <Section title="Araştırma konuları">
                  <Stack gap={6}>
                    {t.rTopics.map((r) => (
                      <Anchor key={r} component={Link} to={`/konular/${r}`} size="sm">{r} · {topicById.get(r)?.title}</Anchor>
                    ))}
                    {!t.rTopics.length && <Text size="sm" c="dimmed">Konu eşlemesi yok.</Text>}
                  </Stack>
                </Section>
                <Section title="Canlı küme üyelikleri" description="Kurallar bu araca şimdi uygulandı.">
                  <Group gap={6}>
                    {smart.map((c) => <Badge key={c.id} component={Link} to={`/kumeler/${c.id}`} color={c.color} variant="light" style={{ cursor: 'pointer', textTransform: 'none' }}>{c.name}</Badge>)}
                    {!smart.length && <Text size="sm" c="dimmed">Hiçbir akıllı kümeye girmiyor.</Text>}
                  </Group>
                  <Title order={6} mt="md" mb={6}>Koşullu kova konumu</Title>
                  <Stack gap={4}>
                    {buckets.map(({ s, g }) => (
                      <Link key={s.id} to={`/kumeler/kova/${s.id}`} className="link-reset" style={{ display: 'block', borderRadius: 6 }}>
                        <Group justify="space-between" wrap="nowrap" gap="xs" mih={30} px={4}>
                          <Text size="xs" c="dimmed">{s.name}</Text>
                          <Badge size="xs" color={g.color ?? 'gray'} variant="light" style={{ textTransform: 'none' }}>{g.label}</Badge>
                        </Group>
                      </Link>
                    ))}
                  </Stack>
                </Section>
              </Stack>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="akis">
          <Stack gap="lg">
            {!wf && <AtlasLoader label="İş akışları yükleniyor" />}
            {adoption && (
              <Section title={adoption.title} description={adoption.summary} actions={<Button size="xs" variant="light" component={Link} to={`/akislar/${adoption.id}`}>Ayrıntı</Button>}>
                <MermaidDiagram code={adoption.mermaid} fileName={adoption.id} minHeight={380} />
                <Group gap={6} mt="sm">{adoption.conditions.map((c, i) => <Badge key={i} variant="light" color="orange" style={{ textTransform: 'none' }}>{c}</Badge>)}</Group>
              </Section>
            )}
            {related.length > 0 && (
              <Section title={`Bu aracı içeren ${related.length} iş akışı`}>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {related.slice(0, 30).map((w) => <WorkflowCard key={w.id} w={w} familyName={familyName(w.family)} />)}
                </SimpleGrid>
                {related.length > 30 && <Button mt="md" variant="subtle" component={Link} to={`/akislar?arac=${t.id}`}>Tümünü katalogda gör</Button>}
              </Section>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="kanit">
          <Section
            title="Bağlı iddialar"
            description="İddia metni araç adını içerdiğinde bağlanır. Durum, son değerlendirme aşamasınındır."
            actions={
              <ScrollSegmented size="xs" value={statusFilter} onChange={(v) => setStatusFilter(v as 'all' | ClaimStatus)}
                data={[{ value: 'all', label: 'Tümü' }, ...STATUS_ORDER.map((s) => ({ value: s, label: `${STATUS_LABEL[s]} ${t.claimStatus[s]}` }))]} />
            }
          >
            {!claims && <AtlasLoader label="İddialar yükleniyor" />}
            <Stack gap="sm">
              {myClaims.slice(0, 60).map((c) => (
                <Paper key={c.slug} p="sm" withBorder radius="md" component={Link} to={`/kanit/${c.slug}`} className="link-reset hover-lift">
                  <Group justify="space-between" mb={4} wrap="nowrap">
                    <Text size="xs" c="dimmed" className="mono">{c.id}</Text>
                    <Group gap={4}>{c.statuses.map((s) => <StatusBadge key={s} status={s} size="xs" />)}</Group>
                  </Group>
                  <Text size="sm" lineClamp={3}>{c.statement}</Text>
                </Paper>
              ))}
              {claims && !myClaims.length && <Text c="dimmed" size="sm">Bu filtrede iddia yok.</Text>}
            </Stack>
          </Section>
          <Section title={`Kaynaklar (${mySources.length})`} description="Kaynak sicilindeki URL’ler; içerik bağımsız doğrulanmadı.">
            <Stack gap={6}>
              {mySources.slice(0, 40).map((s) => (
                <Group key={s.id} gap="xs" wrap="nowrap">
                  <IconLink size={14} opacity={0.6} />
                  <Anchor component={Link} to={`/kaynaklar/${s.id}`} size="sm" truncate style={{ minWidth: 0 }}>{hostOf(s.url)}{pathOf(s.url)}</Anchor>
                  <Badge size="xs" variant="light" color="gray">{s.reports.length} rapor</Badge>
                </Group>
              ))}
            </Stack>
          </Section>
        </Tabs.Panel>

        <Tabs.Panel value="iliski">
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <Section title="En çok birlikte anıldığı" description="Tekrarsız paragraflarda birlikte geçiş (kosinüs ağırlığı).">
              <Stack gap={8}>
                {(d?.neighbors ?? []).map((n) => {
                  const o = toolById.get(n.id);
                  return (
                    <Group key={n.id} justify="space-between" wrap="nowrap">
                      <ToolChip id={n.id} name={o?.name ?? n.id} />
                      <Group gap={8} wrap="nowrap">
                        <Paper h={6} w={Math.max(8, n.w * 160)} radius="xl" bg="aurora.5" />
                        <Text size="xs" c="dimmed" w={70} ta="right">{n.c} paragraf</Text>
                      </Group>
                    </Group>
                  );
                })}
                {d && !d.neighbors.length && <Text size="sm" c="dimmed">Eşik üstü birlikte anılma yok.</Text>}
              </Stack>
            </Section>
            <Section title="Aynı katmandaki alternatifler">
              <Stack gap={8}>
                {alternatives.map((a) => (
                  <Group key={a.id} justify="space-between" wrap="nowrap">
                    <ToolChip id={a.id} name={a.name} />
                    <Group gap={6}><RingBadge ring={a.ring} size="xs" /><Text size="xs" fw={700}>{a.composite}</Text></Group>
                  </Group>
                ))}
              </Stack>
            </Section>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
