const apiKey = "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";

async function runTest() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: "Test message" }]
      })
    });
    
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Body:", text);
  } catch (err) {
    console.error(err);
  }
}
runTest();
