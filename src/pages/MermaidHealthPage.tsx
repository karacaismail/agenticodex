import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Anchor, Badge, Button, Group, List, Paper, Progress, SimpleGrid, Stack, Table, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCheck, IconShieldCheck } from '@tabler/icons-react';
import report from '@/data/generated/mermaid-report.json';
import { loadWorkflows } from '@/data';
import { DIAGRAM_LABEL } from '@/lib/format';
import { MERMAID_RUNTIME } from '@/lib/mermaid/builder';
import { PageHeader, Section } from '@/components/ui/atoms';
import StatusMark from '@/components/reactbits/StatusMark/StatusMark';

type Report = { checkedAt: string; durationMs: number; total: number; byType: Record<string, number>; versions: Record<string, { label: string; exact: string; ok: number; fail: number }>; failures: { id: string; version: string; error: string }[] };
const R = report as Report;

export default function MermaidHealthPage() {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'failed'>('idle');
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [fails, setFails] = useState<{ id: string; error: string }[]>([]);
  const [ms, setMs] = useState(0);

  async function runLive() {
    setState('running');
    setFails([]);
    setDone(0);
    const t0 = performance.now();
    const [{ workflows }, m] = await Promise.all([loadWorkflows(), import('mermaid')]);
    const mermaid = m.default;
    setTotal(workflows.length);
    const bad: { id: string; error: string }[] = [];
    for (let i = 0; i < workflows.length; i++) {
      try {
        await mermaid.parse(workflows[i].mermaid);
      } catch (e) {
        bad.push({ id: workflows[i].id, error: String((e as Error)?.message ?? e).split('\n')[0] });
      }
      if (i % 12 === 0 || i === workflows.length - 1) {
        setDone(i + 1);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    setFails(bad);
    setMs(Math.round(performance.now() - t0));
    setState(bad.length ? 'failed' : 'done');
  }

  return (
    <>
      <PageHeader
        eyebrow="Kalite"
        title="Mermaid sağlığı"
        description="Mermaid kodunda sık görülen “sürüm hatası” burada iki katmanda önlenir: sürüm-güvenli oluşturucu yalnız 10.9 → 12.0 arasında değişmeyen sözdizimini üretir; derleme kapısı her diyagramı üç ana sürümde ayrıştırır."
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Mermaid sağlığı' }]}
      />
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {Object.entries(R.versions).map(([k, v]) => (
            <Paper key={k} p="md" className="glass">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Mermaid {v.label}</Text>
                  <Title order={3}>{v.exact}</Title>
                </Stack>
                <StatusMark status={v.fail ? 'failed' : 'done'} size={40} />
              </Group>
              <Text size="sm" mt="xs">{v.ok} / {R.total} geçerli · {v.fail} hata</Text>
              <Progress value={(v.ok / R.total) * 100} color={v.fail ? 'red' : 'teal'} mt={6} radius="xl" aria-label={`Mermaid ${v.exact} geçerlilik oranı`} />
            </Paper>
          ))}
        </SimpleGrid>
        <Section title="Derleme doğrulaması" description={`Son kontrol ${new Date(R.checkedAt).toLocaleString('tr-TR')} · ${R.durationMs} ms`}>
          <Group gap={6}>{Object.entries(R.byType).map(([k, n]) => <Badge key={k} variant="light" size="lg">{DIAGRAM_LABEL[k as keyof typeof DIAGRAM_LABEL] ?? k}: {n}</Badge>)}</Group>
          {R.failures.length === 0 ? (
            <Alert mt="md" color="teal" variant="light" icon={<IconShieldCheck size={18} />} title="Sıfır ayrıştırma hatası">Bütün {R.total} iş akışı üç ana sürümde geçerli. Hata olsaydı `npm run build` duracaktı.</Alert>
          ) : (
            <Table mt="md"><Table.Tbody>{R.failures.map((f, i) => <Table.Tr key={i}><Table.Td>{f.id}</Table.Td><Table.Td>{f.version}</Table.Td><Table.Td>{f.error}</Table.Td></Table.Tr>)}</Table.Tbody></Table>
          )}
        </Section>
        <Section title="Tarayıcıda canlı doğrulama" description={`Uygulamanın kullandığı sabit sürüm (${MERMAID_RUNTIME}) ile bütün akışları şimdi bu tarayıcıda yeniden ayrıştır.`}
          actions={<Button onClick={runLive} loading={state === 'running'} variant="gradient">Şimdi doğrula</Button>}>
          {state !== 'idle' && (
            <Stack gap="xs">
              <Group gap="sm">
                <StatusMark status={state === 'running' ? 'running' : state === 'done' ? 'done' : 'failed'} progress={total ? done / total : 0} size={28} />
                <Text size="sm">{done} / {total || '…'} diyagram {state === 'running' ? 'ayrıştırılıyor' : `ayrıştırıldı · ${ms} ms`}</Text>
              </Group>
              <Progress value={total ? (done / total) * 100 : 0} animated={state === 'running'} radius="xl" aria-label="Canlı doğrulama ilerlemesi" />
              {state === 'done' && <Alert color="teal" variant="light" icon={<IconCheck size={18} />}>Canlı sonuç: {total} diyagramın tamamı geçerli.</Alert>}
              {fails.map((f) => <Text key={f.id} size="sm" c="red"><Anchor component={Link} to={`/akislar/${f.id}`}>{f.id}</Anchor>: {f.error}</Text>)}
            </Stack>
          )}
        </Section>
        <Section title="Sürüm hatası nasıl önlendi?">
          <List spacing="sm" icon={<ThemeIcon size={20} radius="xl" color="teal" variant="light"><IconCheck size={12} /></ThemeIcon>}>
            <List.Item><b>Tam sürüm sabitleme:</b> <code>mermaid@{MERMAID_RUNTIME}</code> (şapka ^ yok). 12.0.0 yeni bir ana sürüm; uygulama onu çalıştırmaz ama bütün diyagramlar onunla da doğrulanır.</List.Item>
            <List.Item><b>Güvenli alt küme:</b> yalnız <code>flowchart</code>, <code>sequenceDiagram</code>, <code>stateDiagram-v2</code> ve <code>gantt</code>; yeni <code>@&#123;shape&#125;</code> sözdizimi, frontmatter yapılandırması, <code>direction</code> ve markdown dizgeleri kullanılmaz.</List.Item>
            <List.Item><b>Kaçışlama:</b> düğüm etiketleri her zaman tırnak içinde; <code>"</code>, <code>#</code>, <code>;</code>, <code>&amp;</code> varlık koduna çevrilir; <code>&lt; &gt;</code> ve ters tırnak nötrlenir; kimlikler üretilir (kullanıcı metninden gelmez); ayrılmış sözcükler (<code>end</code> vb.) kimlik olamaz.</List.Item>
            <List.Item><b>Üç sürümlü derleme kapısı:</b> <code>npm run validate:mermaid</code> her diyagramı 10.9, 11.17 ve 12.0 ile ayrıştırır; tek hata derlemeyi durdurur.</List.Item>
            <List.Item><b>TDD:</b> tuzaklı etiket kümesi, bozuk kod negatif kontrolü, 864 üretici birleşimi ve kullanıcı kuralından üretilen diyagramlar testlerde üç sürümle sınanır.</List.Item>
            <List.Item><b>Güvenli yedek:</b> çizim yine de başarısız olursa sayfa çökmez; hata ve kaynak kod gösterilir, adım listesi kullanılabilir kalır.</List.Item>
          </List>
        </Section>
      </Stack>
    </>
  );
}
