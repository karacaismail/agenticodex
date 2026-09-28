import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionIcon, Badge, Button, Group, Paper, SimpleGrid, Stack, Tabs, Text, Tooltip } from '@mantine/core';
import { IconAffiliate, IconBucket, IconPlus, IconTopologyStar3, IconTrash } from '@tabler/icons-react';
import { goldenById, meta, toolById, tools } from '@/data';
import { SMART_CLUSTERS, BUCKET_SCHEMES } from '@/lib/presets';
import { describeRule, encodeRule, filterTools } from '@/lib/rules';
import { bucketize } from '@/lib/grouping';
import { labelFor } from '@/lib/fieldOptions';
import { listSaved, removeSaved } from '@/lib/savedClusters';
import { hexOf } from '@/lib/format';
import { PageHeader, ScrollSegmented } from '@/components/ui/atoms';
import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';

const THEMES: Record<string, string> = { karar: 'Karar', risk: 'Risk', yetenek: 'Yetenek', kanıt: 'Kanıt', mimari: 'Mimari' };

export default function ClustersPage() {
  const [theme, setTheme] = useState('hepsi');
  const [saved, setSaved] = useState(listSaved);
  const counts = useMemo(() => new Map(SMART_CLUSTERS.map((c) => [c.id, filterTools(tools, c.rule)])), []);
  const list = SMART_CLUSTERS.filter((c) => theme === 'hepsi' || c.theme === theme);

  return (
    <>
      <PageHeader
        eyebrow="Dinamik (koşullu) kümeler"
        title="Kümeler"
        description="Üyelik sabit liste değildir: her küme bir koşuldur ve her açılışta veriye yeniden uygulanır. Veri güdümlü topluluklar raporlardaki birlikte anılmadan, koşullu kovalar ise sıralı CASE WHEN mantığından doğar."
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Kümeler' }]}
        actions={<Button component={Link} to="/kumeler/ozel" leftSection={<IconPlus size={16} />} variant="gradient">Kendi kümeni kur</Button>}
      />
      <Tabs defaultValue="akilli" variant="pills" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="akilli" leftSection={<IconAffiliate size={16} />}>Akıllı kümeler ({SMART_CLUSTERS.length})</Tabs.Tab>
          <Tabs.Tab value="topluluk" leftSection={<IconTopologyStar3 size={16} />}>Veri güdümlü topluluklar ({meta.communities.length})</Tabs.Tab>
          <Tabs.Tab value="kova" leftSection={<IconBucket size={16} />}>Koşullu kovalar ({BUCKET_SCHEMES.length})</Tabs.Tab>
          {saved.length > 0 && <Tabs.Tab value="kayitli">Kaydettiklerim ({saved.length})</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="akilli">
          <ScrollSegmented mb="md" value={theme} onChange={setTheme} data={[{ value: 'hepsi', label: 'Hepsi' }, ...Object.entries(THEMES).map(([value, label]) => ({ value, label }))]} />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {list.map((c) => {
              const m = counts.get(c.id) ?? [];
              return (
                <Link key={c.id} to={`/kumeler/${c.id}`} className="link-reset" aria-label={c.name}>
                  <SpotlightCard className="hover-lift" spotlightColor="rgba(112, 80, 253, 0.16)">
                    <Stack gap={8} p="md">
                      <Group justify="space-between" wrap="nowrap">
                        <Badge color={c.color} variant="light">{THEMES[c.theme]}</Badge>
                        <Badge color={c.color} variant="filled" size="lg">{m.length}</Badge>
                      </Group>
                      <Text fw={700}>{c.name}</Text>
                      <Text size="xs" c="dimmed" lineClamp={3}>{c.why}</Text>
                      <Paper p={6} radius="sm" bg="var(--atlas-muted-line)">
                        <Text size="xs" className="mono" lineClamp={2}>{describeRule(c.rule, (f, v) => labelFor(f, v))}</Text>
                      </Paper>
                      <Group gap={4}>
                        {m.slice(0, 5).map((t) => <Badge key={t.id} size="xs" variant="outline" color="gray" style={{ textTransform: 'none' }}>{t.name}</Badge>)}
                        {m.length > 5 && <Text size="xs" c="dimmed">+{m.length - 5}</Text>}
                      </Group>
                    </Stack>
                  </SpotlightCard>
                </Link>
              );
            })}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="topluluk">
          <Text size="sm" c="dimmed" mb="md">
            {meta.counts.paragraphs} tekrarsız paragrafta birlikte geçiş sayıldı, kosinüs ağırlığıyla grafa çevrildi ve Louvain modülerlik algoritmasıyla bölündü. Altın kümelerle karşılaştırmak, raporların hangi araçları gerçekte birlikte düşündüğünü gösterir.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {meta.communities.map((c) => {
              const g = goldenById.get(c.dominantGolden);
              return (
                <Paper key={c.id} component={Link} to={`/kumeler/topluluk/${c.id}`} p="md" className="glass hover-lift link-reset" style={{ borderLeft: `3px solid ${hexOf(g?.color)}` }}>
                  <Group justify="space-between"><Badge variant="filled" color={g?.color}>{c.id}</Badge><Text size="xs" c="dimmed">yoğunluk {c.density} · uyum {c.cohesion}</Text></Group>
                  <Text fw={700} mt={6}>{c.name}</Text>
                  <Text size="xs" c="dimmed" mb={6}>Baskın altın küme: {g?.name}</Text>
                  <Group gap={4}>
                    {c.members.slice(0, 10).map((m) => <Badge key={m} size="xs" variant="light" color="gray" style={{ textTransform: 'none' }}>{toolById.get(m)?.name}</Badge>)}
                    {c.members.length > 10 && <Text size="xs" c="dimmed">+{c.members.length - 10}</Text>}
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="kova">
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
            {BUCKET_SCHEMES.map((s) => {
              const g = bucketize(tools, s.buckets, s.restLabel);
              return (
                <Paper key={s.id} component={Link} to={`/kumeler/kova/${s.id}`} p="md" className="glass hover-lift link-reset">
                  <Text fw={700}>{s.name}</Text>
                  <Text size="xs" c="dimmed" mb="sm">{s.why}</Text>
                  <Group gap={0} wrap="nowrap" style={{ borderRadius: 8, overflow: 'hidden' }}>
                    {g.filter((x) => x.items.length).map((x) => (
                      <Tooltip key={x.key} label={`${x.label}: ${x.items.length}`}>
                        <div style={{ flex: x.items.length, height: 14, background: hexOf(x.color) }} />
                      </Tooltip>
                    ))}
                  </Group>
                  <Group gap={6} mt="xs">
                    {g.map((x) => <Badge key={x.key} size="xs" color={x.color ?? 'gray'} variant="light" style={{ textTransform: 'none' }}>{x.label} · {x.items.length}</Badge>)}
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="kayitli">
          <Stack gap="sm">
            {saved.map((s) => (
              <Paper key={s.id} p="sm" className="glass">
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    <Text fw={600} component={Link} to={`/kumeler/ozel?r=${encodeRule(s.rule)}&ad=${encodeURIComponent(s.name)}`} className="link-reset">{s.name}</Text>
                    <Text size="xs" c="dimmed" truncate>{describeRule(s.rule, (f, v) => labelFor(f, v))}</Text>
                  </Stack>
                  <Group gap={6} wrap="nowrap">
                    <Badge variant="light">{filterTools(tools, s.rule).length} üye</Badge>
                    <ActionIcon variant="subtle" color="red" aria-label="Kaydı sil" onClick={() => { removeSaved(s.id); setSaved(listSaved()); }}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
