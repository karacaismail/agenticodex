import type { Workflow } from '@/data/types';
import processes from '../../../quality/kaizen/processes.json';
import { Flow } from '../mermaid/builder';
import { Recorder, styled, wf, type GenInput } from './common';

export function kaizenFamily(input: GenInput): Workflow[] {
  return processes.map((p) => {
    const f = new Flow('TD');
    const r = new Recorder();
    const start = f.node(p.input, 'stadium', 'start');
    const observe = f.node('Kaynak kimliğine bağlı araç kanıtını topla', 'rect', 'data');
    const gate = f.node(p.question, 'decision', 'gate');
    const success = f.node(p.output, 'rect', 'end');
    const stop = f.node('Eksik veya başarısız: triage; başarı ilan etme', 'rect', 'warn');
    const record = f.node('Sonuç, maliyet ve kalan sınırları kaydet', 'stadium', 'end');
    f.edge(start, observe).edge(observe, gate).edge(gate, success, 'Evet').edge(gate, stop, 'Hayır').edge(success, record).edge(stop, record);
    [p.input, 'Gözlenen araç kanıtını topla', p.question, p.output, 'Eksik veya başarısız sonucu açık kaydet'].forEach(s => r.add(s));
    styled(f);
    return wf({ id: `kaizen-${p.id}`, title: `Kaizen · ${p.title}`, family: 'kaizen', diagram: 'flowchart',
      summary: `${p.kind}: ${p.input}. Çıktı: ${p.output}. ${p.status}.`, steps: r.steps, mermaid: f.toString(),
      tools: p.tools, tags: ['kaizen', p.kind], golden: ['G12'], topics: ['R27','R28'],
      conditions: [p.status, p.question, 'LLM yorumu, kontrolün çalıştığının veya bağımsız kabulün kanıtı değildir.'],
    }, input);
  });
}
