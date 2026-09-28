import { Link, useParams } from 'react-router-dom';
import { Alert, Anchor, Badge, Button, Grid, Group, Paper, Stack, Text, Timeline } from '@mantine/core';
import { IconAlertTriangle, IconExternalLink } from '@tabler/icons-react';
import { loadClaims, loadWorkflows, meta, toolById, topicById } from '@/data';
import { STATUS_COLOR, STATUS_LABEL, hostOf, pathOf, reportLabel } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section, StatusBadge, ToolChip } from '@/components/ui/atoms';
import { MermaidDiagram } from '@/components/ui/MermaidDiagram';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import NotFoundPage from './NotFoundPage';

export default function ClaimDetailPage() {
  const { slug = '' } = useParams();
  const { data } = useLoad(loadClaims);
  const { data: wf } = useLoad(loadWorkflows);
  if (!data) return <AtlasLoader label="İddia yükleniyor" />;
  const i = data.findIndex((c) => c.slug === slug);
  const c = data[i];
  if (!c) return <NotFoundPage />;
  const flow = wf?.workflows.find((w) => w.id === `iddia-${c.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
  const prev = data[i - 1];
  const next = data[i + 1];
  return (
    <>
      <PageHeader
        eyebrow={`İddia · ${reportLabel(c.stage, meta.reportLabels)}`}
        title={c.id}
        gradient={false}
        description={c.statement}
        crumbs={[{ label: 'İddialar', to: '/kanit' }, { label: c.id }]}
        actions={
          <>
            {prev && <Button variant="default" component={Link} to={`/kanit/${prev.slug}`}>← Önceki</Button>}
            {next && <Button variant="default" component={Link} to={`/kanit/${next.slug}`}>Sonraki →</Button>}
          </>
        }
      >
        <Group gap={6}>
          {c.statuses.map((s) => <StatusBadge key={s} status={s} />)}
          {c.contested && <Badge color="orange" variant="outline">Aşamalar arasında görüş ayrılığı</Badge>}
          {c.topics.map((t) => <Badge key={t} component={Link} to={`/konular/${t}`} variant="light" color="grape" style={{ cursor: 'pointer', textTransform: 'none' }}>{t} · {topicById.get(t)?.short}</Badge>)}
        </Group>
      </PageHeader>
      <Alert variant="light" color="gray" mb="lg" icon={<IconAlertTriangle size={18} />}>Sicil model değerlendirmelerini korur; kesinleşmiş gerçek değildir. Aynı kaynağın birden çok raporda tekrarı bağımsız doğrulama sayılmaz.</Alert>
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Section title={`Değerlendirme geçmişi (${c.assessments.length})`}>
            <Timeline active={c.assessments.length} bulletSize={22}>
              {c.assessments.map((a, k) => (
                <Timeline.Item key={k} color={STATUS_COLOR[a.status]} title={<Group gap={6}><Text fw={600} size="sm">{reportLabel(a.stage, meta.reportLabels)}</Text><StatusBadge status={a.status} size="xs" /></Group>}>
                  {a.reason && <Text size="sm" mt={4}>{a.reason}</Text>}
                  {a.counter && <Paper p="xs" mt={6} withBorder radius="md"><Text size="xs" fw={600} c="orange">Karşı kanıt</Text><Text size="xs">{a.counter}</Text></Paper>}
                  {a.limits && <Text size="xs" c="dimmed" mt={6}>Sınır: {a.limits}</Text>}
                  {a.counterSources.length > 0 && <Stack gap={2} mt={4}>{a.counterSources.map((u) => <Anchor key={u} href={u} target="_blank" rel="noreferrer" size="xs">{hostOf(u)}{pathOf(u, 50)}</Anchor>)}</Stack>}
                </Timeline.Item>
              ))}
            </Timeline>
          </Section>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Stack gap="lg">
            {c.tools.length > 0 && <Section title="İlgili araçlar"><Group gap={6}>{c.tools.map((t) => <ToolChip key={t} id={t} name={toolById.get(t)?.name ?? t} />)}</Group></Section>}
            <Section title={`Kaynaklar (${c.sources.length})`} description="URL kaydı; içerik bağımsız doğrulanmadı.">
              <Stack gap={4}>
                {c.sources.map((u) => (
                  <Group key={u} gap={6} wrap="nowrap">
                    <IconExternalLink size={14} opacity={0.6} />
                    <Anchor href={u} target="_blank" rel="noreferrer" size="sm" truncate style={{ minWidth: 0 }}>{hostOf(u)}{pathOf(u, 50)}</Anchor>
                  </Group>
                ))}
              </Stack>
            </Section>
            <Section title="Son durum"><Badge size="lg" color={STATUS_COLOR[c.status]}>{STATUS_LABEL[c.status]}</Badge></Section>
          </Stack>
        </Grid.Col>
      </Grid>
      {flow && (
        <Section title="Doğrulama akışı" description={flow.summary}>
          <MermaidDiagram code={flow.mermaid} fileName={flow.id} minHeight={380} />
        </Section>
      )}
    </>
  );
}
