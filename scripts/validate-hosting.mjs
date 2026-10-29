import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const publicDirectory = path.join(projectRoot, "public");
const developmentProjectId = "b2b-meal-plan-dev";
const developmentWorkerUrl = "https://b2b-meal-api-dev.wispy-river-05a7.workers.dev";
const productionWorkerUrl = "https://b2b-meal-api.wispy-river-05a7.workers.dev";

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link is not allowed: ${relativePath}`);
    if (entry.isDirectory()) files.push(...await listFiles(fullPath, relativePath));
    if (entry.isFile()) files.push(relativePath.replaceAll("\\", "/"));
  }
  return files.sort();
}

async function sourceFiles(directoryName, extension) {
  const entries = await readdir(path.join(projectRoot, directoryName), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => `${directoryName}/${entry.name}`)
    .sort();
}

const firebaseConfig = JSON.parse(await readFile(path.join(projectRoot, "firebase.json"), "utf8"));
const firebaseRc = JSON.parse(await readFile(path.join(projectRoot, ".firebaserc"), "utf8"));
const workflow = await readFile(
  path.join(projectRoot, ".github", "workflows", "firebase-deploy-dev.yml"),
  "utf8",
);

assert.equal(firebaseConfig.hosting.public, "public", "Firebase public directory must be public");
assert.equal(firebaseRc.projects.default, developmentProjectId, ".firebaserc must target the development project");
assert.match(workflow, /projectId:\s*b2b-meal-plan-dev\b/, "Workflow projectId must target development");
assert.match(
  workflow,
  /FIREBASE_SERVICE_ACCOUNT_B2B_MEAL_PLAN_DEV/,
  "Workflow must use the development service-account secret",
);

const expectedFiles = [
  "index.html",
  ...await sourceFiles("js", ".js"),
  ...await sourceFiles("css", ".css"),
].sort();
const publicFiles = await listFiles(publicDirectory);
assert.deepEqual(publicFiles, expectedFiles, "Hosting artifact contains missing or unexpected files");

for (const relativePath of expectedFiles) {
  const sourcePath = relativePath === "index.html"
    ? path.join(projectRoot, relativePath)
    : path.join(projectRoot, ...relativePath.split("/"));
  const publicPath = path.join(publicDirectory, ...relativePath.split("/"));
  const [sourceContent, publicContent] = await Promise.all([
    readFile(sourcePath),
    readFile(publicPath),
  ]);
  assert.equal(
    Buffer.compare(sourceContent, publicContent),
    0,
    `Published file differs from source: ${relativePath}`,
  );
}

const indexHtml = await readFile(path.join(publicDirectory, "index.html"), "utf8");
const localReferences = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => !/^(?:https?:|data:|#|\/\/)/i.test(reference));

for (const reference of localReferences) {
  assert.equal(reference.includes(".."), false, `Parent path is not allowed: ${reference}`);
  await access(path.join(publicDirectory, ...reference.split("/")));
  assert.ok(publicFiles.includes(reference), `Referenced file is outside the allowlist: ${reference}`);
}

const apiSource = await readFile(path.join(publicDirectory, "js", "api.js"), "utf8");
assert.ok(apiSource.includes(developmentWorkerUrl), "Development Worker URL is missing");
assert.equal(apiSource.includes(productionWorkerUrl), false, "Production Worker URL must not be published to development");

const forbiddenPathPatterns = [
  /(^|\/)worker\.dev\.js(\/|$)/i,
  /(^|\/)\.tests(\/|$)/i,
  /(^|\/)\.git(\/|$)/i,
  /(^|\/)scripts(\/|$)/i,
  /\.md$/i,
  /(^|\/)firebase\.json$/i,
  /(^|\/)\.firebaserc$/i,
  /\.ya?ml$/i,
];
for (const file of publicFiles) {
  assert.equal(
    forbiddenPathPatterns.some((pattern) => pattern.test(file)),
    false,
    `Forbidden file is included in Hosting artifact: ${file}`,
  );
}

console.log(`Firebase project: ${developmentProjectId}`);
console.log(`Hosting public directory: ${publicDirectory}`);
console.log(`Validated ${publicFiles.length} public files:`);
for (const file of publicFiles) console.log(`  ${file}`);
console.log("Hosting artifact validation passed.");
