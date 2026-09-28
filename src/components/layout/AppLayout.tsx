import { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, NavLink as RouterNavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import {
  ActionIcon, AppShell, Badge, Box, Burger, Group, Kbd, NavLink, ScrollArea, Stack, Text, Tooltip, UnstyledButton, useComputedColorScheme, useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { Spotlight, spotlight, type SpotlightActionData } from '@mantine/spotlight';
import {
  IconAffiliate, IconBinaryTree2, IconBook2, IconCompass, IconFileCertificate, IconGitCompare, IconHeartbeat, IconHome2,
  IconLayersIntersect, IconLink, IconSitemap, IconMoonStars, IconRadar2, IconRoute, IconSearch, IconSparkles, IconSun, IconTools, IconWand, IconTopologyStar3,
} from '@tabler/icons-react';
import { meta, tools, topics } from '@/data';
import { DIMENSIONS } from '@/lib/dimensions';
import { SMART_CLUSTERS } from '@/lib/presets';
import { loadWorkflows } from '@/data';
import { MERMAID_RUNTIME } from '@/lib/mermaid/builder';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import { rankActions } from '@/lib/search';

const NAV = [
  { title: 'Genel', items: [
    { to: '/', label: 'Genel bakış', icon: IconHome2, end: true },
    { to: '/sentez', label: 'Sentez ve kararlar', icon: IconFileCertificate },
    { to: '/harita', label: 'Site haritası', icon: IconSitemap },
  ] },
  { title: 'Keşfet', items: [
    { to: '/araclar', label: 'Araçlar', icon: IconTools, badge: String(meta.counts.tools) },
    { to: '/altin-kumeler', label: 'Altın kümeler', icon: IconSparkles, badge: String(meta.golden.length) },
    { to: '/gruplar', label: 'Gruplama laboratuvarı', icon: IconLayersIntersect, badge: String(DIMENSIONS.length) },
    { to: '/kumeler', label: 'Dinamik kümeler', icon: IconAffiliate },
    { to: '/ag', label: 'Birlikte anılma ağı', icon: IconTopologyStar3 },
    { to: '/radar', label: 'Teknoloji radarı', icon: IconRadar2 },
    { to: '/karsilastir', label: 'Karşılaştır', icon: IconGitCompare },
  ] },
  { title: 'İş akışları', items: [
    { to: '/akislar', label: 'İş akışı kataloğu', icon: IconRoute },
    { to: '/uretici', label: 'Akış üretici', icon: IconWand },
  ] },
  { title: 'Kanıt', items: [
    { to: '/konular', label: 'Araştırma konuları', icon: IconCompass, badge: '28' },
    { to: '/kanit', label: 'İddialar', icon: IconBook2, badge: String(meta.counts.claims) },
    { to: '/kaynaklar', label: 'Kaynaklar', icon: IconLink, badge: String(meta.counts.sources) },
  ] },
  { title: 'Kalite', items: [
    { to: '/mermaid-sagligi', label: 'Mermaid sağlığı', icon: IconHeartbeat },
  ] },
];

function useSpotlightActions(): SpotlightActionData[] {
  const navigate = useNavigate();
  const [wf, setWf] = useState<SpotlightActionData[]>([]);
  useEffect(() => {
    let alive = true;
    loadWorkflows().then(({ workflows }) => {
      if (!alive) return;
      setWf(workflows.map((w) => ({ id: `w-${w.id}`, label: w.title, description: `İş akışı · ${w.summary.slice(0, 90)}`, group: 'İş akışları', onClick: () => navigate(`/akislar/${w.id}`), leftSection: <IconRoute size={18} /> })));
    });
    return () => {
      alive = false;
    };
  }, [navigate]);
  return useMemo(() => {
    const base: SpotlightActionData[] = [
      ...NAV.flatMap((s) => s.items.map((i) => ({ id: `p-${i.to}`, label: i.label, description: `Sayfa · ${s.title}`, group: 'Sayfalar', onClick: () => navigate(i.to), leftSection: <i.icon size={18} /> }))),
      ...tools.map((t) => ({ id: `t-${t.id}`, label: t.name, description: `${t.kind} · ${t.desc.slice(0, 90)}`, group: 'Araçlar', keywords: [t.id, t.vendor, ...t.tags], onClick: () => navigate(`/araclar/${t.id}`), leftSection: <IconTools size={18} /> })),
      ...meta.golden.map((g) => ({ id: `g-${g.id}`, label: g.name, description: `Altın küme · ${g.job}`, group: 'Kümeler', onClick: () => navigate(`/altin-kumeler/${g.id}`), leftSection: <IconSparkles size={18} /> })),
      ...SMART_CLUSTERS.map((c) => ({ id: `s-${c.id}`, label: c.name, description: `Akıllı küme · ${c.why.slice(0, 90)}`, group: 'Kümeler', onClick: () => navigate(`/kumeler/${c.id}`), leftSection: <IconAffiliate size={18} /> })),
      ...DIMENSIONS.map((d) => ({ id: `d-${d.key}`, label: `Grupla: ${d.label}`, description: d.question, group: 'Gruplama', onClick: () => navigate(`/gruplar/${d.key}`), leftSection: <IconBinaryTree2 size={18} /> })),
      ...topics.map((t) => ({ id: `r-${t.id}`, label: `${t.id} · ${t.title}`, description: t.question.slice(0, 100), group: 'Konular', onClick: () => navigate(`/konular/${t.id}`), leftSection: <IconCompass size={18} /> })),
    ];
    return [...base, ...wf];
  }, [navigate, wf]);
}

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme('dark');
  const location = useLocation();
  const actions = useSpotlightActions();
  useHotkeys([['mod+J', () => setColorScheme(scheme === 'dark' ? 'light' : 'dark')]]);
  useEffect(() => close(), [location.pathname, close]);

  return (
    <>
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>İçeriğe geç</a>
      <AppShell header={{ height: 64 }} navbar={{ width: 256, breakpoint: 'md', collapsed: { mobile: !opened } }} padding={{ base: 'sm', sm: 'lg' }}>
        <AppShell.Header className="atlas-header" style={{ borderTop: 0, borderLeft: 0, borderRight: 0 }}>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" aria-label="Menüyü aç/kapat" />
              <UnstyledButton component={Link} to="/" aria-label="GenUI Atlas ana sayfa">
                <Group gap={8} wrap="nowrap">
                  <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={28} height={28} />
                  <Text fw={800} ff="heading" size="lg" className="brand-name">GenUI Atlas</Text>
                </Group>
              </UnstyledButton>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <UnstyledButton onClick={() => spotlight.open()} aria-label="Ara" className="shell-search" style={{ borderRadius: 10, padding: '6px 10px' }}>
                <Group gap={8} wrap="nowrap">
                  <IconSearch size={16} />
                  <Text size="sm" c="dimmed" visibleFrom="sm">Araç, küme, akış ara…</Text>
                  <Kbd size="xs" visibleFrom="sm">⌘K</Kbd>
                </Group>
              </UnstyledButton>
              <Tooltip label="Uygulamanın sabitlediği Mermaid sürümü; bütün diyagramlar 10.9 · 11.17 · 12.0 ile doğrulandı">
                <Badge component={Link} to="/mermaid-sagligi" variant="dot" color="teal" visibleFrom="lg" style={{ cursor: 'pointer' }}>Mermaid {MERMAID_RUNTIME}</Badge>
              </Tooltip>
              <Tooltip label={`${scheme === 'dark' ? 'Açık' : 'Koyu'} tema (⌘J)`}>
                <ActionIcon variant="subtle" size="lg" aria-label="Temayı değiştir" onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}>
                  {scheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar className="atlas-sidebar" style={{ borderTop: 0, borderBottom: 0, borderLeft: 0 }}>
          <ScrollArea h="100%" type="hover" px="sm" py="md">
            <Stack gap="md">
              <Text size="xs" fw={600} c="dimmed" px="sm" mb="xs">EKOSİSTEM REHBERİ</Text>
              {NAV.map((sec) => (
                <Stack key={sec.title} gap={2}>
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" style={{ letterSpacing: 1 }}>{sec.title}</Text>
                  {sec.items.map((i) => (
                    <NavLink
                      key={i.to}
                      component={RouterNavLink}
                      to={i.to}
                      end={'end' in i ? i.end : false}
                      label={i.label}
                      leftSection={<i.icon size={18} stroke={1.7} />}
                      rightSection={'badge' in i && i.badge ? <Badge size="xs" variant="light" color="gray">{i.badge}</Badge> : undefined}
                      style={{ borderRadius: 10 }}
                      active={i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to)}
                    />
                  ))}
                </Stack>
              ))}
              <Box px="sm" pt="md">
                <Text size="xs" c="dimmed">
                  Veri: {meta.reports.length} rapor · {meta.partialCount} ara analiz · {meta.counts.claims} iddia · {meta.counts.sources} kaynak. Araştırma tarihi {meta.researchAsOf}.
                </Text>
              </Box>
            </Stack>
          </ScrollArea>
        </AppShell.Navbar>

        <AppShell.Main id="main-content" tabIndex={-1}>
          <Box maw={1480} mx="auto" key={location.pathname} style={{ animation: 'atlasFade 260ms ease' }}>
            <Suspense fallback={<AtlasLoader label="Sayfa hazırlanıyor" />}>
              <Outlet />
            </Suspense>
          </Box>
        </AppShell.Main>
      </AppShell>
      <Spotlight
        actions={actions}
        limit={24}
        nothingFound="Sonuç yok"
        highlightQuery
        scrollable
        maxHeight={520}
        searchProps={{ leftSection: <IconSearch size={18} />, placeholder: 'Araç, küme, konu, iş akışı ara…' }}
        shortcut={['mod+K', '/']}
        filter={rankActions}
      />
      <ScrollRestoration />
      <style>{'@keyframes atlasFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'}</style>
    </>
  );
}
