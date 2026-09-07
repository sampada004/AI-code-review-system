require('dotenv').config();
const { analyzeCode, validateFixIntegrity, checkBalancedDelimiters } = require('../src/services/aiService');

const testCases = [
  {
    name: "Clean Code (False Positive Test)",
    filename: "userService.js",
    code: `
function getUserDisplayName(user) {
  if (!user || typeof user !== 'object') {
    return 'Guest';
  }
  return user.name || user.username || 'Anonymous';
}

module.exports = { getUserDisplayName };
    `,
    expectedIssues: 0
  },
  {
    name: "Off-by-One Loop Bug & Null Crash",
    filename: "cartCalculator.js",
    code: `
function calculateCartTotal(cartItems) {
  let total = 0;
  for (let i = 0; i <= cartItems.length; i++) {
    total += cartItems[i].price * cartItems[i].quantity;
  }
  return total;
}
    `,
    expectedIssues: 1
  },
  {
    name: "SQL Injection Vulnerability",
    filename: "authController.js",
    code: `
async function getUserByEmail(req, res) {
  const email = req.query.email;
  const query = "SELECT * FROM users WHERE email = '" + email + "'";
  const result = await db.query(query);
  res.json(result);
}
    `,
    expectedIssues: 1
  }
];

async function runBenchmark() {
  console.log("==================================================");
  console.log("   INSPECTRA AI - MODEL EFFICIENCY BENCHMARK");
  console.log("==================================================");

  let totalLatency = 0;
  let passedTests = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n[Test ${i + 1}/${testCases.length}] Testing: "${tc.name}" (${tc.filename})`);
    
    const startTime = Date.now();
    try {
      const result = await analyzeCode(tc.code, tc.filename);
      const duration = Date.now() - startTime;
      totalLatency += duration;

      console.log(`  ⏱ Latency: ${duration} ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`  📊 Overall Severity: ${result.overallSeverity}`);
      console.log(`  📋 Summary: "${result.summary?.substring(0, 100)}..."`);
      console.log(`  🔍 Findings Count: ${result.findings ? result.findings.length : 0}`);

      let fixIntegrityPass = true;

      if (result.findings && result.findings.length > 0) {
        for (const finding of result.findings) {
          console.log(`     - [${finding.severity?.toUpperCase()}] Line ${finding.lineNumber}: ${finding.issue}`);
          if (finding.originalCodeSnippet && finding.fixedCode) {
            const hasSnippetInSource = tc.code.includes(finding.originalCodeSnippet);
            const delimitersOk = checkBalancedDelimiters(finding.fixedCode);
            const integrity = validateFixIntegrity(tc.code, finding.originalCodeSnippet, finding.fixedCode, tc.filename);

            console.log(`       * Snippet Match in Source: ${hasSnippetInSource ? '✓ VERBATIM' : '⚠ Partial/Normalized'}`);
            console.log(`       * Balanced Delimiters: ${delimitersOk ? '✓ BALANCED' : '✗ UNBALANCED'}`);
            console.log(`       * Syntax Integrity: ${integrity.isValid ? '✓ VALID' : '✗ INVALID (' + integrity.reason + ')'}`);

            if (!integrity.isValid) {
              fixIntegrityPass = false;
            }
          }
        }
      }

      const countCheck = (tc.expectedIssues === 0 && (!result.findings || result.findings.length === 0)) ||
                         (tc.expectedIssues > 0 && result.findings && result.findings.length > 0);

      if (countCheck && fixIntegrityPass) {
        console.log(`  ✅ RESULT: PASSED (Accurate detection & valid fixes)`);
        passedTests++;
      } else {
        console.log(`  ⚠️ RESULT: Review expectations not fully met.`);
      }

    } catch (err) {
      console.error(`  ❌ Failed execution:`, err.message);
    }
  }

  console.log("\n==================================================");
  console.log("                BENCHMARK SUMMARY");
  console.log("==================================================");
  console.log(`Total Tests Run:    ${testCases.length}`);
  console.log(`Tests Passed:       ${passedTests}/${testCases.length} (${((passedTests / testCases.length) * 100).toFixed(0)}%)`);
  console.log(`Average Latency:    ${(totalLatency / testCases.length).toFixed(0)} ms (~${(totalLatency / testCases.length / 1000).toFixed(2)}s per file)`);
  console.log("==================================================\n");
}

runBenchmark();
