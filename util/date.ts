import { intervalToDuration, formatDuration } from "date-fns";
import { ptBR } from "date-fns/locale";

export function tempoAtras(data: Date | string): string {
  try {
    const date = typeof data === "string" ? new Date(data) : data;

    const duration = intervalToDuration({
      start: date,
      end: new Date(),
    });

    let unidades: (
      | "years"
      | "months"
      | "days"
      | "hours"
      | "minutes"
      | "seconds"
    )[] = [];

    if (duration.years || duration.months) {
      unidades = ["years", "months"];
    } else if (duration.days || duration.hours) {
      unidades = ["days", "hours"];
    } else if (duration.hours || duration.minutes) {
      unidades = ["hours", "minutes"];
    } else if (duration.minutes) {
      unidades = ["minutes"];
    } else {
      unidades = ["seconds"];
    }

    const formatted = formatDuration(duration, {
      locale: ptBR,
      format: unidades,
      delimiter: " e ",
    });

    return formatted ? `${formatted} atrás` : "agora";
  } catch (e) {
    return "";
  }
}
