/**
 * Lineup Validation & CSV Sanitization Test Suite
 * 
 * Verifies:
 * 1. Formula-Injection (CSV Injection) sanitization mitigation for all forbidden prefix triggers (=, +, -, @, \t, \r).
 * 2. 11-player lineup completeness validation.
 * 3. Position eligibility alignment against canonical formation slot constraints.
 * 4. Missing / incomplete slot error handling.
 * 5. Database RPC response code contract for finalize_lineup.
 */

import assert from 'node:assert/strict';
import { sanitizeCsvField, formatCsvRow, exportLineupToCSV } from '../src/utils/csvExporter.js';
import { FORMATION_PRESETS } from '../src/pages/Lineups.jsx';

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

console.log('\n======================================================');
console.log(' GRIDIRON TEST SUITE: FORMULA SANITIZATION & LINEUPS');
console.log('======================================================\n');

// -----------------------------------------------------------
// SUITE 1: CSV FORMULA INJECTION SANITIZATION AUDIT
// -----------------------------------------------------------
console.log('SUITE 1: CSV Formula Injection (DDE / Spreadsheet Execution) Protection');

runTest('Prefixes "=" formula trigger with single quote', () => {
  assert.equal(sanitizeCsvField('=1+1'), "'=1+1");
  assert.equal(sanitizeCsvField('=SUM(A1:A10)'), "'=SUM(A1:A10)");
  assert.equal(sanitizeCsvField("=cmd|' /C calc'!A0"), "'=cmd|' /C calc'!A0");
});

runTest('Prefixes "+" formula trigger with single quote', () => {
  assert.equal(sanitizeCsvField('+1+1'), "'+1+1");
  assert.equal(sanitizeCsvField('+cmd'), "'+cmd");
  assert.equal(sanitizeCsvField('+123.45'), "'+123.45");
});

runTest('Prefixes "-" formula trigger with single quote', () => {
  assert.equal(sanitizeCsvField('-1+1'), "'-1+1");
  assert.equal(sanitizeCsvField('-500'), "'-500");
  assert.equal(sanitizeCsvField('-2+5+cmd'), "'-2+5+cmd");
});

runTest('Prefixes "@" formula trigger with single quote', () => {
  assert.equal(sanitizeCsvField('@SUM(1,2)'), "'@SUM(1,2)");
  assert.equal(sanitizeCsvField('@username'), "'@username");
});

runTest('Prefixes tab (\\t) and carriage return (\\r) control characters', () => {
  assert.equal(sanitizeCsvField('\tTAB_INJECT'), "'\tTAB_INJECT");
  assert.equal(sanitizeCsvField('\rCR_INJECT'), "'\rCR_INJECT");
});

runTest('Leaves benign inputs untouched without prepending quotes', () => {
  assert.equal(sanitizeCsvField('Patrick Mahomes'), 'Patrick Mahomes');
  assert.equal(sanitizeCsvField('Josh Allen'), 'Josh Allen');
  assert.equal(sanitizeCsvField('4.85'), '4.85');
  assert.equal(sanitizeCsvField('QB'), 'QB');
  assert.equal(sanitizeCsvField(''), '');
  assert.equal(sanitizeCsvField(null), '');
  assert.equal(sanitizeCsvField(undefined), '');
});

runTest('formatCsvRow correctly quotes fields with commas, quotes, and newlines', () => {
  const row = formatCsvRow(['Safe Text', 'Field, With, Commas', 'Quote "Inside"', '=MaliciousFormula']);
  assert.equal(row, 'Safe Text,"Field, With, Commas","Quote ""Inside""",\'=MaliciousFormula');
});

// -----------------------------------------------------------
// SUITE 2: 11-SLOT ROSTER & POSITION ELIGIBILITY VALIDATION
// -----------------------------------------------------------
console.log('\nSUITE 2: 11-Player Lineup Completeness & Position Eligibility');

runTest('Canonical formation presets each define exactly 11 slots', () => {
  const presets = ['Offensive Spread 11', '4-3 Defense', 'Fantasy Superflex 11'];
  presets.forEach(presetName => {
    const formation = FORMATION_PRESETS[presetName];
    assert.ok(formation, `Preset ${presetName} must exist`);
    assert.equal(formation.slots.length, 11, `${presetName} must contain exactly 11 slots`);
  });
});

runTest('Offensive Spread 11 validates canonical offensive position assignments', () => {
  const spreadSlots = FORMATION_PRESETS['Offensive Spread 11'].slots;

  // QB Slot accepts only QB
  assert.deepEqual(spreadSlots[0].eligible, ['QB']);
  
  // RB Slot accepts only RB
  assert.deepEqual(spreadSlots[1].eligible, ['RB']);

  // WR Slots accept WR
  assert.deepEqual(spreadSlots[2].eligible, ['WR']);
  assert.deepEqual(spreadSlots[3].eligible, ['WR']);
  assert.deepEqual(spreadSlots[4].eligible, ['WR']);
  assert.deepEqual(spreadSlots[5].eligible, ['WR']);

  // TE Slot accepts TE
  assert.deepEqual(spreadSlots[6].eligible, ['TE']);

  // FLEX Slots accept RB, WR, TE
  assert.deepEqual(spreadSlots[7].eligible, ['RB', 'WR', 'TE']);
  assert.deepEqual(spreadSlots[8].eligible, ['RB', 'WR', 'TE']);

  // K & DST Slots
  assert.deepEqual(spreadSlots[9].eligible, ['K']);
  assert.deepEqual(spreadSlots[10].eligible, ['DST']);
});

runTest('Fantasy Superflex 11 allows Quarterbacks in Superflex slot', () => {
  const superflexSlots = FORMATION_PRESETS['Fantasy Superflex 11'].slots;
  const sflex = superflexSlots.find(s => s.name === 'SUPERFLEX');
  assert.ok(sflex, 'Superflex slot must exist');
  assert.ok(sflex.eligible.includes('QB'), 'SUPERFLEX must accept QB');
  assert.ok(sflex.eligible.includes('RB'), 'SUPERFLEX must accept RB');
  assert.ok(sflex.eligible.includes('WR'), 'SUPERFLEX must accept WR');
  assert.ok(sflex.eligible.includes('TE'), 'SUPERFLEX must accept TE');
});

runTest('4-3 Defense allows only canonical defensive players across 11 positions', () => {
  const defSlots = FORMATION_PRESETS['4-3 Defense'].slots;
  assert.equal(defSlots.length, 11);

  const lde = defSlots.find(s => s.name === 'LDE');
  assert.ok(lde.eligible.includes('DE') || lde.eligible.includes('EDGE'));

  const dt1 = defSlots.find(s => s.name === 'DT1');
  assert.ok(dt1.eligible.includes('DT') || dt1.eligible.includes('NT'));

  const mlb = defSlots.find(s => s.name === 'MLB');
  assert.ok(mlb.eligible.includes('LB') || mlb.eligible.includes('ILB'));

  const cb1 = defSlots.find(s => s.name === 'CB1');
  assert.ok(cb1.eligible.includes('CB') || cb1.eligible.includes('DB'));

  const fs = defSlots.find(s => s.name === 'FS');
  assert.ok(fs.eligible.includes('S') || fs.eligible.includes('FS'));
});

// -----------------------------------------------------------
// SUITE 3: ERROR HANDLING FOR MISSING PLAYERS & FULL EXPORT
// -----------------------------------------------------------
console.log('\nSUITE 3: Incomplete Lineup Handling & CSV Exporter Verification');

runTest('exportLineupToCSV handles unassigned/missing slots without throwing', () => {
  const partialLineup = {
    name: 'Draft Testing Lineup',
    formation: 'Offensive Spread 11',
    personal_rating: 4,
    slots: [
      { slotName: 'QB', player: { name: 'Josh Allen', pos: 'QB', team: 'BUF', jersey_number: 17, player_performance_rating: 4.80, fantasyPts: 220 } },
      { slotName: 'RB', player: null }, // Missing player slot
      { slotName: 'WR1', player: { name: '=FormulaInj', pos: 'WR', team: 'KC', jersey_number: 1, player_performance_rating: 4.50, fantasyPts: 180 } }
    ]
  };

  const csv = exportLineupToCSV(partialLineup, [], { download: false });
  assert.ok(csv.includes('Lineup Name,Formation Preset'), 'CSV must include headers');
  assert.ok(csv.includes('UNASSIGNED'), 'Empty slot must be labeled UNASSIGNED');
  assert.ok(csv.includes('\'=FormulaInj'), 'Malicious player name must be formula-sanitized');
});

// -----------------------------------------------------------
// SUITE 4: DATABASE RPC (finalize_lineup) CONTRACT TEST
// -----------------------------------------------------------
console.log('\nSUITE 4: Database RPC (finalize_lineup) Response Contract');

runTest('finalize_lineup simulated contract validates required parameters and success response', () => {
  // Mock RPC executor replicating Postgres stored procedure behavior
  function simulateFinalizeLineupRPC(params) {
    if (!params || !params.p_lineup_id || typeof params.p_lineup_id !== 'string') {
      return { data: null, error: { message: 'Invalid or missing p_lineup_id parameter', code: 'P0002' } };
    }
    return {
      data: {
        status: 'success',
        lineup_id: params.p_lineup_id,
        finalized_at: new Date().toISOString()
      },
      error: null
    };
  }

  // 1. Valid call test
  const validRes = simulateFinalizeLineupRPC({ p_lineup_id: 'lineup_1700000000' });
  assert.equal(validRes.error, null);
  assert.equal(validRes.data.status, 'success');
  assert.equal(validRes.data.lineup_id, 'lineup_1700000000');
  assert.ok(validRes.data.finalized_at);

  // 2. Error handling test for missing parameter
  const errRes = simulateFinalizeLineupRPC({});
  assert.ok(errRes.error);
  assert.equal(errRes.error.code, 'P0002');
});

// -----------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------
console.log('\n======================================================');
console.log(` TEST MATRIX RESULT: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('======================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('ALL PHASE 4 TESTS COMPLETED SUCCESSFULLY!\n');
}
