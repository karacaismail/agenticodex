import {
  ActionIcon, Badge, Box, Button, Group, MultiSelect, NumberInput, Paper, SegmentedControl, Select, Stack, Switch, Text, TextInput, Tooltip,
} from '@mantine/core';
import { IconPlus, IconSitemap, IconTrash } from '@tabler/icons-react';
import {
  FIELDS, OPS_BY_TYPE, OP_LABEL, cond, describeRule, type Condition, type FieldKey, type Group as RGroup, type Op, type Rule,
} from '@/lib/rules';
import { labelFor, optionsFor } from '@/lib/fieldOptions';

const FIELD_OPTIONS = (Object.keys(FIELDS) as FieldKey[]).map((k) => ({ value: k, label: FIELDS[k].label }));

function defaultValue(field: FieldKey, op: Op): unknown {
  const t = FIELDS[field].type;
  if (op === 'isnull' || op === 'notnull' || op === 'is' || op === 'isnot') return undefined;
  if (op === 'between') return [0, 100];
  if (t === 'number') return 50;
  if (t === 'text') return '';
  if (t === 'multi' || op === 'in' || op === 'nin') return [optionsFor(field)[0]?.value].filter(Boolean);
  return optionsFor(field)[0]?.value ?? '';
}

function freshCondition(field: FieldKey = 'license'): Condition {
  const op = OPS_BY_TYPE[FIELDS[field].type][0];
  return cond(field, op, defaultValue(field, op));
}

function ValueInput({ c, onChange }: { c: Condition; onChange: (v: unknown) => void }) {
  const t = FIELDS[c.field].type;
  if (c.op === 'isnull' || c.op === 'notnull' || c.op === 'is' || c.op === 'isnot') return <Text size="sm" c="dimmed" miw={120}>—</Text>;
  if (t === 'number') {
    if (c.op === 'between') {
      const [a, b] = (Array.isArray(c.value) ? c.value : [0, 100]) as number[];
      return (
        <Group gap={4} wrap="nowrap">
          <NumberInput aria-label="Alt sınır" w={90} size="xs" value={a} onChange={(v) => onChange([Number(v) || 0, b])} />
          <NumberInput aria-label="Üst sınır" w={90} size="xs" value={b} onChange={(v) => onChange([a, Number(v) || 0])} />
        </Group>
      );
    }
    return <NumberInput aria-label="Değer" w={110} size="xs" value={Number(c.value ?? 0)} onChange={(v) => onChange(Number(v) || 0)} />;
  }
  if (t === 'text') return <TextInput aria-label="Metin" size="xs" w={200} value={String(c.value ?? '')} onChange={(e) => onChange(e.currentTarget.value)} placeholder="ör. akış" />;
  const data = optionsFor(c.field);
  if (t === 'multi' || c.op === 'in' || c.op === 'nin') {
    return (
      <MultiSelect aria-label="Değerler" size="xs" miw={220} maw={420} data={data} value={(Array.isArray(c.value) ? c.value : []) as string[]} onChange={onChange} searchable clearable maxDropdownHeight={280} comboboxProps={{ withinPortal: true }} />
    );
  }
  return <Select aria-label="Değer" size="xs" w={240} data={data} value={String(c.value ?? '')} onChange={(v) => onChange(v ?? '')} searchable allowDeselect={false} maxDropdownHeight={280} comboboxProps={{ withinPortal: true }} />;
}

function ConditionRow({ c, onChange, onRemove }: { c: Condition; onChange: (c: Condition) => void; onRemove: () => void }) {
  const ops = OPS_BY_TYPE[FIELDS[c.field].type];
  return (
    <Group gap="xs" wrap="wrap" align="center">
      <Select
        aria-label="Alan" size="xs" w={200} data={FIELD_OPTIONS} value={c.field} searchable allowDeselect={false} comboboxProps={{ withinPortal: true }}
        onChange={(f) => f && onChange(freshCondition(f as FieldKey))}
      />
      <Select
        aria-label="İşleç" size="xs" w={170} allowDeselect={false} comboboxProps={{ withinPortal: true }}
        data={ops.map((o) => ({ value: o, label: OP_LABEL[o] }))} value={c.op}
        onChange={(o) => o && onChange(cond(c.field, o as Op, defaultValue(c.field, o as Op)))}
      />
      <ValueInput c={c} onChange={(v) => onChange({ ...c, value: v })} />
      <Tooltip label="Koşulu sil">
        <ActionIcon variant="subtle" color="red" aria-label="Koşulu sil" onClick={onRemove}><IconTrash size={16} /></ActionIcon>
      </Tooltip>
    </Group>
  );
}

function GroupEditor({ g, onChange, onRemove, depth }: { g: RGroup; onChange: (g: RGroup) => void; onRemove?: () => void; depth: number }) {
  const set = (i: number, r: Rule) => onChange({ ...g, children: g.children.map((c, j) => (j === i ? r : c)) });
  const del = (i: number) => onChange({ ...g, children: g.children.filter((_, j) => j !== i) });
  return (
    <Paper p="sm" radius="md" withBorder className={depth ? undefined : 'glass'} style={depth ? { borderStyle: 'dashed', background: 'transparent' } : undefined}>
      <Stack gap="xs">
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <SegmentedControl
              size="xs" value={g.combinator} onChange={(v) => onChange({ ...g, combinator: v as 'and' | 'or' })}
              data={[{ value: 'and', label: 'VE' }, { value: 'or', label: 'VEYA' }]}
            />
            <Switch size="xs" label="DEĞİL" aria-label="DEĞİL" checked={!!g.not} onChange={(e) => onChange({ ...g, not: e.currentTarget.checked || undefined })} />
            <Badge variant="light" color="gray" size="sm">{g.children.length} öğe</Badge>
          </Group>
          <Group gap={6}>
            <Button size="compact-xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => onChange({ ...g, children: [...g.children, freshCondition()] })}>Koşul ekle</Button>
            {depth < 2 && (
              <Button size="compact-xs" variant="subtle" leftSection={<IconSitemap size={14} />} onClick={() => onChange({ ...g, children: [...g.children, { kind: 'group', combinator: g.combinator === 'and' ? 'or' : 'and', children: [freshCondition('tags')] }] })}>
                Grup ekle
              </Button>
            )}
            {onRemove && <ActionIcon size="sm" variant="subtle" color="red" aria-label="Grubu sil" onClick={onRemove}><IconTrash size={14} /></ActionIcon>}
          </Group>
        </Group>
        {g.children.length === 0 && <Text size="sm" c="dimmed">Koşul yok: {g.combinator === 'and' ? 'bütün araçlar eşleşir' : 'hiçbir araç eşleşmez'}.</Text>}
        {g.children.map((c, i) => (
          <Box key={i} pl={depth ? 'xs' : 0}>
            {c.kind === 'cond' ? (
              <ConditionRow c={c} onChange={(n) => set(i, n)} onRemove={() => del(i)} />
            ) : (
              <GroupEditor g={c} depth={depth + 1} onChange={(n) => set(i, n)} onRemove={() => del(i)} />
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export function RuleBuilder({ value, onChange }: { value: RGroup; onChange: (g: RGroup) => void }) {
  return (
    <Stack gap="xs">
      <GroupEditor g={value} onChange={onChange} depth={0} />
      <Text size="sm" c="dimmed" data-testid="rule-description">
        {describeRule(value, (f, v) => labelFor(f, v))}
      </Text>
    </Stack>
  );
}
