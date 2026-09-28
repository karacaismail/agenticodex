import { Link } from 'react-router-dom';
import { Badge, Box, Group, Paper, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowsSplit, IconCalendarStats, IconChartDots3, IconTimeline } from '@tabler/icons-react';
import type { Workflow } from '@/data/types';
import { toolById } from '@/data';
import type { GroupNode } from '@/lib/grouping';
import { DIAGRAM_COLOR, DIAGRAM_LABEL, hexOf } from '@/lib/format';
import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';

export const DIAGRAM_ICON = {
  flowchart: IconArrowsSplit,
  sequence: IconTimeline,
  state: IconChartDots3,
  gantt: IconCalendarStats,
} as const;

export function Complexity({ n }: { n: number }) {
  return (
    <Tooltip label={`Karmaşıklık ${n}/5`}>
      <Group gap={3} role="img" aria-label={`Karmaşıklık ${n}/5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i} w={6} h={6} style={{ borderRadius: 2, background: i <= n ? 'var(--mantine-color-aurora-4)' : 'var(--atlas-muted-line)' }} />
        ))}
      </Group>
    </Tooltip>
  );
}

export function WorkflowCard({ w, familyName }: { w: Workflow; familyName?: string }) {
  const Icon = DIAGRAM_ICON[w.diagram];
  return (
    <Link to={`/akislar/${w.id}`} className="link-reset" aria-label={w.title}>
      <SpotlightCard className="hover-lift" spotlightColor="rgba(32, 201, 151, 0.14)">
        <Stack gap={12} p="lg" h="100%">
          <Group justify="space-between" wrap="nowrap">
            <Badge size="xs" variant="light" color={DIAGRAM_COLOR[w.diagram]} leftSection={<Icon size={12} />}>{DIAGRAM_LABEL[w.diagram]}</Badge>
            <Complexity n={w.complexity} />
          </Group>
          <Text fw={650} size="md" lineClamp={2}>{w.title}</Text>
          <Text size="sm" c="dimmed" lineClamp={3}>{w.summary}</Text>
          <Group gap={4} mt="auto">
            {familyName && <Badge size="xs" variant="outline" color="gray" style={{ textTransform: 'none' }}>{familyName}</Badge>}
            {w.tools.slice(0, 3).map((t) => (
              <Badge key={t} size="xs" variant="dot" color="gray" style={{ textTransform: 'none' }}>{toolById.get(t)?.name ?? t}</Badge>
            ))}
            {w.tools.length > 3 && <Text size="xs" c="dimmed">+{w.tools.length - 3}</Text>}
          </Group>
        </Stack>
      </SpotlightCard>
    </Link>
  );
}

/** Gruplar pano görünümü; her grup kendi sayfasına bağlanabilir. */
export function GroupBoard({ groups, linkFor, maxItems = 14, cols = { base: 1, sm: 2, lg: 3 } }: {
  groups: GroupNode[];
  linkFor?: (g: GroupNode) => string | undefined;
  maxItems?: number;
  cols?: Record<string, number>;
}) {
  const total = groups.reduce((s, g) => s + g.items.length, 0) || 1;
  return (
    <SimpleGrid cols={cols} spacing="md">
      {groups.map((g) => {
        const href = linkFor?.(g);
        const color = hexOf(g.color ?? 'aurora');
        const card = (
          <Paper p="md" className={`glass ${href ? 'hover-lift' : ''}`} h="100%" style={{ borderLeft: `3px solid ${color}` }}>
            <Stack gap={8}>
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Text fw={700} size="sm" style={{ minWidth: 0 }} lineClamp={2}>{g.label}</Text>
                <Badge variant="filled" color={g.color ?? 'aurora'} size="md" style={{ flexShrink: 0 }}>{g.items.length}</Badge>
              </Group>
              {g.desc && <Text size="xs" c="dimmed" lineClamp={2}>{g.desc}</Text>}
              <Box h={4} style={{ borderRadius: 4, background: 'var(--atlas-muted-line)' }}>
                <Box h={4} style={{ width: `${(g.items.length / total) * 100}%`, borderRadius: 4, background: color, minWidth: g.items.length ? 4 : 0 }} />
              </Box>
              {g.children ? (
                <Stack gap={6}>
                  {g.children.map((c) => (
                    <Group key={c.key} gap={6} wrap="nowrap" align="flex-start">
                      <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>{c.items.length}</Badge>
                      <Text size="xs" style={{ minWidth: 0 }}>
                        <b>{c.label}</b>: {c.items.slice(0, 6).map((t) => t.name).join(', ')}{c.items.length > 6 ? '…' : ''}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Group gap={4}>
                  {g.items.slice(0, maxItems).map((t) => (
                    <Badge key={t.id} size="xs" variant="light" color="gray" style={{ textTransform: 'none' }}>{t.name}</Badge>
                  ))}
                  {g.items.length > maxItems && <Text size="xs" c="dimmed">+{g.items.length - maxItems}</Text>}
                </Group>
              )}
            </Stack>
          </Paper>
        );
        return href ? <Link key={g.key} to={href} className="link-reset" aria-label={g.label}>{card}</Link> : <Box key={g.key}>{card}</Box>;
      })}
    </SimpleGrid>
  );
}

export function toolNames(ids: string[]): string {
  return ids.map((i) => toolById.get(i)?.name ?? i).join(', ');
}
