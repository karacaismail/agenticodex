import { useEffect, useMemo } from 'react';
import { useReducedMotion } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import {
  Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title, useComputedColorScheme,
} from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import {
  IconAffiliate, IconArrowRight, IconBook2, IconLayersIntersect, IconLink, IconRoute, IconSparkles, IconTools, IconWand,
} from '@tabler/icons-react';
import { loadWorkflows, meta, tools, toolById } from '@/data';
import { DIMENSIONS } from '@/lib/dimensions';
import { SMART_CLUSTERS } from '@/lib/presets';
import { STATUS_COLOR, STATUS_LABEL, STATUS_ORDER, RING_COLOR, hexOf } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { Section, StatCard } from '@/components/ui/atoms';
import Aurora from '@/components/reactbits/Aurora/Aurora';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import RotatingText from '@/components/reactbits/RotatingText/RotatingText';
import BlurText from '@/components/reactbits/BlurText/BlurText';
import LogoLoop from '@/components/reactbits/LogoLoop/LogoLoop';
import ClickSpark from '@/components/reactbits/ClickSpark/ClickSpark';
import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';
import BorderGlow from '@/components/reactbits/BorderGlow/BorderGlow';

export default function HomePage() {
  const dark = useComputedColorScheme('dark') === 'dark';
  const reduced = useReducedMotion();
  const { data: wf } = useLoad(loadWorkflows);
  useEffect(() => {
    document.title = 'GenUI Atlas · araçlar, kümeler ve iş akışları';
  }, []);
  const heroText = `${meta.counts.claims} iddialı kanıt sicili ve ${meta.counts.sources} kaynaktan çıkarılmış ${meta.counts.tools} varlık; ${DIMENSIONS.length} gruplama boyutu, ${SMART_CLUSTERS.length} koşullu küme ve üç Mermaid sürümünde doğrulanmış yüzlerce iş akışı.`;
  const core = meta.golden.filter((g) => g.ring === 'core');
  const support = meta.golden.filter((g) => g.ring === 'support');

  const loopItems = useMemo(
    () =>
      [...tools]
        .filter((t) => t.radarEligible)
        .sort((a, b) => b.visibility - a.visibility)
        .slice(0, 28)
        .map((t) => ({
          node: (
            <Link to={`/araclar/${t.id}`} className="link-reset">
              <Badge size="lg" variant="light" color={meta.golden.find((g) => g.id === t.golden)?.color ?? 'gray'} radius="xl" style={{ textTransform: 'none', fontWeight: 600, cursor: 'pointer' }}>
                {t.name}
              </Badge>
            </Link>
          ),
          title: t.name,
        })),
    [],
  );

  const statusData = STATUS_ORDER.map((s) => ({ name: STATUS_LABEL[s], value: meta.claimStatus[s] ?? 0, color: `${STATUS_COLOR[s]}.6` }));
  const ringData = ['Benimse', 'Dene', 'Değerlendir', 'Beklet'].map((r) => ({
    halka: r,
    Araç: tools.filter((t) => t.radarEligible && t.ring === r).length,
    Diğer: tools.filter((t) => !t.radarEligible && t.ring === r).length,
  }));

  return (
    <Stack gap="xl">
      {/* ---------------------------------------------------------------- hero */}
      <Box className="hero-shell glass" p={{ base: 'lg', sm: 48 }} mih={{ base: 420, sm: 460 }}>
        <Box className="hero-bg" aria-hidden style={reduced ? { background: dark ? 'radial-gradient(900px 400px at 20% 0%, rgba(112,80,253,.35), transparent 60%), radial-gradient(700px 400px at 90% 10%, rgba(18,184,134,.22), transparent 60%)' : 'radial-gradient(900px 400px at 20% 0%, rgba(160,136,254,.35), transparent 60%), radial-gradient(700px 400px at 90% 10%, rgba(150,242,215,.35), transparent 60%)' } : undefined}>
          {!reduced && <Aurora colorStops={dark ? ['#3f26b3', '#12b886', '#7050fd'] : ['#c2b3ff', '#96f2d7', '#a088fe']} amplitude={1.1} blend={0.55} speed={0.6} lightMode={!dark} />}
        </Box>
        <Stack gap="lg" maw={900}>
          <Group gap="xs">
            <Badge variant="light" color="teal" radius="xl">Araştırma tarihi {meta.researchAsOf}</Badge>
            <Badge variant="light" color="aurora" radius="xl">{meta.reports.length} rapor · {meta.partialCount} ara analiz</Badge>
          </Group>
          {reduced ? (
            <h1 className="hero-title">GenUI Atlas</h1>
          ) : (
            <SplitText text="GenUI Atlas" tag="h1" className="hero-title" splitType="chars" delay={40} duration={0.7} from={{ opacity: 0, y: 36 }} to={{ opacity: 1, y: 0 }} textAlign="left" />
          )}
          <Group gap={10} wrap="wrap" align="center">
            <Text fz={{ base: 20, sm: 28 }} fw={700} ff="heading">Bütün</Text>
            {reduced ? (
              <span className="rotating-pill">araçlar, altın kümeler, dinamik gruplar, koşullu kümeler, iş akışları ve kanıtlar</span>
            ) : (
            <RotatingText
              texts={['araçlar', 'altın kümeler', 'dinamik gruplar', 'koşullu kümeler', 'iş akışları', 'kanıtlar']}
              mainClassName="rotating-pill"
              staggerFrom="last"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-120%' }}
              staggerDuration={0.02}
              splitLevelClassName="rotating-split"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2400}
            />
            )}
            <Text fz={{ base: 20, sm: 28 }} fw={700} ff="heading">tek haritada.</Text>
          </Group>
          {reduced ? <p className="hero-sub">{heroText}</p> : <BlurText text={heroText} className="hero-sub" delay={40} animateBy="words" direction="top" />}
          <Group gap="sm">
            <Box className="spark-inline">
              <ClickSpark sparkColor={dark ? '#c2b3ff' : '#6644fe'} sparkCount={8} sparkRadius={18}>
                <Button size="md" variant="gradient" component={Link} to="/araclar" rightSection={<IconArrowRight size={18} />}>Araçları keşfet</Button>
              </ClickSpark>
            </Box>
            <Button size="md" variant={dark ? 'white' : 'default'} color="dark" component={Link} to="/uretici" leftSection={<IconWand size={18} />}>Akış üret</Button>
            <Button size="md" variant="subtle" component={Link} to="/altin-kumeler" leftSection={<IconSparkles size={18} />}>Altın kümeler</Button>
          </Group>
        </Stack>
      </Box>

      {/* ---------------------------------------------------------------- KPI */}
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 3 }} spacing="md">
        <StatCard label="Varlık" value={meta.counts.tools} hint="Araç, protokol, standart, çalışma" icon={<IconTools size={22} />} to="/araclar" />
        <StatCard label="İş akışı" value={wf?.workflows.length ?? 0} hint={`${wf?.families.length ?? '…'} aile · 3 sürümde geçerli`} icon={<IconRoute size={22} />} color="teal" to="/akislar" />
        <StatCard label="Koşullu küme" value={SMART_CLUSTERS.length} hint="Kurala göre canlı üyelik" icon={<IconAffiliate size={22} />} color="grape" to="/kumeler" />
        <StatCard label="Gruplama boyutu" value={DIMENSIONS.length} hint="Neye göre? — her biri gerekçeli" icon={<IconLayersIntersect size={22} />} color="cyan" to="/gruplar" />
        <StatCard label="İddia" value={meta.counts.claims} hint="Kanıt sicilinin tamamı" icon={<IconBook2 size={22} />} color="orange" to="/kanit" />
        <StatCard label="Kaynak URL" value={meta.counts.sources} hint="Bağımsız doğrulama sayısı değildir" icon={<IconLink size={22} />} color="pink" to="/kaynaklar" />
      </SimpleGrid>

      <Box className="scroll-fade-x" py="xs">
        {reduced ? (
          <Group gap={8} justify="center">{loopItems.map((l, i) => <Box key={i}>{l.node}</Box>)}</Group>
        ) : (
          <LogoLoop logos={loopItems} speed={42} direction="left" logoHeight={30} gap={14} pauseOnHover scaleOnHover fadeOut={false} ariaLabel="En görünür araçlar" />
        )}
      </Box>

      {/* ---------------------------------------------------------------- altın kümeler */}
      <Section
        title="12 altın küme: ürünün yapı taşları"
        description="İş hedefine göre ideal gruplama. Her kümeden bir çekirdek aday seçmek mimariyi tamamlar; destek halkaları kanıt, arka uç ve platformu toplar."
        actions={<Button variant="light" component={Link} to="/altin-kumeler" rightSection={<IconArrowRight size={16} />}>Tümü</Button>}
      >
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {core.map((g, i) => {
            const members = g.members.map((m) => toolById.get(m)!).filter(Boolean);
            const lead = members.filter((t) => t.stance === 'Çekirdek aday' || t.stance === 'Prototip adayı').slice(0, 3);
            const card = (
              <Stack gap={8} p="md">
                <Group justify="space-between" wrap="nowrap">
                  <Badge variant="filled" color={g.color} size="sm">{g.id}</Badge>
                  <Text size="xs" c="dimmed">{members.length} üye</Text>
                </Group>
                <Text fw={700} lineClamp={2}>{g.name}</Text>
                <Text size="xs" c="dimmed" lineClamp={2}>{g.job}</Text>
                <Group gap={4}>
                  {(lead.length ? lead : members.slice(0, 3)).map((t) => (
                    <Badge key={t.id} size="xs" variant="light" color={g.color} style={{ textTransform: 'none' }}>{t.name}</Badge>
                  ))}
                </Group>
              </Stack>
            );
            return (
              <Link key={g.id} to={`/altin-kumeler/${g.id}`} className="link-reset" aria-label={g.name}>
                {i === 0 ? (
                  <BorderGlow borderRadius={16} glowColor="265 90 70" backgroundColor={dark ? '#15162a' : '#ffffff'} colors={['#a088fe', '#20c997', '#7050fd']} animated>
                    {card}
                  </BorderGlow>
                ) : (
                  <SpotlightCard className="hover-lift" spotlightColor="rgba(112, 80, 253, 0.16)">
                    <Box h={3} style={{ background: hexOf(g.color), borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
                    {card}
                  </SpotlightCard>
                )}
              </Link>
            );
          })}
        </SimpleGrid>
        <Group gap="xs" mt="md">
          <Text size="sm" c="dimmed">Destek halkaları:</Text>
          {support.map((g) => (
            <Badge key={g.id} component={Link} to={`/altin-kumeler/${g.id}`} variant="outline" color="gray" style={{ cursor: 'pointer', textTransform: 'none' }}>
              {g.name} · {g.members.length}
            </Badge>
          ))}
        </Group>
      </Section>

      {/* ---------------------------------------------------------------- kanıt + radar */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Section title="Kanıt sicilinin durumu" description="889 iddianın son değerlendirme durumu. Aynı kaynağın tekrarı bağımsız doğrulama sayılmaz.">
          <Group justify="center" gap="xl" wrap="wrap">
            <DonutChart data={statusData} size={180} thickness={26} withLabelsLine={false} tooltipDataSource="segment" chartLabel={`${meta.counts.claims} iddia`} />
            <Stack gap={6}>
              {statusData.map((s, i) => (
                <Group key={s.name} gap={8}>
                  <span className="ring-dot" style={{ background: hexOf(STATUS_COLOR[STATUS_ORDER[i]]) }} />
                  <Text size="sm" w={120}>{s.name}</Text>
                  <Text size="sm" fw={700}>{s.value}</Text>
                </Group>
              ))}
              <Button size="xs" variant="subtle" component={Link} to="/kanit" rightSection={<IconArrowRight size={14} />}>İddiaları incele</Button>
            </Stack>
          </Group>
        </Section>
        <Section title="Radar halkaları" description="Karar farkında halka: bileşik puan (kanıt, kapsama, olgunluk, duruş) ve raporların çekirdek önerisi birlikte. Formül şeffaf; veriyle güncellenir.">
          <BarChart
            h={200}
            data={ringData}
            dataKey="halka"
            type="stacked"
            series={[{ name: 'Araç', color: 'aurora.5' }, { name: 'Diğer', color: 'gray.5' }]}
            tickLine="none"
            gridAxis="y"
            barProps={{ radius: 6 }}
          />
          <Group gap="xs" mt="xs">
            {Object.entries(RING_COLOR).map(([r, c]) => (
              <Badge key={r} component={Link} to={`/gruplar/ring/${encodeURIComponent(r)}`} color={c} variant="light" style={{ cursor: 'pointer' }}>{r}</Badge>
            ))}
            <Button size="xs" variant="subtle" component={Link} to="/radar" rightSection={<IconArrowRight size={14} />}>Radar</Button>
          </Group>
        </Section>
      </SimpleGrid>

      {/* ---------------------------------------------------------------- gruplama + akış aileleri */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Section title="Neye göre gruplanıyor?" description="Her boyut bir karar sorusuna karşılık gelir. Boyutları iç içe geçirip koşullu filtre ekleyebilirsin.">
          <Stack gap={6}>
            {DIMENSIONS.slice(0, 9).map((d) => (
              <Paper key={d.key} component={Link} to={`/gruplar/${d.key}`} p="xs" radius="md" className="link-reset hover-lift" withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600}>{d.label}</Text>
                    <Text size="xs" c="dimmed" truncate>{d.question}</Text>
                  </Stack>
                  <IconArrowRight size={16} opacity={0.5} />
                </Group>
              </Paper>
            ))}
            <Button variant="light" component={Link} to="/gruplar">Bütün {DIMENSIONS.length} boyut</Button>
          </Stack>
        </Section>
        <Section title="İş akışı aileleri" description="Aynı güvenli oluşturucuyla üretildi; derleme sırasında Mermaid 10.9, 11.17 ve 12.0 ile ayrıştırıldı.">
          <Stack gap={6}>
            {(wf?.families ?? []).map((f) => (
              <Paper key={f.id} component={Link} to={`/akislar/aile/${f.id}`} p="xs" radius="md" className="link-reset hover-lift" withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon size="sm" variant="light" color="teal"><IconRoute size={14} /></ThemeIcon>
                    <Text size="sm" fw={600} truncate>{f.name}</Text>
                  </Group>
                  <Badge variant="light">{f.count}</Badge>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Section>
      </SimpleGrid>

      <Paper p="lg" className="glass">
        <Title order={4} mb={6}>Sentezin ana kararı</Title>
        <Text c="dimmed">
          Sabit ve öğrenilebilir bir uygulama kabuğu kur; AI’a bu kabuğun içindeki çalışma alanında izinli bileşenleri seçme ve birleştirme yetkisi ver. Gerçek veriyi,
          kullanıcı yetkisini, işlem durumunu ve kaydı uygulama yönetsin; animasyon bu gerçek durumu anlaşılır kılsın.
        </Text>
        <Button mt="sm" variant="subtle" component={Link} to="/sentez" rightSection={<IconArrowRight size={16} />}>Karar defteri, kapılar ve riskler</Button>
      </Paper>
    </Stack>
  );
}
