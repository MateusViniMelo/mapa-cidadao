// @vitest-environment happy-dom
import { createApp, type Component } from "vue";
import { expect, test } from "vitest";
import DraftPopup from "../../../components/map/DraftPopup.vue";
import OccurrencePopup from "../../../components/map/OccurrencePopup.vue";
import { tempoAtras } from "../../../util/date";

function mountPopup(
  component: Component,
  props: Record<string, unknown> = {},
  on: Record<string, (...args: unknown[]) => void> = {},
) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const app = createApp(component, { ...props, ...on });
  app.mount(el);
  return el;
}

test("draft popup says Informar Problema", () => {
  const calls: string[] = [];
  const el = mountPopup(DraftPopup, {}, { onInform: () => calls.push("inform") });

  const button = el.querySelector("button");
  expect(button?.textContent).toContain("Informar Problema");
  button?.click();
  expect(calls).toEqual(["inform"]);
});

test("address script is text", () => {
  const createdAt = "2020-01-15T12:00:00.000Z";
  const el = mountPopup(OccurrencePopup, {
    typeName: "<img src=x onerror=alert(1)>",
    addressName: "<script>alert(1)</script>, Centro, Belém",
    createdAt,
    occurrenceId: 9,
    likesCount: 0,
    liked: false,
    isOwner: false,
  });

  expect(el.textContent).toContain("<script>alert(1)</script>, Centro");
  expect(el.querySelector("script")).toBeNull();
  expect(el.innerHTML.toLowerCase()).not.toContain("<script");
  expect(el.textContent).toContain("<img src=x onerror=alert(1)>");
  expect(el.querySelector("img")).toBeNull();
  expect(el.querySelector("[data-address]")?.textContent).toBe(
    "<script>alert(1)</script>, Centro",
  );
  expect(el.querySelector("[data-when]")?.textContent).toBe(tempoAtras(createdAt));
});

test("empty address stays a blank line", () => {
  const el = mountPopup(OccurrencePopup, {
    typeName: "Alagamento",
    addressName: "",
    createdAt: "2020-01-15T12:00:00.000Z",
    occurrenceId: 3,
    likesCount: 0,
    liked: false,
    isOwner: false,
  });

  expect(el.querySelector("[data-address]")?.textContent).toBe("");
});

test("address without comma stays whole", () => {
  const el = mountPopup(OccurrencePopup, {
    typeName: "Lixo",
    addressName: "Praça da República",
    createdAt: "2020-01-15T12:00:00.000Z",
    occurrenceId: 4,
    likesCount: 1,
    liked: false,
    isOwner: false,
  });

  expect(el.querySelector("[data-address]")?.textContent).toBe("Praça da República");
});

test("encerrar follows the owner", () => {
  const owner = mountPopup(OccurrencePopup, {
    typeName: "Alagamento",
    addressName: "Rua A, Centro, Belém",
    createdAt: "2020-01-15T12:00:00.000Z",
    occurrenceId: 5,
    likesCount: 1,
    liked: false,
    isOwner: true,
  });
  const other = mountPopup(OccurrencePopup, {
    typeName: "Alagamento",
    addressName: "Rua A, Centro, Belém",
    createdAt: "2020-01-15T12:00:00.000Z",
    occurrenceId: 5,
    likesCount: 1,
    liked: false,
    isOwner: false,
  });

  expect(owner.textContent).toContain("Encerrar");
  expect(other.textContent).not.toContain("Encerrar");

  const closed: number[] = [];
  const wired = mountPopup(
    OccurrencePopup,
    {
      typeName: "Alagamento",
      addressName: "Rua A, Centro",
      createdAt: "2020-01-15T12:00:00.000Z",
      occurrenceId: 5,
      likesCount: 1,
      liked: false,
      isOwner: true,
    },
    { onClose: (id) => closed.push(id as number) },
  );
  const encerrar = [...wired.querySelectorAll("button")].find((button) =>
    button.textContent?.includes("Encerrar"),
  );
  encerrar?.click();
  expect(closed).toEqual([5]);
});

test("liked count is pressed", () => {
  const liked: number[] = [];
  const el = mountPopup(
    OccurrencePopup,
    {
      typeName: "Lixo",
      addressName: "Rua A, Centro, Belém",
      createdAt: "2020-01-15T12:00:00.000Z",
      occurrenceId: 8,
      likesCount: 4,
      liked: true,
      isOwner: false,
    },
    { onLike: (id) => liked.push(id as number) },
  );

  const button = el.querySelector("button");
  expect(el.querySelector("[data-likes]")?.textContent).toBe("4");
  expect(button?.getAttribute("aria-pressed")).toBe("true");
  button?.click();
  expect(liked).toEqual([8]);
});
