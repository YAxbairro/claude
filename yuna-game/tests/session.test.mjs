import { test } from 'node:test';
import assert from 'node:assert/strict';

const { ISLANDS } = await import('../src/data/islands.ts');
const { makeSession, eligible } = await import('../src/games/session.ts');

test('sessions are varied, never repeat back to back and end the adventure with the puzzle', () => {
  for (const isl of ISLANDS) {
    const unique = new Set(isl.mechs.filter((m) => eligible(m, isl)));
    for (const phase of [0, 1, 2]) {
      const seen = new Set();
      for (let run = 0; run < 150; run++) {
        const s = makeSession(isl, phase);
        assert.equal(s.length, 10);
        for (let i = 1; i < s.length; i++) assert.notEqual(s[i], s[i - 1], `${isl.name} p${phase}: repeat ${s}`);
        assert.ok(new Set(s).size >= Math.min(7, unique.size), `${isl.name} p${phase}: only ${new Set(s).size} kinds`);
        for (const m of s) assert.ok(unique.has(m), `${isl.name}: ${m} not allowed`);
        if (phase === 2 && unique.has('puzzle')) assert.equal(s.at(-1), 'puzzle');
        seen.add(s.join());
      }
      assert.ok(seen.size > 100, `${isl.name} p${phase}: sessions too predictable (${seen.size}/150)`);
    }
  }
});
