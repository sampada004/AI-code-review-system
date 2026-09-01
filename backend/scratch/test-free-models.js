require('dotenv').config();
const apiKey = process.env.OPENROUTER_API_KEY;

const candidates = [
  'minimax/minimax-m3:free',
  'minimax/minimax-m2.7:free',
  'poolside/laguna-s-2.1:free',
  'z-ai/glm-5.2:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'cohere/north-mini-code:free'
];

const sampleCode = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price;
  }
  return total;
}
`;

async function testCandidate(modelId) {
  console.log(`\n--- Testing [${modelId}] ---`);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: "You are a code reviewer. Output ONLY a valid JSON object matching: {\"summary\":\"...\",\"overallSeverity\":\"high\",\"findings\":[{\"issue\":\"...\",\"lineNumber\":3,\"severity\":\"high\",\"recommendation\":\"...\",\"originalCodeSnippet\":\"...\",\"fixedCode\":\"...\"}]}" },
          { role: "user", content: "Review this code:\n" + sampleCode }
        ]
      })
    });
    
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    if (!res.ok) {
      console.log('Error:', data.error?.message || data);
      return;
    }
    const msg = data.choices?.[0]?.message;
    const content = msg?.content || msg?.reasoning || "";
    console.log('Content snippet:', (content || "").substring(0, 150));
    const firstBrace = (content || "").indexOf('{');
    const lastBrace = (content || "").lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const parsed = JSON.parse(content.substring(firstBrace, lastBrace + 1));
      console.log('SUCCESS! Parsed JSON findings count:', parsed.findings?.length);
    } else {
      console.log('Failed to locate JSON braces');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function main() {
  for (const m of candidates) {
    await testCandidate(m);
  }
}

main();

