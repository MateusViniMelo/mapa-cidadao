export const OCCURRENCE_CLOSURE_LABELS: Record<string, string> = {
  resolved: "Resolvida",
  other: "Outros",
  mistake: "Criada por engano",
};

export const OCCURRENCE_CLOSURE_COLORS: Record<
  string,
  "success" | "warning" | "secondary"
> = {
  resolved: "success",
  other: "warning",
  mistake: "secondary",
};

export const CLOSURE_TYPE_OPTIONS = [
  { label: "Problema Resolvido", value: "resolved" },
  { label: "Criei Errado", value: "mistake" },
  { label: "Outro motivo", value: "other" },
] as const;

export function getClosureLabel(typeClosure: string | null | undefined) {
  if (!typeClosure) return "Em andamento";
  return OCCURRENCE_CLOSURE_LABELS[typeClosure] ?? typeClosure;
}

export function getClosureColor(typeClosure: string | null | undefined) {
  if (!typeClosure) return "secondary" as const;
  return OCCURRENCE_CLOSURE_COLORS[typeClosure] ?? "secondary";
}
