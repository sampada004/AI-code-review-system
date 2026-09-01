require('dotenv').config();
const { analyzeCode } = require('../src/services/aiService');

const sampleCode = `
function calculateTotal(price, quantity) {
  var total = price * quantity;
  return total;
}
`;

async function testFull() {
  try {
    console.log("Running analyzeCode test with updated free models...");
    const result = await analyzeCode(sampleCode, "test.js");
    console.log("Result summary:", result.summary);
    console.log("Result findings count:", result.findings ? result.findings.length : 0);
    console.log("TEST SUCCESSFUL!");
  } catch (err) {
    console.error("TEST FAILED:", err.message);
  }
}

testFull();
