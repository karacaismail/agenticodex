import { useEffect } from 'react';
import { useReducedMotion } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import {
  Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title,
} from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import {
  IconAffiliate, IconArrowRight, IconBook2, IconLayersIntersect, IconLink, IconRoute, IconTools, IconWand,
} from '@tabler/icons-react';
import { loadWorkflows, meta, tools, toolById } from '@/data';
import { DIMENSIONS } from '@/lib/dimensions';
import { SMART_CLUSTERS } from '@/lib/presets';
import { STATUS_COLOR, STATUS_LABEL, STATUS_ORDER, RING_COLOR, hexOf } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { Section, StatCard } from '@/components/ui/atoms';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';

export default function HomePage() {
  const reduced = useReducedMotion();
  const { data: wf } = useLoad(loadWorkflows);
  useEffect(() => {
    document.title = 'GenUI Atlas · araçlar, kümeler ve iş akışları';
  }, []);
  const core = meta.golden.filter((g) => g.ring === 'core');
  const support = meta.golden.filter((g) => g.ring === 'support');
  const paths = [
    { n: '01', title: 'Doğru aracı bul', detail: 'Yetenek, olgunluk ve kanıta göre keşfet.', to: '/araclar' },
    { n: '02', title: 'Mimarini kur', detail: 'Altın kümelerden çekirdek adaylarını seç.', to: '/altin-kumeler' },
    { n: '03', title: 'Akışa dönüştür', detail: 'Koşulları belirle, diyagramını oluştur.', to: '/uretici' },
  ];

  const statusData = STATUS_ORDER.map((s) => ({ name: STATUS_LABEL[s], value: meta.claimStatus[s] ?? 0, color: `${STATUS_COLOR[s]}.6` }));
  const ringData = ['Benimse', 'Dene', 'Değerlendir', 'Beklet'].map((r) => ({
    halka: r,
    Araç: tools.filter((t) => t.radarEligible && t.ring === r).length,
    Diğer: tools.filter((t) => !t.radarEligible && t.ring === r).length,
  }));

  return (
    <Stack gap="xl">
      <Box className="workspace-intro">
        <Group justify="space-between" gap="xs">
          <Text className="eyebrow" c="dimmed">ARAŞTIRMA ÇALIŞMA ALANI</Text>
          <Text size="xs" c="dimmed">Araştırma tarihi · {meta.researchAsOf}</Text>
        </Group>
      </Box>
      <Box className="home-hero">
        <div className="home-hero-copy">
          <Badge variant="light" color="aurora" mb="lg">Keşiften uygulamaya</Badge>
          {reduced ? <h1 className="hero-title">GenUI Atlas</h1> :
            <SplitText text="GenUI Atlas" tag="h1" className="hero-title" splitType="words" delay={60} duration={0.45} from={{ opacity: 0, y: 12 }} to={{ opacity: 1, y: 0 }} textAlign="left" />}
          <Text className="hero-promise" mt="md">Bir sonraki kararın için<br />bütün ekosistem burada.</Text>
          <Text className="hero-sub" mt="md">Araçlar, altın kümeler, dinamik gruplar ve iş akışları. Kanıtları incele, seçenekleri karşılaştır ve kendi sistemini tasarla.</Text>
          <Group mt="xl" gap="sm">
            <Button size="md" component={Link} to="/araclar" rightSection={<IconArrowRight size={18} />}>Araçları keşfet</Button>
            <Button size="md" variant="default" component={Link} to="/uretici" leftSection={<IconWand size={18} />}>Akış üret</Button>
          </Group>
        </div>
        <Paper className="start-panel" p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="sm">
            <Text size="sm" fw={700}>Nereden başlamak istersin?</Text>
            <IconRoute size={18} />
          </Group>
          {paths.map((p) => <Link key={p.n} to={p.to} className="start-path link-reset">
            <span className="path-number">{p.n}</span>
            <div><Text fw={650} size="sm">{p.title}</Text><Text size="xs" c="dimmed" mt={4}>{p.detail}</Text></div>
            <IconArrowRight size={18} className="path-arrow" />
          </Link>)}
          <Text size="xs" c="dimmed" mt="md">{meta.reports.length} rapor ve {meta.partialCount} ara analizden derlenen araştırma.</Text>
        </Paper>
      </Box>

      {/* ---------------------------------------------------------------- KPI */}
      <SimpleGrid className="home-stats" cols={{ base: 2, sm: 3, xl: 6 }} spacing="sm">
        <StatCard label="Varlık" value={meta.counts.tools} hint="Araç, protokol, standart, çalışma" icon={<IconTools size={22} />} to="/araclar" />
        <StatCard label="İş akışı" value={wf?.workflows.length ?? 0} hint={`${wf?.families.length ?? '…'} aile · 3 sürümde geçerli`} icon={<IconRoute size={22} />} color="teal" to="/akislar" />
        <StatCard label="Koşullu küme" value={SMART_CLUSTERS.length} hint="Kurala göre canlı üyelik" icon={<IconAffiliate size={22} />} color="grape" to="/kumeler" />
        <StatCard label="Gruplama boyutu" value={DIMENSIONS.length} hint="Neye göre? — her biri gerekçeli" icon={<IconLayersIntersect size={22} />} color="cyan" to="/gruplar" />
        <StatCard label="İddia" value={meta.counts.claims} hint="Kanıt sicilinin tamamı" icon={<IconBook2 size={22} />} color="orange" to="/kanit" />
        <StatCard label="Kaynak URL" value={meta.counts.sources} hint="Bağımsız doğrulama sayısı değildir" icon={<IconLink size={22} />} color="pink" to="/kaynaklar" />
      </SimpleGrid>

      {/* ---------------------------------------------------------------- altın kümeler */}
      <Section
        title="12 altın küme: ürünün yapı taşları"
        description="İş hedefine göre ideal gruplama. Her kümeden bir çekirdek aday seçmek mimariyi tamamlar; destek halkaları kanıt, arka uç ve platformu toplar."
        actions={<Button variant="light" component={Link} to="/altin-kumeler" rightSection={<IconArrowRight size={16} />}>Tümü</Button>}
      >
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {core.map((g) => {
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
                <SpotlightCard className="hover-lift golden-card" spotlightColor="rgba(112, 80, 253, 0.08)">
                  {card}
                </SpotlightCard>
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
