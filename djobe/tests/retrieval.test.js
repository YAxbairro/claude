// Checks that, for real citizen questions, the right article shows up in the top results.
const fs = require("fs");
const path = require("path");
const S = require("../search.js");
const dir = path.join(__dirname, "..", "data");
const docs = JSON.parse(fs.readFileSync(path.join(dir, "docs.json"), "utf8"));
const chunks = JSON.parse(fs.readFileSync(path.join(dir, "chunks.json"), "utf8"));
const idx = S.build(chunks, docs);
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "cases.json"), "utf8"));
let pass = 0;
for (const c of cases) {
  const res = S.search(idx, c.search || c.q, { k: 8 });
  const ok = res.some(r => [].concat(c.doc).includes(docs[r.chunk.d].id) && (!c.match || new RegExp(c.match, "i").test(r.chunk.h + " " + r.chunk.t)));
  if (ok) pass++;
  console.log((ok ? "PASS" : "FAIL") + " | " + c.q);
  if (!ok || process.env.VERBOSE) res.slice(0, 5).forEach(r => console.log("     " + docs[r.chunk.d].short + " · " + r.chunk.h + " · " + r.chunk.t.slice(0, 90).replace(/\n/g, " ")));
}
console.log(`\n${pass}/${cases.length} passed`);
process.exitCode = pass === cases.length ? 0 : 1;
