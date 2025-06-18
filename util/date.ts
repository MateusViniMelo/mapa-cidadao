import { intervalToDuration, formatDuration } from "date-fns";
import { ptBR } from "date-fns/locale";

export function tempoAtras(data: Date | string): string {
  const date = typeof data === "string" ? new Date(data) : data;

  const duration = intervalToDuration({
    start: date,
    end: new Date(),
  });

  // Você pode limitar os componentes que quer exibir:
  const formatted = formatDuration(duration, {
    locale: ptBR,
    format: ["years", "months", "days", "hours", "minutes"], // sem segundos
    delimiter: " e ", // para ficar: "2 horas e 15 minutos"
  });

  return `há ${formatted}`;
}
