# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-11-09] npm bloqueia scripts de instalação**
   Do instead: depois de `npm install`, conferir o aviso `install-scripts`. `esbuild`, `@tailwindcss/oxide` e `@parcel/watcher` podem já funcionar; `sharp` (via `@nuxt/image` / `ipx`) quebra sem o script. Aprovar com `npm install-scripts approve sharp` e, se o pacote já estiver em `node_modules`, rodar `npm rebuild sharp` (um `npm install` seguinte não reexecuta o script).

## Shell & Command Reliability

## Domain Behavior Guardrails
1. **[2026-11-09] Coordenada da ocorrência não é GeoJSON na ida**
   Do instead: o front envia `[latitude, longitude]` e a resposta devolve `[longitude, latitude]`. Não inverter um dos lados. O par de prova é ida `[-23.55052, -46.633308]` e volta `[-46.633308, -23.55052]`.
2. **[2026-11-09] `npm audit fix --force` no Nuxt**
   Do instead: tratar as dezenas de avisos de auditoria como dependências transitivas. Não rodar `--force` sem revisar o que seria rebaixado.

## User Directives
1. **[2026-11-09] Responder em português**
   Do instead: toda resposta ao usuário neste repositório em português.
