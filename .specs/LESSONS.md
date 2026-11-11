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

### L-006 - Chame o guarda do nome do banco com o nome aceito e com um nome recusado. Não procure só o texto do nome no arquivo.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `vitest` · harmful: 0
- features: mover-testes
- evidence: vitest.config.ts:17 (vitest)
- last seen: 2026-11-10T00:22:43Z

### L-007 - When a test proves a call by reading source, assert the argument order, not only the function name.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `map` · harmful: 0
- features: contrato-occurrence
- evidence: test/server/utils/occurrencePoint.test.ts:9 (map)
- last seen: 2026-11-10T01:44:02Z

### L-008 - A length check of exactly N needs a case longer than N, not only a case shorter than N.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `occurrences` · harmful: 0
- features: contrato-occurrence
- evidence: server/domain/occurrences/create.ts:89 (occurrences)
- last seen: 2026-11-10T01:44:02Z

### L-009 - Assert the full branch that decides the outcome, not a token that an earlier guard also contains.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `middleware` · harmful: 0
- features: sessao-cookie
- evidence: C26 (middleware)
- last seen: 2026-11-10T02:50:44Z

### L-010 - Assert the state assignment the screen reads sits inside the action, not only the success message.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `stores` · harmful: 0
- features: sessao-cookie
- evidence: C17 (stores)
- last seen: 2026-11-10T02:50:44Z

### L-011 - Assert a cookie attribute as its own token, so a longer value does not satisfy the shorter one.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `cookies` · harmful: 0
- features: sessao-cookie
- evidence: C13 (cookies)
- last seen: 2026-11-10T02:50:44Z

### L-012 - Assert the HTTP method beside the path the criterion names, not the path string alone.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `client` · harmful: 0
- features: sessao-cookie
- evidence: C15 (client)
- last seen: 2026-11-10T02:50:44Z

### L-013 - When a new request replaces one that already stored a value, assert that value is cleared before the new response arrives.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `composables` · harmful: 0
- features: separar-fluxos-mapa
- evidence: composables/useCreateOccurrence.ts:31 (composables)
- last seen: 2026-11-11T02:11:43Z

### L-014 - Settle the aborted request while the newer one is still pending, and assert the newer loading flag stays set.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `composables` · harmful: 0
- features: separar-fluxos-mapa
- evidence: composables/useReverseGeocoding.ts:38 (composables)
- last seen: 2026-11-11T02:11:43Z

### L-015 - Treat a successful empty collection as loaded; do not use a non-empty length as the only loaded flag.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `composables` · harmful: 0
- features: separar-fluxos-mapa
- evidence: composables/useOccurrenceTypes.ts:32 (composables)
- last seen: 2026-11-11T02:11:43Z

### L-016 - Assert the failure event is emitted and the page shows that notice, not only that the notice text exists.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `components` · harmful: 0
- features: separar-fluxos-mapa
- evidence: C25 (components)
- last seen: 2026-11-11T02:11:43Z

### L-017 - Run the branch that produces the outcome; a source string that mentions the call is not the behavior.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `components` · harmful: 0
- features: separar-fluxos-mapa
- evidence: C4 (components)
- last seen: 2026-11-11T02:11:43Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
