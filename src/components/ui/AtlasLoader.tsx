import { Center, Stack, Text, useComputedColorScheme } from '@mantine/core';
import LatticeLoader from '@/components/reactbits/LatticeLoader/LatticeLoader';

/** React Bits LatticeLoader tabanlı, temaya uyumlu yükleme göstergesi. */
export function AtlasLoader({ label = 'Yükleniyor', hint }: { label?: string; hint?: string }) {
  const dark = useComputedColorScheme('dark') === 'dark';
  return (
    <Center py="lg" role="status" aria-live="polite">
      <Stack gap={6} align="center">
        <LatticeLoader label={label} pattern="ripple" grid={3} color={dark ? '#a088fe' : '#6644fe'} glow={dark} showTimer={false} />
        {hint && <Text size="xs" c="dimmed">{hint}</Text>}
      </Stack>
    </Center>
  );
}
