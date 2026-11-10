import { defineEventHandler } from "h3";
import { getPrisma } from "../db/client";
import { listTypes } from "../domain/catalog/list-types";

export default defineEventHandler(async () => {
  return { types_occurrence: await listTypes(getPrisma()) };
});
