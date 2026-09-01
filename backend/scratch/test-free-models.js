require('dotenv').config();
const apiKey = process.env.OPENROUTER_API_KEY;

const freeModels = [
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'cohere/north-mini-code:free',
  'google/gemma-4-26b-a4b-it:free',
  'minimax/minimax-m2.7:free'
];

async function testModel(modelId) {
  console.log(`Testing [${modelId}]...`);
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
          { role: "user", content: "Return a JSON object {\"status\": \"ok\"}" }
        ]
      })
    });
    console.log(`[${modelId}] status: ${res.status}`);
    const data = await res.json();
    if (res.ok) {
      console.log(`[${modelId}] response snippet:`, JSON.stringify(data.choices?.[0]?.message?.content).substring(0, 100));
    } else {
      console.log(`[${modelId}] error:`, data);
    }
  } catch (err) {
    console.error(`[${modelId}] failed:`, err.message);
  }
}

async function main() {
  for (const m of freeModels) {
    await testModel(m);
  }
}

main();
