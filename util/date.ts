import { intervalToDuration, formatDuration } from "date-fns";
import { ptBR } from "date-fns/locale";

export function tempoAtras(data: Date | string): string {
  try {
    const date = typeof data === "string" ? new Date(data) : data;

    const duration = intervalToDuration({
      start: date,
      end: new Date(),
    });

    const onlySeconds =
      duration.years === 0 &&
      duration.months === 0 &&
      duration.days === 0 &&
      duration.hours === 0 &&
      duration.minutes === 0;

    const formatted = formatDuration(duration, {
      locale: ptBR,
      format: onlySeconds
        ? ["seconds"]
        : ["years", "months", "days", "hours", "minutes"],
      delimiter: " e ",
    });

    return formatted ? `há ${formatted}` : "agora";
  } catch (e) {
    return "";
  }
}
