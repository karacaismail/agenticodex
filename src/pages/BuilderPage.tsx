import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Badge, Box, Button, Chip, CopyButton, Grid, Group, List, Paper, SegmentedControl, SimpleGrid, Stack, Text, ThemeIcon, Timeline, Title, useComputedColorScheme,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconCheck, IconCircleCheck, IconGitBranch, IconLink, IconWand } from '@tabler/icons-react';
import { loadWorkflows, meta, tools, topics, toolById } from '@/data';
import { BUILDER_OPTIONS, buildCustomWorkflow, type BuilderChoice, type Need } from '@/lib/workflows/builder';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section, ToolCard } from '@/components/ui/atoms';
import { WorkflowCard } from '@/components/ui/cards';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import ThoughtLine from '@/components/reactbits/ThoughtLine/ThoughtLine';

const INPUT = { tools, meta, topics, claims: [] };
const pick = <T extends string>(v: string | null, opts: readonly { value: string }[], def: T): T => (opts.some((o) => o.value === v) ? (v as T) : def);

function OptionGroup({ title, value, options, onChange }: { title: string; value: string; options: readonly { value: string; label: string; desc?: string }[]; onChange: (v: string) => void }) {
  return (
    <Stack gap={6}>
      <Text size="sm" fw={600}>{title}</Text>
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={6}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Paper key={o.value} p="xs" radius="md" withBorder onClick={() => onChange(o.value)} role="radio" aria-checked={active} tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(o.value)}
              style={{ cursor: 'pointer', borderColor: active ? 'var(--mantine-color-aurora-5)' : undefined, background: active ? 'color-mix(in srgb, var(--mantine-color-aurora-5) 12%, transparent)' : undefined }}>
              <Group gap={6} wrap="nowrap">
                {active && <IconCheck size={14} color="var(--mantine-color-aurora-4)" />}
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>{o.label}</Text>
                  {o.desc && <Text size="xs" c="dimmed" truncate>{o.desc}</Text>}
                </Stack>
              </Group>
            </Paper>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

export default function BuilderPage() {
  const [sp, setSp] = useSearchParams();
  const dark = useComputedColorScheme('dark') === 'dark';
  const choice: BuilderChoice = {
    profile: pick(sp.get('p'), BUILDER_OPTIONS.profile, 'kucuk-ekip'),
    ui: pick(sp.get('ui'), BUILDER_OPTIONS.ui, 'mantine'),
    renderer: pick(sp.get('r'), BUILDER_OPTIONS.renderer, 'json-render'),
    transport: pick(sp.get('t'), BUILDER_OPTIONS.transport, 'fetch-event-source'),
    level: pick(sp.get('d'), BUILDER_OPTIONS.level, 'kontrollu'),
    needs: (sp.get('n') ?? 'dosya,onay').split(',').filter((x): x is Need => BUILDER_OPTIONS.needs.some((o) => o.value === x)),
  };
  const key = JSON.stringify(choice);
  const [dKey] = useDebouncedValue(key, 350);
  const result = useMemo(() => buildCustomWorkflow(JSON.parse(dKey) as BuilderChoice, INPUT), [dKey]);
  const [working, setWorking] = useState(false);
  useEffect(() => {
    if (key !== dKey) setWorking(true);
    const t = setTimeout(() => setWorking(false), 700);
    return () => clearTimeout(t);
  }, [key, dKey]);
  const { data: wf } = useLoad(loadWorkflows);
  const related = (wf?.workflows ?? []).filter((w) => result.related.includes(w.id));

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp);
    n.set(k, v);
    setSp(n, { replace: true });
  };
  const w = result.workflow;

  return (
    <>
      <PageHeader
        eyebrow="Dinamik iş akışı"
        title="Akış üretici"
        description="Bağlamını seç; akış, önerilen araçlar, koşul dalları ve geçiş kapıları anında yeniden üretilir. Bütün temel birleşimler (864) test sırasında Mermaid 10.9, 11.17 ve 12.0 ile doğrulanır."
        crumbs={[{ label: 'İş akışları', to: '/akislar' }, { label: 'Akış üretici' }]}
        actions={
          <CopyButton value={typeof window !== 'undefined' ? window.location.href : ''}>
            {({ copied, copy }) => <Button variant="light" onClick={copy} leftSection={copied ? <IconCheck size={16} /> : <IconLink size={16} />}>{copied ? 'Kopyalandı' : 'Bu yapılandırmayı paylaş'}</Button>}
          </CopyButton>
        }
      />
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, xl: 4 }}>
          <Paper p="md" className="glass" pos="sticky" top={76}>
            <Stack gap="md">
              <OptionGroup title="1 · Bağlam profili" value={choice.profile} options={BUILDER_OPTIONS.profile} onChange={(v) => set('p', v)} />
              <Stack gap={6}>
                <Text size="sm" fw={600}>2 · GenUI kontrol düzeyi</Text>
                <Text size="xs" c="dimmed">{BUILDER_OPTIONS.level.find((o) => o.value === choice.level)?.desc}</Text>
                <SegmentedControl fullWidth value={choice.level} onChange={(v) => set('d', v)} data={BUILDER_OPTIONS.level.map((o) => ({ value: o.value, label: o.short }))} />
              </Stack>
              <OptionGroup title="3 · UI temeli (sabit kabuk)" value={choice.ui} options={BUILDER_OPTIONS.ui} onChange={(v) => set('ui', v)} />
              <Box style={{ opacity: choice.level === 'sabit' ? 0.45 : 1 }}>
                <OptionGroup title="4 · Renderer" value={choice.renderer} options={BUILDER_OPTIONS.renderer} onChange={(v) => set('r', v)} />
              </Box>
              <OptionGroup title="5 · Taşıma" value={choice.transport} options={BUILDER_OPTIONS.transport} onChange={(v) => set('t', v)} />
              <Stack gap={6}>
                <Text size="sm" fw={600}>6 · Ek ihtiyaçlar</Text>
                <Chip.Group multiple value={choice.needs} onChange={(v) => set('n', v.join(','))}>
                  <Group gap={6}>{BUILDER_OPTIONS.needs.map((o) => <Chip key={o.value} value={o.value} variant="light" size="sm">{o.label}</Chip>)}</Group>
                </Chip.Group>
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xl: 8 }}>
          <Stack gap="lg">
            <Section
              title={w.title}
              description={w.summary}
              actions={<Badge size="lg" variant="light" color="teal">Kapılar {result.gates.join(' → ')}</Badge>}
            >
              <Box mb="sm" mih={24}>
                <ThoughtLine
                  label="Akış yeniden üretiliyor"
                  doneLabel="Akış hazır · 3 sürümde geçerli sözdizimi"
                  working={working}
                  steps={['Kabuk ve düzey', 'Renderer ve katalog', 'Taşıma koşulları', 'İhtiyaç yetenekleri', 'Kalite kapısı']}
                  color={dark ? '#dcdaf5' : '#1a1b2e'}
                  glyphColor={dark ? '#a088fe' : '#6644fe'}
                  showTimer={false}
                  collapsible={false}
                />
              </Box>
              <MermaidDiagram code={w.mermaid} fileName="ozel-akis" minHeight={520} />
            </Section>
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
              <Section title="Neden bu dallar?">
                <List spacing={6} size="sm" icon={<ThemeIcon size={18} radius="xl" variant="light" color="orange"><IconGitBranch size={12} /></ThemeIcon>}>
                  {w.conditions.map((c, i) => <List.Item key={i}>{c}</List.Item>)}
                  {!w.conditions.length && <List.Item>Ek koşul yok: seçimler doğrudan uyumlu.</List.Item>}
                </List>
              </Section>
              <Section title="Adımlar">
                <Timeline active={w.steps.length} bulletSize={20} lineWidth={2}>
                  {w.steps.map((s, i) => (
                    <Timeline.Item key={i} bullet={<IconCircleCheck size={12} />} title={<Text size="sm" fw={600}>{s.title}</Text>}>
                      {s.detail && <Text size="xs" c="dimmed">{s.detail}</Text>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Section>
            </SimpleGrid>
            <Section title={`Önerilen araçlar (${result.recommended.length})`} description="Seçimlerden ve koşullardan türetildi; her biri korpustaki kanıtıyla bağlantılı.">
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {result.recommended.map((id) => toolById.get(id)).filter(Boolean).map((t) => <ToolCard key={t!.id} t={t!} compact />)}
              </SimpleGrid>
            </Section>
            {related.length > 0 && (
              <Section title="İlgili hazır akışlar" description="Katalogdaki birebir karşılıklar: yığın, karar ağacı, yaşam döngüsü ve yol haritası.">
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {related.map((x) => <WorkflowCard key={x.id} w={x} familyName={wf?.families.find((f) => f.id === x.family)?.name} />)}
                </SimpleGrid>
              </Section>
            )}
            <Paper p="md" className="glass">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" size="lg"><IconWand size={18} /></ThemeIcon>
                <Stack gap={0}>
                  <Title order={6}>Sonraki adım</Title>
                  <Text size="sm" c="dimmed">Önerilen yığındaki itirazlı iddiaları doğrula: <Link to="/kumeler/dogrulama-bekleyen">Doğrulama bekleyenler</Link> kümesi ve <Link to="/sentez">sentezin geçiş kapıları</Link>.</Text>
                </Stack>
              </Group>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
}
