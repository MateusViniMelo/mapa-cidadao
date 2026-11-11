# Separar fluxos do mapa Design

A página coordena. Cada fluxo tem um dono.

## Boundaries

- `OccurrenceMap.vue` guarda o ponto, abre os diálogos, chama a store e mostra os toasts.
- `MapLibreMap.vue` pede a geolocalização, faz `jumpTo`, grava o ponto e incrementa `focusToken`. Falha emite `locate-error`.
- `useCreateOccurrence` guarda descrição, categoria, endereço e o `AbortController`. O modal emite o `IOccurrencePayload`.
- `useReverseGeocoding` aceita o `AbortSignal` e devolve `carregando` e `erroEndereco` com `readonly`.
- `useOccurrenceTypes` pede `/api/types-occurrence` em `ensureLoaded`. Lista pronta não repete o GET. Falha deixa a lista vazia para a próxima abertura tentar de novo.
- `CloseOccurrenceModal` recebe `occurrenceId` e emite o formulário com esse id.

## Payload

`buildOccurrencePayload` devolve null sem ponto ou sem categoria. Com os dois, monta o ponto com `toRequestCoordinates(latitude, longitude)`.

`closeOccurrenceSubmission(id, data)` devolve `{ id, ...data }`. A página chama `inactive(data, id)`.

## Busca de endereço

Cada `begin` aborta o controller anterior, zera o endereço e só grava a resposta se aquele controller ainda for o ativo. `resetDraft` aborta, limpa descrição e endereço, e mantém a categoria. Um `finally` de pedido antigo não escreve `carregando` nem `erroEndereco`.
