const {
  checkBalancedDelimiters,
  hasPlaceholders,
  findAndAlignSnippet,
  validateFixIntegrity,
  sanitizeAndValidateFindings
} = require('../src/services/aiService');

console.log("=== RUNNING FIX VALIDATION GUARDRAIL TESTS ===\n");

// 1. Delimiter balance tests
console.log("1. Testing Delimiter Balance Validator:");
const validCode1 = "function foo() { if (true) { return [1, 2, 3]; } }";
const invalidCode1 = "function foo() { if (true) { return [1, 2, 3]; }"; // missing }
const invalidCode2 = "function foo() { return (x + y; }"; // mismatched delimiter
const quoteIgnored = "function foo() { const msg = 'Unclosed ( bracket in string'; return msg; }";

console.log("  validCode1:", checkBalancedDelimiters(validCode1) === true ? "PASS" : "FAIL");
console.log("  invalidCode1:", checkBalancedDelimiters(invalidCode1) === false ? "PASS" : "FAIL");
console.log("  invalidCode2:", checkBalancedDelimiters(invalidCode2) === false ? "PASS" : "FAIL");
console.log("  quoteIgnored:", checkBalancedDelimiters(quoteIgnored) === true ? "PASS" : "FAIL");

// 2. Placeholder checks
console.log("\n2. Testing Placeholder Detection:");
const cleanCode = "const result = calculate(a, b);";
const placeholderCode1 = "const result = calculate(a, b);\n// ... rest of code";
const placeholderCode2 = "function test() {\n  ...\n}";
const placeholderCode3 = "/* TODO: insert existing code */";

console.log("  cleanCode:", hasPlaceholders(cleanCode) === false ? "PASS" : "FAIL");
console.log("  placeholderCode1:", hasPlaceholders(placeholderCode1) === true ? "PASS" : "FAIL");
console.log("  placeholderCode2:", hasPlaceholders(placeholderCode2) === true ? "PASS" : "FAIL");
console.log("  placeholderCode3:", hasPlaceholders(placeholderCode3) === true ? "PASS" : "FAIL");

// 3. Snippet alignment
console.log("\n3. Testing Snippet Alignment:");
const fullFile = `// Header
function calculate(price, qty) {
  var total = price * qty;
  return total;
}
`;
const snippet = "var total = price * qty;";
const aligned = findAndAlignSnippet(fullFile, snippet, 1);
console.log("  Snippet found on line:", aligned.lineNumber, "(Expected line 3)");
console.log("  Alignment check:", aligned.lineNumber === 3 ? "PASS" : "FAIL");

// 4. Fix Integrity validation
console.log("\n4. Testing Fix Integrity Validation:");
const validFix = "const total = price * qty;";
const val1 = validateFixIntegrity(fullFile, snippet, validFix, "app.js");
console.log("  Valid fix passes validation:", val1.isValid === true ? "PASS" : "FAIL");

const placeholderFix = "const total = price * qty;\n// ...";
const val2 = validateFixIntegrity(fullFile, snippet, placeholderFix, "app.js");
console.log("  Placeholder fix rejected:", val2.isValid === false ? "PASS" : "FAIL");

// 5. Findings Sanitization
console.log("\n5. Testing Findings Sanitization:");
const mockFindings = [
  {
    lineNumber: 1,
    issue: "Use const instead of var",
    recommendation: "Replace var with const",
    originalCodeSnippet: "```js\nvar total = price * qty;\n```",
    fixedCode: "```js\nconst total = price * qty;\n```"
  },
  {
    lineNumber: 2,
    issue: "Broken fix test",
    recommendation: "Fix something",
    originalCodeSnippet: "return total;",
    fixedCode: "return total; \n// ... existing code"
  }
];

const sanitized = sanitizeAndValidateFindings(mockFindings, fullFile, "app.js");
console.log("  Sanitized count:", sanitized.length);
console.log("  First finding backticks stripped:", sanitized[0].fixedCode === "const total = price * qty;" ? "PASS" : "FAIL");
console.log("  Second finding dangerous fixedCode nullified:", sanitized[1].fixedCode === null ? "PASS" : "FAIL");

console.log("\n=== ALL UNIT TESTS COMPLETED! ===");
