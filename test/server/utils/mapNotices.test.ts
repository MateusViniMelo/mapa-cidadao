import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { legendMarkers, markerFor } from "../../../util/makerIcons";
import { mapNotices } from "../../../utils/mapNotices";

test("map notices", () => {
  expect(mapNotices.loginRequired).toEqual({
    title: "Erro",
    description: "Faça o login pra informar uma ocorrência",
    color: "error",
  });
  expect(mapNotices.pointRequired).toEqual({
    title: "Localização necessária",
    description: "Marque a localização no mapa antes de salvar.",
    color: "warning",
  });
  expect(mapNotices.created).toEqual({
    title: "Ocorrência criada",
    description: "Ocorrência salva com sucesso.",
    color: "success",
  });
  expect(mapNotices.createError).toEqual({
    title: "Erro",
    description: "Não foi possível salvar ocorrência.",
    color: "error",
  });
  expect(mapNotices.likeError).toEqual({
    title: "Erro",
    description: "Não foi possível dar like na ocorrência",
    color: "error",
  });
  expect(mapNotices.inactivated).toEqual({
    title: "Ocorrência inativada",
    description: "Ocorrência inativada com sucesso",
    color: "success",
  });
  expect(mapNotices.inactivateError).toEqual({
    title: "Erro",
    description: "Não foi possível inativar a ocorrência",
    color: "error",
  });
  expect(mapNotices.geoUnavailable.title).toBe(
    "Geolocalização não disponível no seu navegador.",
  );
  expect(mapNotices.geoDenied.title).toBe("Não foi possível obter sua localização.");
  expect(mapNotices.geoDenied.description).toBe(
    "Verifique se você concedeu permissão de acesso à sua localização para este site nas configurações do navegador e tente novamente.",
  );
  expect(mapNotices.geoDenied.duration).toBe(10000);
});

test("legend names", () => {
  const icons = readFileSync("util/makerIcons.ts", "utf8");
  expect(icons).not.toContain("leaflet");
  expect(legendMarkers().map((item) => item.nome)).toEqual([
    "Problema de Iluminação",
    "Problema de Pavimentação",
    "Alagamento",
    "Lixo",
    "Sem Pavimentação",
  ]);
  expect(legendMarkers().some((item) => item.nome === "Problema Desconhecido")).toBe(
    false,
  );
  expect(markerFor(99).nome).toBe("Problema Desconhecido");
});
