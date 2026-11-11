import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve("artifact");
const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? walk(path)
      : path.endsWith(".md")
        ? [path]
        : [];
  });
const files = walk(root);
const documents = new Map(
  files.map((file) => [file, readFileSync(file, "utf8")]),
);
const slug = (heading) =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\- ]/gu, "")
    .replaceAll(" ", "-");

for (const [file, text] of documents) {
  assert.equal((text.match(/```/g) ?? []).length % 2, 0, `Code fence: ${file}`);
  for (const [, destination] of text.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^https?:|^mailto:/.test(destination)) continue;
    const [relative, fragment] = destination.split("#");
    const target = relative
      ? resolve(dirname(file), decodeURIComponent(relative))
      : file;
    assert.ok(existsSync(target), `${file}: missing ${destination}`);
    if (fragment && documents.has(target)) {
      const headings = [
        ...documents.get(target).matchAll(/^#{1,6} (.+)$/gm),
      ].map(([, heading]) => slug(heading));
      assert.ok(headings.includes(fragment), `${file}: missing ${destination}`);
    }
  }
}

const decisions = documents.get(join(root, "DECISIONS.md"));
const knownIds = new Set(
  [...decisions.matchAll(/^### ([DO]-\d{3})$/gm)].map(([, id]) => id),
);
const tasks = new Map();
for (const [file, text] of documents) {
  for (const [id] of text.matchAll(/\b[DO]-\d{3}\b/g)) {
    assert.ok(knownIds.has(id), `${file}: unknown decision ${id}`);
  }
  if (!file.includes("/tasks/")) continue;
  assert.ok(text.includes("**Feature PRD:**"), `${file}: missing PRD`);
  const sections = text.split(/^### (T\d{2}-\d{2})\s*$/m);
  for (let index = 1; index < sections.length; index += 2) {
    const id = sections[index];
    const body = sections[index + 1];
    assert.ok(!tasks.has(id), `Duplicate task ${id}`);
    for (const field of [
      "Status",
      "Decisions",
      "Depends on",
      "Acceptance and tests",
    ]) {
      assert.ok(body.includes(`**${field}:**`), `${id}: missing ${field}`);
    }
    tasks.set(id, {
      status: body.match(/\*\*Status:\*\* (.+)/)[1].toLowerCase(),
      dependencies: [
        ...(body.match(/\*\*Depends on:\*\* (.+)/)?.[1] ?? "").matchAll(
          /\bT\d{2}-\d{2}\b/g,
        ),
      ].map(([dependency]) => dependency),
    });
  }
}

const board = documents.get(join(root, "KANBAN.md"));
const cards = new Set();
for (const [, title, body] of board.matchAll(
  /^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm,
)) {
  for (const [, id] of body.matchAll(/^- \[[ x]\] \[(T\d{2}-\d{2})\]/gm)) {
    assert.ok(!cards.has(id), `Duplicate board card ${id}`);
    assert.ok(tasks.has(id), `Unknown board task ${id}`);
    assert.ok(
      tasks.get(id).status.startsWith(title.split(" — ")[0].toLowerCase()),
      `${id}: status mismatch`,
    );
    cards.add(id);
  }
}
assert.equal(
  cards.size,
  tasks.size,
  "Every task must appear once on the board",
);

const visited = new Set();
const visiting = new Set();
function visit(id) {
  assert.ok(!visiting.has(id), `Dependency cycle: ${id}`);
  if (visited.has(id)) return;
  assert.ok(tasks.has(id), `Unknown task dependency ${id}`);
  visiting.add(id);
  for (const dependency of tasks.get(id).dependencies) visit(dependency);
  visiting.delete(id);
  visited.add(id);
}
for (const id of tasks.keys()) visit(id);
console.log(
  `Verified ${files.length} artifact documents and ${tasks.size} tasks.`,
);
