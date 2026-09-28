export declare const MERMAID_TARGETS: Record<'v10' | 'v11' | 'v12', { pkg: string; label: string }>;
export declare function loadParsers(versions?: string[]): Promise<Record<string, (code: string) => Promise<string | null>>>;
