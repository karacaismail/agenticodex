import { Link } from 'react-router-dom';
import { Anchor, Badge, Blockquote, Grid, Group, Paper, SimpleGrid, Stack, Table, Text, Timeline, Title } from '@mantine/core';
import { IconAlertTriangle, IconDoor } from '@tabler/icons-react';
import { meta, topicById } from '@/data';
import { PageHeader, Section } from '@/components/ui/atoms';

export default function SynthesisPage() {
  const s = meta.synthesis;
  return (
    <>
      <PageHeader
        eyebrow="Sentez raporu"
        title="Kararlar, kapılar ve riskler"
        description="Sentez raporunun karar defteri, aşamalı ürünleştirme kapıları, açık riskleri ve 12 konu kümesi. Her kapının ve riskin iş akışı atlasta vardır."
        crumbs={[{ label: 'Genel bakış', to: '/' }, { label: 'Sentez' }]}
      />
      <Stack gap="lg">
        <Blockquote color="aurora" p="lg">
          <Text fw={600}>Ana karar</Text>
          <Text>Sabit ve öğrenilebilir bir uygulama kabuğu kur. AI’a bu kabuğun içindeki çalışma alanında izinli bileşenleri seçme ve birleştirme yetkisi ver. Gerçek veriyi, kullanıcı yetkisini, işlem durumunu ve kaydı uygulama yönetsin. Animasyon bu gerçek durumu anlaşılır kılsın.</Text>
          <Text size="xs" c="dimmed" mt="xs">Bu yaklaşım bir öneridir; hedef üründe yapılmış bir kullanıcı deneyinin sonucu değildir.</Text>
        </Blockquote>
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Section title="Geçiş kapıları" description="Tek senaryoyla başlayıp kanıtla büyüt.">
              <Timeline active={s.gates.length} bulletSize={26}>
                {s.gates.map((g) => (
                  <Timeline.Item key={g.id} bullet={<Text size="xs" fw={800}>{g.id}</Text>} title={<Anchor component={Link} to={`/akislar/kapi-${g.id.toLowerCase()}`} fw={700}>{g.name}</Anchor>}>
                    <Text size="sm">{g.output}</Text>
                    <Text size="xs" c="dimmed">Geçiş: {g.exit}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Section>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Section title="Karar defteri" description="Bugün neyi kabul ediyoruz, ne açık kalıyor?">
              <Paper p={0} style={{ overflow: 'auto' }} bg="transparent">
                <Table verticalSpacing="sm" miw={560}>
                  <Table.Thead><Table.Tr><Table.Th>Konu</Table.Th><Table.Th>Karar</Table.Th><Table.Th>Güven / sınır</Table.Th></Table.Tr></Table.Thead>
                  <Table.Tbody>
                    {s.decisions.map((d) => (
                      <Table.Tr key={d.topic}><Table.Td><Text size="sm" fw={600}>{d.topic}</Text></Table.Td><Table.Td><Text size="sm">{d.decision}</Text></Table.Td><Table.Td><Text size="xs" c="dimmed">{d.limit}</Text></Table.Td></Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Section>
          </Grid.Col>
        </Grid>
        <Section title="Açık riskler ve bilinmeyenler">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {s.risks.map((r, i) => (
              <Paper key={i} p="md" withBorder radius="md">
                <Group gap="xs" mb={4}><IconAlertTriangle size={16} color="var(--mantine-color-orange-5)" /><Text fw={700} size="sm">{i + 1}. {r.title}</Text></Group>
                <Text size="sm" c="dimmed">{r.text}</Text>
              </Paper>
            ))}
          </SimpleGrid>
          <Group mt="md" gap={6}><IconDoor size={16} /><Text size="sm">Tehdit tarafı için: <Anchor component={Link} to="/akislar/aile/tehdit">tehdit modeli akışları</Anchor> · <Anchor component={Link} to="/akislar/aile/ariza">arıza ve kurtarma akışları</Anchor></Text></Group>
        </Section>
        <Section title="12 konu kümesi" description="Sentezin bölümleri ve bağlı araştırma dosyaları.">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {s.sections.map((x) => (
              <Paper key={x.n} p="md" className="glass">
                <Title order={5} mb={6}>{x.n}. {x.title}</Title>
                <Group gap={4}>{x.topics.map((t) => <Badge key={t} component={Link} to={`/konular/${t}`} variant="light" color="grape" style={{ cursor: 'pointer', textTransform: 'none' }}>{t} · {topicById.get(t)?.short}</Badge>)}</Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Section>
      </Stack>
    </>
  );
}
