# Contrato occurrence verification

**Verdict**: FAIL
**Mutations**: 3 - probed C12, C13, C14
**Proofs**: `proofs.md` at 838bcfe
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Trocar latitude e longitude no payload do mapa deixa C12 verde | Mutação `map payload latitude then longitude -> swapped` não morta (`LeafletMap.vue:233`). `test/server/utils/occurrencePoint.test.ts:8` trava o retorno de `toRequestCoordinates(-23.55052, -46.633308)` e a linha 9 só exige `toContain("toRequestCoordinates(")` | No teste `click becomes longitude first`, exigir a chamada com latitude e depois longitude e o retorno em `coordinates` do payload de criar | C12 |
| Aceitar um ponto com três números deixa C13 verde | Mutação `coordinate pair length !== 2 -> < 2` não morta (`create.ts:89`). `index.post.test.ts` cobre comprimento 1, NaN, +Infinity e string. No HEAD, `[12.5, -7.25, 0]` responde 422 e a contagem não sobe; o teste nomeado não vê esse caso | Em `create rejects a point that is not two finite numbers`, rejeitar `coordinates` com três números: status 422 e a contagem de linhas igual à de antes | C13 |
