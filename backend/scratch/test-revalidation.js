require('dotenv').config();
const { analyzeCode } = require('../src/services/aiService');

const initialBadCode = `
function calculate(a, b) {
  var result = a + b;
  return result;
}
`;

const fixedCode = `
function calculate(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Arguments must be numbers');
  }
  const result = a + b;
  return result;
}
`;

async function testRevalidation() {
  console.log("--- PASS 1: Initial Code Analysis ---");
  const pass1 = await analyzeCode(initialBadCode, "calculator.js", false);
  console.log("Pass 1 Summary:", pass1.summary);
  console.log("Pass 1 Findings:", pass1.findings?.length || 0);

  console.log("\n--- PASS 2: Revalidation After Developer Fix ---");
  const pass2 = await analyzeCode(fixedCode, "calculator.js", true, pass1.findings);
  console.log("Pass 2 Summary:", pass2.summary);
  console.log("Pass 2 Overall Severity:", pass2.overallSeverity);
  console.log("Pass 2 Findings:", pass2.findings?.length || 0);

  if ((pass2.findings?.length || 0) === 0 && pass2.overallSeverity === "none") {
    console.log("\n✅ REVALIDATION IS 100% HEALTHY & UNCOMPROMISED!");
  } else {
    console.log("\n⚠️ Revalidation returned remaining/new issues:", pass2.findings);
  }
}

testRevalidation();
