# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Afirme o valor aceito na fronteira e o valor um passo fora dela, para um limite deslocado em um falhar o teste.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `auth` · harmful: 0
- features: migrar-backend
- evidence: C6 (auth)
- last seen: 2026-11-09T22:55:16Z

### L-002 - Afirme a função de produção quando a dependência lança e quando devolve vazio, em vez de um stub que já retorna falso.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `auth` · harmful: 0
- features: migrar-backend
- evidence: C5 (auth)
- last seen: 2026-11-09T22:55:16Z

### L-003 - Afirme o status HTTP que a rota define para um corpo inválido e que a escrita não aconteceu.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: migrar-backend
- evidence: C3 (routes)
- last seen: 2026-11-09T22:55:16Z

### L-004 - Afirme as chaves públicas do JSON e a ausência dos campos secretos em todo payload de usuário que o critério cobre.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `auth` · harmful: 0
- features: migrar-backend
- evidence: C15 (auth)
- last seen: 2026-11-09T22:55:16Z

### L-005 - Peça cada caminho que o critério lista e afirme cada resposta, em vez de só contar os handlers.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: migrar-backend
- evidence: C51 (routes)
- last seen: 2026-11-09T22:55:16Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
