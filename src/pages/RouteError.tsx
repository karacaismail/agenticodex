import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button, Center, Code, Stack, Text, Title } from '@mantine/core';

export function RouteError() {
  const err = useRouteError();
  const msg = isRouteErrorResponse(err) ? `${err.status} ${err.statusText}` : err instanceof Error ? err.message : String(err);
  return (
    <Center mih="70vh" p="lg">
      <Stack align="center" maw={560}>
        <Title order={2}>Bu sayfa açılamadı</Title>
        <Text c="dimmed" ta="center">Beklenmeyen bir hata oluştu. Diğer sayfalar çalışmaya devam ediyor.</Text>
        <Code block w="100%">{msg}</Code>
        <Button component={Link} to="/">Genel bakışa dön</Button>
      </Stack>
    </Center>
  );
}
