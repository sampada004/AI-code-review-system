require("dotenv").config({ path: __dirname + "/.env" });
const { analyzeCode } = require("./src/services/aiService.js");
analyzeCode("function test() { console.log('hello'); }", "test.js")
  .then(console.log)
  .catch(console.error);
