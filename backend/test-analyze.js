async function runTest() {
  try {
    console.log("Sending request to backend...");
    const res = await fetch("http://localhost:5000/api/reviews/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceCode: "function hello() { return 'world'; }",
        fileName: "test.js"
      })
    });
    
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();
