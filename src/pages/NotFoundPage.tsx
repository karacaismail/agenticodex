import { Link } from 'react-router-dom';
import { Button, Center, Stack, Text, Title } from '@mantine/core';
import FuzzyNotFound from '@/components/reactbits/DecryptedText/DecryptedText';

export default function NotFoundPage() {
  return (
    <Center mih="60vh">
      <Stack align="center" gap="sm">
        <Title order={1} fz={64} className="grad-text"><FuzzyNotFound text="404" animateOn="view" sequential speed={60} /></Title>
        <Text c="dimmed">Aradığın sayfa atlasta yok. Arama için ⌘K kullan.</Text>
        <Button component={Link} to="/" variant="light">Genel bakış</Button>
      </Stack>
    </Center>
  );
}
