import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderUI } from '@/test/render';

const render = vi.fn();
const initialize = vi.fn();
vi.mock('mermaid', () => ({ default: { initialize: (...a: unknown[]) => initialize(...a), render: (...a: unknown[]) => render(...a) } }));

import { MermaidDiagram } from './MermaidDiagram';

describe('MermaidDiagram', () => {
  beforeEach(() => {
    render.mockReset();
    initialize.mockReset();
  });

  it('başarılı çizimde SVG’yi yerleştirir ve sürüm rozetini gösterir', async () => {
    render.mockResolvedValue({ svg: '<svg data-testid="diagram-svg"><g></g></svg>' });
    renderUI(<MermaidDiagram code={'flowchart TD\n  n1["A"] --> n2["B"]'} title="Deneme" />);
    await waitFor(() => expect(screen.getByTestId('diagram-svg')).toBeInTheDocument());
    expect(screen.getByText(/Mermaid 11\.17\.2/)).toBeInTheDocument();
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ startOnLoad: false, securityLevel: 'strict' }));
  });

  it('çizim hatasında güvenli yedek: hata mesajı ve kaynak kod görünür, uygulama çökmez', async () => {
    render.mockRejectedValue(new Error('Parse error on line 2'));
    renderUI(<MermaidDiagram code={'flowchart TD\n  bozuk'} />);
    await waitFor(() => expect(screen.getByText(/çizilemedi/i)).toBeInTheDocument());
    expect(screen.getByText(/Parse error on line 2/)).toBeInTheDocument();
    expect(screen.getByText(/bozuk/)).toBeInTheDocument();
  });

  it('kod göster düğmesi Mermaid kaynağını açar', async () => {
    render.mockResolvedValue({ svg: '<svg data-testid="diagram-svg"></svg>' });
    renderUI(<MermaidDiagram code={'flowchart LR\n  n1["Kaynak kod burada"]'} />);
    await waitFor(() => expect(screen.getByTestId('diagram-svg')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /kodu göster/i }));
    expect(screen.getByText(/Kaynak kod burada/)).toBeInTheDocument();
  });
});
