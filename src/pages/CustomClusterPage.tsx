import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ActionIcon, Badge, Button, CopyButton, Grid, Group, Paper, SimpleGrid, Stack, Tabs, Text, TextInput, Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconBucket, IconCheck, IconDeviceFloppy, IconLink, IconPlus, IconTrash, IconWand } from '@tabler/icons-react';
import { meta, tools, topics } from '@/data';
import { and, cond, decodeJSON, decodeRule, encodeJSON, encodeRule, filterTools, validate, type Group as RGroup } from '@/lib/rules';
import { bucketize, type Bucket } from '@/lib/grouping';
import { clusterWorkflow, bucketWorkflow } from '@/lib/workflows/clusters';
import { saveCluster } from '@/lib/savedClusters';
import { PageHeader, Section, ToolCard } from '@/components/ui/atoms';
import { GroupBoard } from '@/components/ui/cards';
import { RuleBuilder } from '@/components/ui/RuleBuilder';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';

const INPUT = { tools, meta, topics, claims: [] };
const DEFAULT_RULE = and(cond('ring', 'in', ['Benimse', 'Dene']), cond('license', 'in', ['MIT', 'Apache-2.0']));
const DEFAULT_BUCKETS: Bucket[] = [
  { id: 'b1', label: 'Hemen kullan', rule: and(cond('ring', 'eq', 'Benimse')), color: 'teal' },
  { id: 'b2', label: 'Doğrula', rule: and(cond('disputed', 'gte', 1)), color: 'orange' },
  { id: 'b3', label: 'React’a kilitli', rule: and(cond('platform', 'eq', 'React')), color: 'grape' },
];
const COLORS = ['teal', 'blue', 'orange', 'grape', 'pink', 'cyan', 'yellow', 'red', 'lime', 'indigo'];

export default function CustomClusterPage() {
  const [sp, setSp] = useSearchParams();
  const decoded = sp.get('r') ? decodeRule(sp.get('r')!) : null;
  const rule: RGroup = decoded ? (decoded.kind === 'group' ? decoded : and(decoded)) : DEFAULT_RULE;
  const [name, setName] = useState(sp.get('ad') ?? 'Özel kümem');
  const [dRule] = useDebouncedValue(rule, 250);
  const members = useMemo(() => filterTools(tools, rule).sort((a, b) => b.composite - a.composite), [rule]);
  const flow = useMemo(() => clusterWorkflow({ id: 'ozel', name, why: 'Kullanıcı tanımlı koşullu küme.', theme: 'karar', rule: dRule }, INPUT), [dRule, name]);

  const bParam = sp.get('k');
  const buckets = useMemo(() => {
    const d = bParam ? decodeJSON<Bucket[]>(bParam) : null;
    return d && Array.isArray(d) && d.every((b) => b && typeof b.id === 'string' && typeof b.label === 'string' && b.rule && validate(b.rule).length === 0) ? d : DEFAULT_BUCKETS;
  }, [bParam]);
  const [dBuckets] = useDebouncedValue(buckets, 250);
  const bucketGroups = useMemo(() => bucketize(tools, buckets, 'Diğer'), [buckets]);
  const bucketFlow = useMemo(() => bucketWorkflow({ id: 'ozel-kova', name: 'Özel koşullu gruplama', why: 'Kullanıcı tanımlı kovalar.', restLabel: 'Diğer', buckets: dBuckets }, INPUT), [dBuckets]);

  const setParam = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };
  const setRule = (g: RGroup) => setParam('r', encodeRule(g));
  const setBuckets = (b: Bucket[]) => setParam('k', encodeJSON(b));
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <PageHeader
        eyebrow="Kendi dinamik kümen"
        title="Koşullu küme tasarlayıcı"
        description="Koşulları birleştir; üyeler, dağılım ve eylem akışı anında yeniden hesaplanır. Kural URL’ye yazılır; bağlantıyı paylaşmak kümeyi paylaşmaktır."
        crumbs={[{ label: 'Kümeler', to: '/kumeler' }, { label: 'Tasarlayıcı' }]}
      />
      <Tabs defaultValue={sp.get('k') ? 'kova' : 'kume'} variant="pills" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="kume" leftSection={<IconWand size={16} />}>Koşullu küme</Tabs.Tab>
          <Tabs.Tab value="kova" leftSection={<IconBucket size={16} />}>Koşullu gruplama (kovalar)</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="kume">
          <Grid gap="lg">
            <Grid.Col span={{ base: 12, xl: 6 }}>
              <Stack gap="md">
                <Section title="Koşullar" actions={<Badge size="lg" variant="filled" color="aurora">{members.length} üye</Badge>}>
                  <Stack gap="sm">
                    <TextInput label="Küme adı" value={name} onChange={(e) => { setName(e.currentTarget.value); setParam('ad', e.currentTarget.value || null); }} />
                    <RuleBuilder value={rule} onChange={setRule} />
                    <Group gap="xs">
                      <Button leftSection={<IconDeviceFloppy size={16} />} onClick={() => { saveCluster(name, rule); notifications.show({ title: 'Kaydedildi', message: `“${name}” bu tarayıcıya kaydedildi.`, color: 'teal' }); }}>Kaydet</Button>
                      <CopyButton value={shareUrl}>
                        {({ copied, copy }) => <Button variant="light" onClick={copy} leftSection={copied ? <IconCheck size={16} /> : <IconLink size={16} />}>{copied ? 'Bağlantı kopyalandı' : 'Bağlantıyı kopyala'}</Button>}
                      </CopyButton>
                      <Button variant="subtle" component={Link} to={`/gruplar/golden?r=${encodeRule(rule)}`}>Gruplama laboratuvarında aç</Button>
                    </Group>
                  </Stack>
                </Section>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, xl: 6 }}>
              <Section title="Canlı eylem akışı" description="Kural değiştikçe aynı güvenli oluşturucuyla yeniden üretilir.">
                <MermaidDiagram code={flow.mermaid} fileName="ozel-kume" minHeight={340} />
              </Section>
            </Grid.Col>
          </Grid>
          <Section title="Üyeler">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
              {members.slice(0, 48).map((t) => <ToolCard key={t.id} t={t} />)}
            </SimpleGrid>
            {members.length === 0 && <Text c="dimmed">Hiçbir varlık eşleşmiyor; bir koşulu gevşet.</Text>}
          </Section>
        </Tabs.Panel>

        <Tabs.Panel value="kova">
          <Grid gap="lg">
            <Grid.Col span={{ base: 12, xl: 6 }}>
              <Section title="Sıralı kovalar" description="Her varlık ilk eşleşen kovaya düşer; hiçbirine uymayanlar “Diğer”e gider.">
                <Stack gap="md">
                  {buckets.map((b, i) => (
                    <Paper key={b.id} p="sm" withBorder radius="md">
                      <Group justify="space-between" mb="xs" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap">
                          <Badge color={b.color} variant="filled">{i + 1}</Badge>
                          <TextInput size="xs" aria-label="Kova adı" value={b.label} onChange={(e) => setBuckets(buckets.map((x, j) => (j === i ? { ...x, label: e.currentTarget.value } : x)))} />
                          <Badge variant="light" color={b.color}>{bucketGroups.find((g) => g.key === b.id)?.items.length ?? 0}</Badge>
                        </Group>
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Yukarı taşı"><ActionIcon variant="subtle" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => { const n = [...buckets]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setBuckets(n); }}>↑</ActionIcon></Tooltip>
                          <ActionIcon variant="subtle" color="red" aria-label="Kovayı sil" onClick={() => setBuckets(buckets.filter((_, j) => j !== i))}><IconTrash size={16} /></ActionIcon>
                        </Group>
                      </Group>
                      <RuleBuilder value={b.rule.kind === 'group' ? b.rule : and(b.rule)} onChange={(g) => setBuckets(buckets.map((x, j) => (j === i ? { ...x, rule: g } : x)))} />
                    </Paper>
                  ))}
                  <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => setBuckets([...buckets, { id: `b${Date.now().toString(36)}`, label: `Kova ${buckets.length + 1}`, rule: and(cond('effort', 'eq', 'Düşük')), color: COLORS[buckets.length % COLORS.length] }])}>Kova ekle</Button>
                </Stack>
              </Section>
            </Grid.Col>
            <Grid.Col span={{ base: 12, xl: 6 }}>
              <Section title="Karar akışı">
                <MermaidDiagram code={bucketFlow.mermaid} fileName="ozel-kova" minHeight={340} />
              </Section>
            </Grid.Col>
          </Grid>
          <Section title="Sonuç panosu">
            <GroupBoard groups={bucketGroups} />
          </Section>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
