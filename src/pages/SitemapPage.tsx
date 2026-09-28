import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, Anchor, Badge, Group, Paper, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { loadClaims, loadSources, loadWorkflows, meta, tools, topics } from '@/data';
import { buildSitemap } from '@/lib/sitemap';
import { useLoad } from '@/hooks/useLoad';
import { nf } from '@/lib/format';
import { PageHeader, StatCard } from '@/components/ui/atoms';
import { AtlasLoader } from '@/components/ui/AtlasLoader';

const loadAll = () => Promise.all([loadClaims(), loadSources(), loadWorkflows()]);

export default function SitemapPage() {
  const { data } = useLoad(loadAll);
  const [q, setQ] = useState('');
  const [dq] = useDebouncedValue(q, 200);
  const [open, setOpen] = useState<string[]>(['altin', 'kumeler']);
  const families = useMemo(() => (data ? buildSitemap({ tools, meta, topics, claims: data[0], sources: data[1], workflows: data[2].workflows }) : []), [data]);
  if (!data) return <AtlasLoader label="Site haritası hazırlanıyor" />;
  const needle = dq.trim().toLocaleLowerCase('tr');
  const total = families.reduce((n, f) => n + f.pages.length, 0);
  return (
    <>
      <PageHeader
        eyebrow="Gezinme"
        title="Site haritası"
        description={`Atlasın bütün dinamik sayfaları: ${nf.format(total)} sayfa, ${families.length} aile. Her sayfa veriden üretilir; URL’ler kalıcı ve paylaşılabilirdir.`}
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Site haritası' }]}
      />
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md" mb="lg">
        <StatCard label="Dinamik sayfa" value={total} hint="Bütün aileler" />
        <StatCard label="Araç sayfası" value={families.find((f) => f.id === 'araclar')?.pages.length ?? 0} color="teal" />
        <StatCard label="İş akışı sayfası" value={families.find((f) => f.id === 'akislar')?.pages.length ?? 0} color="grape" />
        <StatCard label="Kanıt sayfası" value={(families.find((f) => f.id === 'iddialar')?.pages.length ?? 0) + (families.find((f) => f.id === 'kaynaklar')?.pages.length ?? 0)} color="orange" />
      </SimpleGrid>
      <Paper p="md" className="glass" mb="md">
        <TextInput aria-label="Sayfa ara" placeholder="Sayfa ara: ör. Uppy, R12, tehdit, kurumsal…" leftSection={<IconSearch size={16} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      </Paper>
      <Accordion multiple variant="separated" radius="lg" value={needle ? families.map((f) => f.id) : open} onChange={(v) => !needle && setOpen(v)}>
        {families.map((f) => {
          const pages = needle ? f.pages.filter((p) => p.label.toLocaleLowerCase('tr').includes(needle) || p.to.includes(needle)) : f.pages;
          if (needle && !pages.length) return null;
          return (
            <Accordion.Item key={f.id} value={f.id} className="glass">
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" pr="sm">
                  <Stack gap={0}>
                    <Text fw={700}>{f.name}</Text>
                    <Text size="xs" c="dimmed">{f.desc}</Text>
                  </Stack>
                  <Badge variant="light" size="lg">{pages.length}</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={4} verticalSpacing={4}>
                  {pages.slice(0, needle ? 300 : 120).map((p) => (
                    <Anchor key={p.to} component={Link} to={p.to} size="sm" truncate>{p.label}</Anchor>
                  ))}
                </SimpleGrid>
                {pages.length > (needle ? 300 : 120) && <Text size="xs" c="dimmed" mt="xs">+{pages.length - (needle ? 300 : 120)} sayfa daha — aramayla daralt.</Text>}
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </>
  );
}
