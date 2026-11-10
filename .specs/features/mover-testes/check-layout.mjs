import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const oraclePath = path.join(root, ".specs/features/mover-testes/oracle.json");

const FILES = [
  "server/api/ocurrences/inactivate/[id].post.test.ts",
  "server/api/ocurrences/index.get.test.ts",
  "server/api/ocurrences/index.post.test.ts",
  "server/api/ocurrences/like/[id].get.test.ts",
  "server/api/ocurrences/my-ocurrences.get.test.ts",
  "server/api/register.post.test.ts",
  "server/api/route-map.test.ts",
  "server/api/types-ocurrence.get.test.ts",
  "server/api/user/login.post.test.ts",
  "server/api/user/logout.post.test.ts",
  "server/api/user/me.get.test.ts",
  "server/db/migrate.test.ts",
  "server/domain/auth/register.test.ts",
  "server/domain/auth/session.test.ts",
  "server/domain/catalog/list-types.test.ts",
  "server/domain/occurrences/create.test.ts",
  "server/domain/occurrences/inactivate.test.ts",
  "server/domain/occurrences/like.test.ts",
  "server/domain/occurrences/list-active.test.ts",
  "server/domain/occurrences/mine.test.ts",
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function walkTests(dir, acc = []) {
  if (!fs.existsSync(path.join(root, dir))) return acc;
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walkTests(rel, acc);
    else if (entry.name.endsWith(".test.ts")) acc.push(rel);
  }
  return acc;
}

function specifiers(source) {
  const found = [];
  const re = /\bfrom\s+['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)|import\s+['"](\.[^'"]+)['"]|vi\.mock\(\s*['"](\.[^'"]+)['"]/g;
  for (const match of source.matchAll(re)) {
    found.push(match[1] || match[2] || match[3] || match[4]);
  }
  return found;
}

function resolveSpec(fromFile, spec) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
}

function relativize(oldFile, newFile, spec) {
  const resolved = resolveSpec(oldFile, spec);
  let rel = path.posix.relative(path.posix.dirname(newFile), resolved);
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function rewrite(source, oldFile, newFile) {
  const replace = (_, prefix, spec, suffix) => `${prefix}${relativize(oldFile, newFile, spec)}${suffix}`;
  return source
    .replace(/(from\s+['"])(\.[^'"]+)(['"])/g, replace)
    .replace(/(import\s*\(\s*['"])(\.[^'"]+)(['"]\s*\))/g, replace)
    .replace(/(import\s+['"])(\.[^'"]+)(['"])/g, replace)
    .replace(/(vi\.mock\(\s*['"])(\.[^'"]+)(['"])/g, replace);
}

function stripImports(source) {
  let text = source.replace(/\r\n/g, "\n");
  text = text.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*\n/gm, "");
  text = text.replace(/^import\s+['"][^'"]+['"];?[ \t]*\n/gm, "");
  return text;
}

function hashBody(source) {
  const normalized = stripImports(source).replace(/vi\.mock\(\s*['"]\.[^'"]+['"]/g, 'vi.mock("#"');
  return createHash("sha256").update(normalized).digest("hex");
}

function countTests(source) {
  return [...source.matchAll(/^\s*test\(/gm)].length;
}

function loadOracle() {
  if (!fs.existsSync(oraclePath)) fail(`missing ${oraclePath}`);
  return JSON.parse(fs.readFileSync(oraclePath, "utf8"));
}

function snapshot() {
  const onDisk = walkTests("server").sort();
  const expected = [...FILES].sort();
  if (onDisk.join("\n") !== expected.join("\n")) {
    fail(`server tests differ from the spec list:\n${onDisk.join("\n")}`);
  }
  const imports = {};
  const bodies = {};
  let tests = 0;
  for (const file of FILES) {
    const source = read(file);
    imports[file] = specifiers(source).map((spec) => resolveSpec(file, spec)).sort();
    bodies[file] = hashBody(source);
    tests += countTests(source);
  }
  if (tests !== 65) fail(`expected 65 test( calls, found ${tests}`);
  fs.writeFileSync(oraclePath, `${JSON.stringify({ imports, bodies, tests }, null, 2)}\n`);
  console.log(`snapshot ${FILES.length} files, ${tests} tests`);
}

function move() {
  if (!fs.existsSync(oraclePath)) snapshot();
  for (const file of FILES) {
    const sourcePath = path.join(root, file);
    if (!fs.existsSync(sourcePath)) fail(`missing source ${file}`);
    const dest = path.posix.join("test", file);
    const source = read(file);
    const next = rewrite(source, file, dest);
    const resolved = specifiers(next).map((spec) => resolveSpec(dest, spec)).sort();
    const oracle = loadOracle();
    if (resolved.join("\n") !== oracle.imports[file].join("\n")) {
      fail(`rewrite changed targets for ${file}\n${resolved.join("\n")}`);
    }
    fs.mkdirSync(path.dirname(path.join(root, dest)), { recursive: true });
    fs.writeFileSync(path.join(root, dest), next);
    fs.unlinkSync(sourcePath);
  }
  console.log(`moved ${FILES.length} files`);
}

function fixMocks() {
  const oracle = loadOracle();
  let rewritten = 0;
  for (const file of FILES) {
    const dest = path.posix.join("test", file);
    const source = read(dest);
    const mocks = [...source.matchAll(/vi\.mock\(\s*['"](\.[^'"]+)['"]/g)].map((match) => match[1]);
    if (mocks.length === 0) continue;
    const targets = mocks.map((spec) => resolveSpec(file, spec));
    oracle.imports[file] = [...new Set([...oracle.imports[file], ...targets])].sort();
    oracle.bodies[file] = hashBody(source);
    const next = source.replace(
      /(vi\.mock\(\s*['"])(\.[^'"]+)(['"])/g,
      (_, prefix, spec, suffix) => `${prefix}${relativize(file, dest, spec)}${suffix}`,
    );
    if (hashBody(next) !== oracle.bodies[file]) fail(`mock rewrite changed the body of ${file}`);
    fs.writeFileSync(path.join(root, dest), next);
    rewritten += 1;
  }
  fs.writeFileSync(oraclePath, `${JSON.stringify(oracle, null, 2)}\n`);
  console.log(`mocks ${rewritten}`);
}

function paths() {
  const found = walkTests("test").sort();
  const expected = FILES.map((file) => path.posix.join("test", file)).sort();
  if (found.join("\n") !== expected.join("\n")) {
    fail(`test tree is not the mirrored list:\n${found.join("\n")}`);
  }
  console.log(`paths ${expected.length}`);
}

function absent() {
  const found = walkTests("server");
  if (found.length) fail(`test files remain under server:\n${found.join("\n")}`);
  console.log("absent 0");
}

function imports() {
  const oracle = loadOracle();
  for (const file of FILES) {
    const dest = path.posix.join("test", file);
    const resolved = specifiers(read(dest)).map((spec) => resolveSpec(dest, spec)).sort();
    if (resolved.join("\n") !== oracle.imports[file].join("\n")) {
      fail(`import targets differ for ${dest}`);
    }
  }
  console.log("imports match");
}

function bodies() {
  const oracle = loadOracle();
  let tests = 0;
  for (const file of FILES) {
    const source = read(path.posix.join("test", file));
    if (hashBody(source) !== oracle.bodies[file]) fail(`non-import lines differ in ${file}`);
    tests += countTests(source);
  }
  if (tests !== 65) fail(`expected 65 test( calls, found ${tests}`);
  console.log("bodies match");
}

function helper() {
  const helperPath = "server/test/call-handler.ts";
  if (!fs.existsSync(path.join(root, helperPath))) fail(`missing ${helperPath}`);
  if (walkTests("server/test").length) fail("server/test holds a test file");
  console.log("helper stays");
}

function vitestInclude() {
  const text = read("vitest.config.ts");
  const match = text.match(/include\s*:\s*\[([\s\S]*?)\]/);
  if (!match) fail("vitest include is missing");
  const globs = [...match[1].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]);
  if (globs.length !== 1 || globs[0] !== "test/server/**/*.test.ts") {
    fail(`vitest include is ${globs.join(", ") || "(empty)"}`);
  }
  console.log("vitest include");
}

function loadGuard(text) {
  const databaseName = text.match(/function databaseName\(url: string\): string \{[\s\S]*?\n\}/);
  const assertTestDatabase = text.match(/function assertTestDatabase\(url: string\): void \{[\s\S]*?\n\}/);
  if (!databaseName || !assertTestDatabase) fail("vitest database guard is missing");
  const source = `${databaseName[0]}\n${assertTestDatabase[0]}`
    .replace(/: string/g, "")
    .replace(/: void/g, "");
  return new Function(`${source}\nreturn assertTestDatabase;`)();
}

function vitestGuard() {
  const text = read("vitest.config.ts");
  const required = [
    "fileParallelism: false",
    "passWithNoTests: true",
    "testTimeout: 30_000",
    "hookTimeout: 30_000",
  ];
  for (const item of required) {
    if (!text.includes(item)) fail(`vitest config lost ${item}`);
  }
  const assertTestDatabase = loadGuard(text);
  const accepted = "postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao_test";
  try {
    assertTestDatabase(accepted);
  } catch (error) {
    fail(`guard refused mapa_cidadao_test: ${error instanceof Error ? error.message : error}`);
  }
  const refused = [
    "postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao",
    "postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao_test2",
    "",
  ];
  for (const url of refused) {
    let threw = false;
    try {
      assertTestDatabase(url);
    } catch {
      threw = true;
    }
    if (!threw) fail(`guard accepted ${url || "(empty)"}`);
  }
  console.log("vitest guard");
}

function routeMap() {
  const file = "test/server/api/route-map.test.ts";
  if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
  console.log("route-map");
}

function brackets() {
  const files = [
    "test/server/api/ocurrences/inactivate/[id].post.test.ts",
    "test/server/api/ocurrences/like/[id].get.test.ts",
  ];
  for (const file of files) {
    if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
  }
  console.log("brackets");
}

function selectors() {
  const docs = [
    ".specs/features/migrar-backend/tasks.md",
    ".specs/features/migrar-backend/mutations.json",
  ];
  let seen = 0;
  for (const doc of docs) {
    const text = read(doc);
    const re = /server\/[^\s`"'|]*\.test\.ts/g;
    for (const match of text.matchAll(re)) {
      seen += 1;
      const prefix = text.slice(Math.max(0, match.index - 5), match.index);
      if (prefix !== "test/") fail(`${doc} still has ${match[0]}`);
    }
  }
  if (seen === 0) fail("no test paths found in the migrar-backend selectors");
  console.log(`selectors ${seen}`);
}

const commands = {
  snapshot,
  move,
  "fix-mocks": fixMocks,
  paths,
  absent,
  imports,
  bodies,
  helper,
  "vitest-include": vitestInclude,
  "vitest-guard": vitestGuard,
  "route-map": routeMap,
  brackets,
  selectors,
};

const command = commands[process.argv[2]];
if (!command) fail(`unknown command ${process.argv[2] ?? ""}`);
command();
