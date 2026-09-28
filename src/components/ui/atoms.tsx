import { useEffect, type ReactNode } from 'react';
import { useReducedMotion } from '@mantine/hooks';
import type { SegmentedControlProps } from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  Anchor, Badge, Box, Breadcrumbs, Group, Paper, Progress, RingProgress, ScrollArea, SegmentedControl, Stack, Text, ThemeIcon, Title, Tooltip, useComputedColorScheme,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import type { ClaimStatus, Tool } from '@/data/types';
import { goldenById, layerById } from '@/data';
import { RING_COLOR, RISK_COLOR, STATUS_COLOR, STATUS_LABEL, STATUS_ORDER, hexOf, nf } from '@/lib/format';
import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';
import CountUp from '@/components/reactbits/CountUp/CountUp';
import ShinyText from '@/components/reactbits/ShinyText/ShinyText';
import GradientText from '@/components/reactbits/GradientText/GradientText';

/* ------------------------------------------------------------------ sayfa başlığı */
export function PageHeader({
  eyebrow, title, description, crumbs, actions, gradient = true, children, docTitle,
}: {
  eyebrow?: string;
  title: ReactNode;
  docTitle?: string;
  description?: ReactNode;
  crumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  gradient?: boolean;
  children?: ReactNode;
}) {
  const dark = useComputedColorScheme('dark') === 'dark';
  const reduced = useReducedMotion();
  const pageTitle = docTitle ?? (typeof title === 'string' ? title : undefined);
  useEffect(() => {
    if (pageTitle) document.title = `${pageTitle} · GenUI Atlas`;
  }, [pageTitle]);
  return (
    <Stack gap="xs" mb="lg">
      {crumbs && crumbs.length > 0 && (
        <Breadcrumbs separatorMargin={6} fz="xs">
          {crumbs.map((c, i) =>
            c.to ? (
              <Anchor key={i} component={Link} to={c.to} size="xs" c="dimmed">{c.label}</Anchor>
            ) : (
              <Text key={i} size="xs" c="dimmed">{c.label}</Text>
            ),
          )}
        </Breadcrumbs>
      )}
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <Stack gap={4} style={{ flex: '1 1 420px', minWidth: 0 }}>
          {eyebrow && (
            <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: 1.2 }}>
              {reduced ? <span style={{ color: dark ? '#b3aee0' : '#545b68' }}>{eyebrow}</span> : <ShinyText text={eyebrow} speed={3} color={dark ? '#9d97c7' : '#6b6690'} shineColor={dark ? '#ffffff' : '#7050fd'} />}
            </Text>
          )}
          <Title order={1} fz={{ base: 26, sm: 34 }} lh={1.15} style={{ wordBreak: 'break-word' }}>
            {gradient && typeof title === 'string' && reduced ? (
              <span className="grad-text">{title}</span>
            ) : gradient && typeof title === 'string' ? (
              <GradientText colors={['#a088fe', '#7050fd', '#20c997', '#a088fe']} animationSpeed={9} className="atlas-gradient-title">{title}</GradientText>
            ) : (
              title
            )}
          </Title>
          {description && <Text c="dimmed" size="md" maw={880}>{description}</Text>}
        </Stack>
        {actions && <Group gap="xs">{actions}</Group>}
      </Group>
      {children}
    </Stack>
  );
}

/* ------------------------------------------------------------------ rozetler */
export function RingBadge({ ring, size = 'sm' }: { ring: string; size?: 'xs' | 'sm' | 'md' }) {
  return <Badge size={size} color={RING_COLOR[ring] ?? 'gray'} variant="light" leftSection={<span className="ring-dot" style={{ background: hexOf(RING_COLOR[ring]) }} />}>{ring}</Badge>;
}
export function RiskBadge({ tier, size = 'sm' }: { tier: string; size?: 'xs' | 'sm' | 'md' }) {
  return <Badge size={size} color={RISK_COLOR[tier] ?? 'gray'} variant="outline">Risk: {tier}</Badge>;
}
export function StatusBadge({ status, size = 'sm' }: { status: ClaimStatus; size?: 'xs' | 'sm' | 'md' }) {
  return <Badge size={size} color={STATUS_COLOR[status]} variant="light">{STATUS_LABEL[status]}</Badge>;
}
export function GoldenBadge({ id, size = 'sm' }: { id: string; size?: 'xs' | 'sm' | 'md' }) {
  const g = goldenById.get(id);
  return (
    <Badge size={size} component={Link} to={`/altin-kumeler/${id}`} color={g?.color ?? 'gray'} variant="light" style={{ cursor: 'pointer', textTransform: 'none' }}>
      {g?.name ?? id}
    </Badge>
  );
}
export function LayerBadge({ id, size = 'sm' }: { id: string; size?: 'xs' | 'sm' | 'md' }) {
  return (
    <Badge size={size} component={Link} to={`/gruplar/layer/${encodeURIComponent(id)}`} color="gray" variant="outline" style={{ cursor: 'pointer', textTransform: 'none' }}>
      {layerById.get(id)?.name ?? id}
    </Badge>
  );
}

/* ------------------------------------------------------------------ kanıt çubuğu */
export function EvidenceBar({ counts, size = 'md', showLegend = false }: { counts: Partial<Record<ClaimStatus, number>>; size?: 'xs' | 'sm' | 'md' | 'lg'; showLegend?: boolean }) {
  const total = STATUS_ORDER.reduce((s, k) => s + (counts[k] ?? 0), 0);
  return (
    <Stack gap={4}>
      <Progress.Root size={size} radius="xl">
        {total === 0 ? (
          <Progress.Section value={100} color="gray.3" aria-label="İddia yok" />
        ) : (
          STATUS_ORDER.map((k) =>
            counts[k] ? (
              <Tooltip key={k} label={`${STATUS_LABEL[k]}: ${counts[k]}`}>
                <Progress.Section value={((counts[k] ?? 0) / total) * 100} color={STATUS_COLOR[k]} aria-label={`${STATUS_LABEL[k]}: ${counts[k]} / ${total}`} />
              </Tooltip>
            ) : null,
          )
        )}
      </Progress.Root>
      {showLegend && (
        <Group gap="sm">
          {STATUS_ORDER.map((k) => (
            <Group key={k} gap={4}>
              <span className="ring-dot" style={{ background: hexOf(STATUS_COLOR[k]) }} />
              <Text size="xs" c="dimmed">{STATUS_LABEL[k]} {counts[k] ?? 0}</Text>
            </Group>
          ))}
        </Group>
      )}
    </Stack>
  );
}

/* ------------------------------------------------------------------ KPI */
export function StatCard({ label, value, hint, icon, color = 'aurora', to, suffix }: { label: string; value: number; hint?: string; icon?: ReactNode; color?: string; to?: string; suffix?: string }) {
  const reduced = useReducedMotion();
  const body = (
    <SpotlightCard className="hover-lift" spotlightColor="rgba(112, 80, 253, 0.18)">
      <Group p="md" gap="md" wrap="nowrap" align="flex-start">
        {icon && <ThemeIcon size={42} radius="md" variant="light" color={color}>{icon}</ThemeIcon>}
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: 0.6 }}>{label}</Text>
          <Text fz={28} fw={800} ff="heading" lh={1.2}>
            {reduced ? nf.format(value) : <CountUp to={value} duration={1.4} separator="." />}{suffix}
          </Text>
          {hint && <Text size="xs" c="dimmed" lineClamp={2}>{hint}</Text>}
        </Stack>
      </Group>
    </SpotlightCard>
  );
  return to ? <Link to={to} className="link-reset" aria-label={label}>{body}</Link> : body;
}

/* ------------------------------------------------------------------ araç kartı */
export function ToolCard({ t, compact = false }: { t: Tool; compact?: boolean }) {
  const g = goldenById.get(t.golden);
  return (
    <Link to={`/araclar/${t.id}`} className="link-reset" aria-label={t.name}>
      <SpotlightCard className="hover-lift" spotlightColor="rgba(112, 80, 253, 0.16)">
        <Box h={3} style={{ background: hexOf(g?.color), borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
        <Stack gap={8} p="md">
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text fw={700} size="md" truncate>{t.name}</Text>
              <Text size="xs" c="dimmed" truncate>{t.kind} · {layerById.get(t.layer)?.name}</Text>
            </Stack>
            <Tooltip label={`Bileşik puan ${t.composite}/100`}>
              <RingProgress size={46} thickness={4} roundCaps sections={[{ value: t.composite, color: RING_COLOR[t.ring] ?? 'gray' }]}
                label={<Text ta="center" size="xs" fw={700}>{t.composite}</Text>} />
            </Tooltip>
          </Group>
          {!compact && <Text size="sm" c="dimmed" lineClamp={2} mih={40}>{t.desc || 'Açıklama yok.'}</Text>}
          <Group gap={6}>
            <RingBadge ring={t.ring} size="xs" />
            <Badge size="xs" variant="outline" color="gray">{t.license}</Badge>
            <Badge size="xs" variant="outline" color="gray">{t.maturity}</Badge>
            {!compact && <Badge size="xs" variant="light" color={RISK_COLOR[t.riskTier]}>Risk {t.riskTier}</Badge>}
          </Group>
          <EvidenceBar counts={t.claimStatus} size="xs" />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">{t.coverage}/8 rapor · {t.claimCount} iddia · {nf.format(t.mentionTotal)} geçiş</Text>
            <IconArrowRight size={14} opacity={0.5} />
          </Group>
        </Stack>
      </SpotlightCard>
    </Link>
  );
}

/* ------------------------------------------------------------------ bölüm */
export function Section({ title, description, actions, children, id }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <Paper p={{ base: 'md', sm: 'lg' }} className="glass" id={id} component="section" style={{ overflow: 'clip' }}>
      <Group justify="space-between" mb="md" wrap="wrap" gap="xs">
        <Stack gap={2}>
          <Title order={3} fz={{ base: 18, sm: 20 }}>{title}</Title>
          {description && <Text size="sm" c="dimmed">{description}</Text>}
        </Stack>
        {actions}
      </Group>
      {children}
    </Paper>
  );
}

export function ToolChip({ id, name, color }: { id: string; name: string; color?: string }) {
  return (
    <Badge component={Link} to={`/araclar/${id}`} variant="light" color={color ?? 'gray'} size="sm" style={{ cursor: 'pointer', textTransform: 'none' }}>
      {name}
    </Badge>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap" py={4} style={{ borderBottom: '1px dashed var(--atlas-muted-line)' }}>
      <Text size="sm" c="dimmed">{k}</Text>
      <Box ta="right" style={{ minWidth: 0 }}>{typeof v === 'string' || typeof v === 'number' ? <Text size="sm" fw={500}>{v}</Text> : v}</Box>
    </Group>
  );
}

/** Dar ekranda taşmak yerine yatay kaydırılan SegmentedControl. */
export function ScrollSegmented(props: SegmentedControlProps) {
  return (
    <ScrollArea type="never" maw="100%" offsetScrollbars={false} viewportProps={{ tabIndex: 0, 'aria-label': 'Seçenekler' }}>
      <SegmentedControl {...props} />
    </ScrollArea>
  );
}
