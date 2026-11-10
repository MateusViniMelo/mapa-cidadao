# Mover os testes para `test/` verification

**Verdict**: FAIL
**Mutations**: 3 - probed C3, C6, C7
**Proofs**: `proofs.md` at 18b60ba
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Inverter o guarda de `!==` para `===` deixa o Vitest recusar `mapa_cidadao_test` e aceitar qualquer outro nome, e o C7 continua verde | mutação `condição do guarda !== -> ===` em `vitest.config.ts:17` não morta por `node .specs/features/mover-testes/check-layout.mjs vitest-guard` | o C7 precisa falhar quando a comparação deixa de recusar um nome diferente de `mapa_cidadao_test` | C7 |
