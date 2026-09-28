import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, Group, MultiSelect, Pagination, Paper, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { loadClaims, meta, tools, topics } from '@/data';
import type { ClaimStatus } from '@/data/types';
import { STATUS_LABEL, STATUS_ORDER, reportLabel } from '@/lib/format';
import { useLoad } from '@/hooks/useLoad';
import { EvidenceBar, PageHeader, StatusBadge, ScrollSegmented } from '@/components/ui/atoms';
import { AtlasLoader } from '@/components/ui/AtlasLoader';

const PER = 30;

export default function EvidencePage() {
  const { data } = useLoad(loadClaims);
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [dq] = useDebouncedValue(q, 200);
  const status = (sp.get('durum') ?? 'hepsi') as 'hepsi' | ClaimStatus;
  const page = Number(sp.get('s') ?? 1);
  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    if (k !== 's') n.delete('s');
    setSp(n, { replace: true });
  };
  const stages = (sp.get('asama') ?? '').split(',').filter(Boolean);

  const list = useMemo(() => {
    if (!data) return [];
    const needle = dq.trim().toLocaleLowerCase('tr');
    return data.filter((c) =>
      (status === 'hepsi' || c.status === status) &&
      (!stages.length || stages.includes(c.stage)) &&
      (!sp.get('konu') || c.topics.includes(sp.get('konu')!)) &&
      (!sp.get('arac') || c.tools.includes(sp.get('arac')!)) &&
      (sp.get('ayrilik') !== '1' || c.contested) &&
      (!needle || c.statement.toLocaleLowerCase('tr').includes(needle) || c.id.toLowerCase().includes(needle)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dq, status, sp]);

  if (!data) return <AtlasLoader label="Kanıt sicili yükleniyor" />;
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const p = Math.min(page, pages);
  const counts = STATUS_ORDER.reduce<Record<string, number>>((a, s) => ((a[s] = list.filter((c) => c.status === s).length), a), {});

  return (
    <>
      <PageHeader
        eyebrow="Kanıt sicili"
        title="İddialar"
        description="Sekiz raporun 889 iddiası ve her aşamadaki değerlendirmesi. Sicil model değerlendirmelerini korur; kesinleşmiş gerçek değildir. Eksik değerlendirme bir iddiayı silmez."
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'İddialar' }]}
      />
      <Paper p="md" className="glass" mb="md">
        <Stack gap="sm">
          <Group gap="sm" wrap="wrap" align="flex-end">
            <TextInput label="Ara" placeholder="İddia metni veya kimlik" leftSection={<IconSearch size={16} />} value={q} onChange={(e) => { setQ(e.currentTarget.value); set('q', e.currentTarget.value || null); }} style={{ flex: '1 1 260px' }} />
            <Select label="Konu" size="sm" w={200} clearable searchable data={topics.map((t) => ({ value: t.id, label: `${t.id} · ${t.short}` }))} value={sp.get('konu')} onChange={(v) => set('konu', v)} comboboxProps={{ withinPortal: true }} />
            <Select label="Araç" size="sm" w={200} clearable searchable data={tools.filter((t) => t.claimCount).map((t) => ({ value: t.id, label: `${t.name} (${t.claimCount})` }))} value={sp.get('arac')} onChange={(v) => set('arac', v)} comboboxProps={{ withinPortal: true }} />
            <MultiSelect label="Özgün aşama" size="sm" w={260} clearable data={meta.reports.map((r) => ({ value: r.id, label: reportLabel(r.id, meta.reportLabels) }))} value={stages} onChange={(v) => set('asama', v.join(',') || null)} comboboxProps={{ withinPortal: true }} />
          </Group>
          <Group justify="space-between" wrap="wrap" style={{ minWidth: 0 }}>
            <ScrollSegmented value={status} onChange={(v) => set('durum', v === 'hepsi' ? null : v)} data={[{ value: 'hepsi', label: `Hepsi ${list.length}` }, ...STATUS_ORDER.map((s) => ({ value: s, label: `${STATUS_LABEL[s]} ${counts[s] ?? 0}` }))]} />
            <Switch label="Yalnız görüş ayrılıklı" checked={sp.get('ayrilik') === '1'} onChange={(e) => set('ayrilik', e.currentTarget.checked ? '1' : null)} />
          </Group>
          <EvidenceBar counts={counts} size="sm" />
        </Stack>
      </Paper>
      <Stack gap="xs">
        {list.slice((p - 1) * PER, p * PER).map((c) => (
          <Paper key={c.slug} p="sm" className="glass hover-lift link-reset" component={Link} to={`/kanit/${c.slug}`}>
            <Group justify="space-between" wrap="nowrap" mb={4}>
              <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed" className="mono" truncate>{c.id}</Text>
                {c.contested && <Badge size="xs" color="orange" variant="outline">görüş ayrılığı</Badge>}
              </Group>
              <Group gap={4} wrap="nowrap">{c.statuses.map((s) => <StatusBadge key={s} status={s} size="xs" />)}</Group>
            </Group>
            <Text size="sm" lineClamp={3}>{c.statement}</Text>
            <Group gap={4} mt={6}>
              {c.topics.map((t) => <Badge key={t} size="xs" variant="light" color="grape">{t}</Badge>)}
              {c.tools.slice(0, 5).map((t) => <Badge key={t} size="xs" variant="dot" color="gray" style={{ textTransform: 'none' }}>{tools.find((x) => x.id === t)?.name}</Badge>)}
              <Text size="xs" c="dimmed">{c.sources.length} kaynak · {c.assessments.length} değerlendirme</Text>
            </Group>
          </Paper>
        ))}
        {!list.length && <Paper p="xl" ta="center" className="glass"><Text fw={600}>Eşleşen iddia yok</Text></Paper>}
      </Stack>
      {pages > 1 && <Group justify="center" mt="lg"><Pagination getControlProps={(c) => ({ 'aria-label': ({ first: 'İlk sayfa', previous: 'Önceki sayfa', next: 'Sonraki sayfa', last: 'Son sayfa' } as const)[c] })} total={pages} value={p} onChange={(x) => { set('s', String(x)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></Group>}
    </>
  );
}
