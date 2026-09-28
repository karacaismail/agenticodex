import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  ActionIcon, Alert, Badge, Box, Code, CopyButton, Group, Modal, ScrollArea, Stack, Text, Tooltip, useComputedColorScheme,
} from '@mantine/core';
import {
  IconAlertTriangle, IconArrowsMaximize, IconCheck, IconCode, IconCopy, IconDownload, IconFileCode, IconFocusCentered, IconZoomIn, IconZoomOut,
} from '@tabler/icons-react';
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { MERMAID_RUNTIME } from '@/lib/mermaid/builder';
import { AtlasLoader } from './AtlasLoader';

type MermaidApi = {
  initialize: (cfg: Record<string, unknown>) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
};

let mermaidP: Promise<MermaidApi> | null = null;
let lastScheme: string | null = null;
let queue: Promise<unknown> = Promise.resolve();

function loadMermaid(): Promise<MermaidApi> {
  mermaidP ??= import('mermaid').then((m) => (m.default ?? m) as unknown as MermaidApi);
  return mermaidP;
}

function configFor(scheme: 'light' | 'dark') {
  const dark = scheme === 'dark';
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    // SVG labels avoid WebKit foreignObject measurement failures on narrow touch profiles.
    htmlLabels: false,
    flowchart: { curve: 'basis', padding: 12, nodeSpacing: 36, rankSpacing: 44 },
    sequence: { mirrorActors: false, showSequenceNumbers: true, actorMargin: 40 },
    gantt: { barHeight: 22, fontSize: 12 },
    themeVariables: dark
      ? {
          darkMode: true, background: '#10111c', primaryColor: '#2a2350', primaryTextColor: '#eceaff', primaryBorderColor: '#7050fd',
          secondaryColor: '#16303a', tertiaryColor: '#1b1c2b', lineColor: '#8b86b8', textColor: '#dcdaf5', mainBkg: '#1c1b33',
          nodeBorder: '#6a5acd', clusterBkg: '#151628', clusterBorder: '#3b3a5c', titleColor: '#eceaff', edgeLabelBackground: '#1b1c2b',
          actorBkg: '#1f1d3a', actorBorder: '#7050fd', actorTextColor: '#eceaff', signalColor: '#b8b3e6', signalTextColor: '#eceaff',
          noteBkgColor: '#2b2640', noteTextColor: '#eceaff', noteBorderColor: '#7050fd', labelBoxBkgColor: '#1f1d3a',
          stateBkg: '#1f1d3a', stateLabelColor: '#eceaff', altBackground: '#16172a',
          sectionBkgColor: '#1f1d3a', altSectionBkgColor: '#16172a', gridColor: '#34335a', taskBkgColor: '#5536e3', taskTextColor: '#ffffff',
          activeTaskBkgColor: '#12b886', activeTaskBorderColor: '#0ca678', critBkgColor: '#f03e3e', doneTaskBkgColor: '#495057', todayLineColor: '#fcc419',
        }
      : {
          darkMode: false, background: '#ffffff', primaryColor: '#efeaff', primaryTextColor: '#1a1b2e', primaryBorderColor: '#7050fd',
          secondaryColor: '#e6fcf5', tertiaryColor: '#f8f9fa', lineColor: '#5c5a7a', textColor: '#1a1b2e', mainBkg: '#f3f0ff',
          nodeBorder: '#7050fd', clusterBkg: '#f8f7ff', clusterBorder: '#d0c9ff', edgeLabelBackground: '#ffffff',
          actorBkg: '#f3f0ff', actorBorder: '#7050fd', noteBkgColor: '#fff9db', noteBorderColor: '#fab005',
          taskBkgColor: '#7050fd', taskTextColor: '#ffffff', activeTaskBkgColor: '#12b886', critBkgColor: '#f03e3e', doneTaskBkgColor: '#adb5bd',
        },
  };
}

/** Mermaid global durum taşıdığı için çizimler sıraya alınır. */
function renderQueued(code: string, id: string, scheme: 'light' | 'dark'): Promise<string> {
  const job = queue.then(async () => {
    const m = await loadMermaid();
    if (lastScheme !== scheme) {
      m.initialize(configFor(scheme));
      lastScheme = scheme;
    }
    const { svg } = await m.render(id, code);
    return svg;
  });
  queue = job.catch(() => undefined);
  return job;
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface Props {
  code: string;
  title?: string;
  fileName?: string;
  minHeight?: number;
  compact?: boolean;
}

let counter = 0;

export function MermaidDiagram({ code, title, fileName = 'akis', minHeight = 320, compact = false }: Props) {
  const scheme = useComputedColorScheme('dark');
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [full, setFull] = useState(false);
  const zoomRef = useRef<ReactZoomPanPinchRef | null>(null);
  const fullRef = useRef<ReactZoomPanPinchRef | null>(null);

  const [canvasH, setCanvasH] = useState<number>(Math.max(minHeight, 280));

  /**
   * Sığdırma: satır içinde genişliğe sığdırır, yüksekliği diyagrama göre (ekranın %80'ine kadar) uzatır,
   * okunabilirlik için ölçeği 0,5'in altına düşürmez; tam ekranda tamamını sığdırır.
   */
  const fit = useCallback((ref: React.RefObject<ReactZoomPanPinchRef | null>, mode: 'width' | 'contain' = 'width') => {
    const api = ref.current;
    const wrapper = api?.instance.wrapperComponent;
    const content = api?.instance.contentComponent;
    if (!api || !wrapper || !content) return;
    // Mermaid SVG'yi width=100% ile üretir; doğal boyutu viewBox'tan geri yükle.
    const svgEl = content.querySelector('svg');
    const vb = svgEl?.viewBox?.baseVal;
    if (svgEl && vb && vb.width && vb.height) {
      svgEl.setAttribute('width', String(Math.ceil(vb.width)));
      svgEl.setAttribute('height', String(Math.ceil(vb.height)));
      svgEl.style.maxWidth = 'none';
    }
    const W = wrapper.clientWidth;
    const cw = content.offsetWidth;
    const ch = content.offsetHeight;
    if (!W || !cw || !ch) return;
    if (mode === 'contain') {
      const H = wrapper.clientHeight;
      const scale = Math.min(1.25, (W - 16) / cw, (H - 16) / ch);
      api.setTransform((W - cw * scale) / 2, Math.max(8, (H - ch * scale) / 2), scale, 0);
      return;
    }
    const minH = Math.max(minHeight, 280);
    const maxH = Math.max(minH, Math.round(window.innerHeight * 0.8));
    let scale = Math.min(1, (W - 16) / cw);
    if (ch * scale + 24 > maxH) scale = Math.max(0.5, Math.min(scale, (maxH - 24) / ch));
    const targetH = Math.min(maxH, Math.max(minH, Math.round(ch * scale + 24)));
    setCanvasH(targetH);
    api.setTransform((W - cw * scale) / 2, Math.max(12, (targetH - ch * scale) / 2), scale, 0);
  }, [minHeight]);

  useEffect(() => {
    if (!svg) return;
    const id = requestAnimationFrame(() => fit(zoomRef));
    return () => cancelAnimationFrame(id);
  }, [svg, fit]);

  useEffect(() => {
    let alive = true;
    setSvg(null);
    setError(null);
    renderQueued(code, `mmd-${rid}-${++counter}`, scheme)
      .then((s) => alive && setSvg(s))
      .catch((e: unknown) => alive && setError(String((e as Error)?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [code, scheme, rid]);

  const toolbar = (
    <Group gap="xs" wrap="wrap" className="diagram-toolbar">
      <Badge variant="dot" color="teal" size="sm" title="Uygulamanın kullandığı sabit Mermaid sürümü">
        Mermaid {MERMAID_RUNTIME}
      </Badge>
      {!compact && (
        <>
          <Tooltip label="Yakınlaştır"><ActionIcon variant="subtle" aria-label="Yakınlaştır" onClick={() => zoomRef.current?.zoomIn()}><IconZoomIn size={16} /></ActionIcon></Tooltip>
          <Tooltip label="Uzaklaştır"><ActionIcon variant="subtle" aria-label="Uzaklaştır" onClick={() => zoomRef.current?.zoomOut()}><IconZoomOut size={16} /></ActionIcon></Tooltip>
          <Tooltip label="Ortala"><ActionIcon variant="subtle" aria-label="Ortala" onClick={() => fit(zoomRef)}><IconFocusCentered size={16} /></ActionIcon></Tooltip>
          <Tooltip label="Tam ekran"><ActionIcon variant="subtle" aria-label="Tam ekran" onClick={() => setFull(true)} disabled={!svg}><IconArrowsMaximize size={16} /></ActionIcon></Tooltip>
        </>
      )}
      <Tooltip label={showCode ? 'Kodu gizle' : 'Kodu göster'}>
        <ActionIcon variant={showCode ? 'light' : 'subtle'} aria-label={showCode ? 'Kodu gizle' : 'Kodu göster'} onClick={() => setShowCode((v) => !v)}>
          <IconCode size={16} />
        </ActionIcon>
      </Tooltip>
      <CopyButton value={code} timeout={1600}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Kopyalandı' : 'Mermaid kodunu kopyala'}>
            <ActionIcon variant="subtle" color={copied ? 'teal' : undefined} aria-label="Mermaid kodunu kopyala" onClick={copy}>
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
      <Tooltip label=".mmd indir"><ActionIcon variant="subtle" aria-label="Mermaid dosyası indir" onClick={() => download(`${fileName}.mmd`, code, 'text/plain;charset=utf-8')}><IconFileCode size={16} /></ActionIcon></Tooltip>
      <Tooltip label="SVG indir"><ActionIcon variant="subtle" aria-label="SVG indir" disabled={!svg} onClick={() => svg && download(`${fileName}.svg`, svg, 'image/svg+xml')}><IconDownload size={16} /></ActionIcon></Tooltip>
    </Group>
  );

  const canvas = (h: number | string, ref: React.RefObject<ReactZoomPanPinchRef | null>, mode: 'width' | 'contain' = 'width') =>
    svg ? (
      <TransformWrapper ref={ref} minScale={0.2} maxScale={4} limitToBounds={false} wheel={{ step: 0.08, activationKeys: ['Control', 'Meta'] }} doubleClick={{ disabled: true }} onInit={() => requestAnimationFrame(() => fit(ref, mode))}>
        <TransformComponent wrapperStyle={{ width: '100%', height: h }} contentStyle={{ width: 'max-content' }}>
          <Box className="mermaid-canvas" p="md" onDoubleClick={() => fit(ref, mode)} dangerouslySetInnerHTML={{ __html: svg }} />
        </TransformComponent>
      </TransformWrapper>
    ) : null;

  return (
    <Stack gap="xs">
      <Group justify="space-between" wrap="wrap">
        {title ? <Text fw={600} size="sm" truncate>{title}</Text> : <span />}
        {toolbar}
      </Group>
      <Box className="mermaid-host" style={{ minHeight: svg ? canvasH : minHeight }}>
        {!svg && !error && (
          <Box p="xl"><AtlasLoader label="Diyagram çiziliyor" /></Box>
        )}
        {error && (
          <Alert m="md" color="red" variant="light" icon={<IconAlertTriangle size={18} />} title="Diyagram çizilemedi">
            <Text size="sm">Uygulama çalışmaya devam ediyor; aşağıda kaynak kod ve adımlar kullanılabilir.</Text>
            <Code block mt="xs">{error}</Code>
            <Code block mt="xs">{code}</Code>
          </Alert>
        )}
        {canvas(canvasH, zoomRef)}
        {svg && !compact && (
          <Text size="xs" c="dimmed" pos="absolute" bottom={8} left={12} style={{ pointerEvents: 'none' }}>
            Sürükle: kaydır · Ctrl/⌘ + tekerlek: yakınlaştır · çift tık: sığdır
          </Text>
        )}
      </Box>
      {showCode && (
        <ScrollArea.Autosize mah={360} type="auto">
          <Code block>{code}</Code>
        </ScrollArea.Autosize>
      )}
      <Modal opened={full} onClose={() => setFull(false)} fullScreen title={title ?? 'Diyagram'} transitionProps={{ transition: 'fade', duration: 160 }}>
        <Box className="mermaid-host" h="calc(100vh - 120px)">{canvas('calc(100vh - 120px)', fullRef, 'contain')}</Box>
      </Modal>
    </Stack>
  );
}
