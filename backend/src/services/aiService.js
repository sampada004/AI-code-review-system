async function analyzeCode(sourceCode, fileName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing from environment variables.");
  }

  const systemPrompt = `You are an expert AI code reviewer. Your task is to analyze the provided source code for bugs, security vulnerabilities, performance issues, code smells, and best practice violations.

You MUST respond with a strict JSON object matching the following structure exactly. Do not include markdown formatting or extra text outside the JSON object.

{
  "summary": "A brief overall summary of the code quality and any major issues found.",
  "overallSeverity": "high" | "medium" | "low" | "none",
  "findings": [
    {
      "severity": "high" | "medium" | "low",
      "lineNumber": 12,
      "issue": "Description of the issue.",
      "recommendation": "How to fix the issue.",
      "originalCodeSnippet": "The exact lines of original code that contain the issue.",
      "suggestedFix": "The exact replacement code that fixes the issue."
    }
  ]
}

If no issues are found, return an empty array for findings and 'none' for overallSeverity.`;

  const userPrompt = `File: ${fileName}\n\nCode:\n\`\`\`\n${sourceCode}\n\`\`\``;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Code Review System"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Fast, highly capable, and cheap model
        response_format: { type: "json_object" },
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter API Error:", text);
      throw new Error(`AI API failed with status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (e) {
      console.error("Failed to parse JSON response from AI:", content);
      throw new Error("Failed to parse structured response from AI.");
    }
  } catch (err) {
    console.error("Error calling OpenRouter:", err.message);
    throw new Error("AI Code Review failed: " + err.message);
  }
}

module.exports = {
  analyzeCode
};
