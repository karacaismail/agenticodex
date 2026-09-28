import { Link, useParams } from 'react-router-dom';
import { Alert, Anchor, Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconExternalLink, IconInfoCircle } from '@tabler/icons-react';
import { loadClaims, loadSources, meta, toolById } from '@/data';
import { reportLabel } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { PageHeader, Section, StatusBadge, ToolChip } from '@/components/ui/atoms';
import { AtlasLoader } from '@/components/ui/AtlasLoader';
import NotFoundPage from './NotFoundPage';

export default function SourceDetailPage() {
  const { id = '' } = useParams();
  const { data } = useLoad(loadSources);
  const { data: claims } = useLoad(loadClaims);
  if (!data) return <AtlasLoader />;
  const s = data.find((x) => x.id === id);
  if (!s) return <NotFoundPage />;
  const cl = (claims ?? []).filter((c) => s.claims.includes(c.slug));
  return (
    <>
      <PageHeader eyebrow="Kaynak" title={s.domain} gradient={false} description={s.url} crumbs={[{ label: 'Kaynaklar', to: '/kaynaklar' }, { label: s.domain }]}
        actions={!s.placeholder ? <Button component="a" href={s.url} target="_blank" rel="noreferrer" variant="light" leftSection={<IconExternalLink size={16} />}>Kaynağı aç</Button> : undefined}>
        <Group gap={6}>{s.reports.map((r) => <Badge key={r} variant="light">{reportLabel(r, meta.reportLabels)}</Badge>)}</Group>
      </PageHeader>
      {s.placeholder && <Alert color="orange" variant="light" mb="md" icon={<IconInfoCircle size={18} />}>Bu adres örnek veya yer tutucu görünüyor (ör. example.com, localhost); gerçek bir kanıt kaynağı değildir.</Alert>}
      <Stack gap="lg">
        {s.tools.length > 0 && <Section title="İlgili araçlar"><Group gap={6}>{s.tools.map((t) => <ToolChip key={t} id={t} name={toolById.get(t)?.name ?? t} />)}</Group></Section>}
        <Section title={`Bu kaynağı gösteren iddialar (${s.claims.length})`}>
          {!claims && <AtlasLoader />}
          <Stack gap="xs">
            {cl.map((c) => (
              <Paper key={c.slug} p="sm" withBorder radius="md" component={Link} to={`/kanit/${c.slug}`} className="link-reset hover-lift">
                <Group justify="space-between" wrap="nowrap" mb={2}><Text size="xs" c="dimmed" className="mono">{c.id}</Text><StatusBadge status={c.status} size="xs" /></Group>
                <Text size="sm" lineClamp={2}>{c.statement}</Text>
              </Paper>
            ))}
          </Stack>
        </Section>
        <Anchor component={Link} to="/kaynaklar" size="sm">← Bütün kaynaklar</Anchor>
      </Stack>
    </>
  );
}
