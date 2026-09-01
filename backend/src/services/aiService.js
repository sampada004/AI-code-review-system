async function analyzeCode(sourceCode, fileName, isRevalidation = false, previousFindings = null, projectContext = null) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing from environment variables.");
  }

  const systemPrompt = `You are a strict JSON-only API. You must NOT output ANY conversational text, reasoning, line counting, or chain-of-thought. Your response must begin IMMEDIATELY with the character '{' and end with '}'. Failure to do so will crash the system.

You are a senior principal engineer and security auditor. Your task is to perform an ACTIONABLE, CRITICAL-ONLY code review of the provided source code.

STRICT SCOPE & ZERO-NITPICK RULE:
- Focus ONLY on critical bugs, code-crashing errors, security vulnerabilities, memory leaks, unhandled exceptions, null/undefined crashes, and compilation/syntax failures.
- DO NOT report minor stylistic opinions, formatting preferences, variable naming nitpicks, or optional refactoring suggestions.
- If the code is syntactically sound and has no critical bugs, return an empty findings array [] and set overallSeverity to "none".

CRITICAL FIRST STEP - COMPILER CHECK:
Scan the code for:
1. Syntax errors, missing commas, missing brackets '{}', parentheses '()', or unclosed strings/template literals.
2. Undeclared variables, undefined references, or type mismatches.
Report any syntax or compilation errors immediately as HIGH severity issues.

Response Structure:
You MUST respond with a strict JSON object matching the following structure exactly:

{
  "summary": "A concise summary of critical findings or confirmation that code is clean.",
  "overallSeverity": "high" | "medium" | "low" | "none",
  "findings": [
    {
      "severity": "high" | "medium" | "low",
      "lineNumber": 12, // Starting line number of originalCodeSnippet
      "issue": "Description of the critical bug.",
      "recommendation": "How to resolve the issue.",
      "originalCodeSnippet": "The EXACT, verbatim lines of original code to be replaced. DO NOT wrap in markdown backticks. MUST NOT contain placeholders or ellipses (...).",
      "suggestedFix": "A brief explanation of the fix.",
      "fixedCode": "The EXACT, 100% syntactically complete replacement code block. DO NOT wrap in markdown backticks. MUST NOT contain placeholders like '// existing code'. CRITICAL: This MUST be a perfectly valid, compilable drop-in replacement."
    }
  ]
}

${isRevalidation 
  ? `CRITICAL REVALIDATION INSTRUCTIONS:
This is a RE-VALIDATION pass. The developer has applied fixes based on your previous review.
Previous findings:
${previousFindings ? JSON.stringify(previousFindings.map(f => ({ issue: f.issue, recommendation: f.recommendation }))) : "None"}

Your task:
1. Verify if the previous critical issues have been fixed.
2. Check if recent changes introduced ANY genuine code-crashing bugs.
3. If fixed and no new critical bugs exist, YOU MUST return findings: [] and set overallSeverity: "none".
4. STRICT RULE: DO NOT report pre-existing minor issues or introduce new stylistic nitpicks!`
  : "Identify all distinct critical bugs and security vulnerabilities. Return an empty findings array [] if no critical bugs exist."}

SYNTAX & ACCURACY GUARANTEES:
1. 'fixedCode' MUST be a 100% syntactically valid drop-in replacement for 'originalCodeSnippet'.
2. You MUST NOT introduce new syntax errors (missing braces, unclosed quotes, broken parentheses, or missing imports).
3. Verify that all brackets, braces, and parentheses are perfectly balanced before outputting 'fixedCode'.
4. NEVER output placeholders or ellipses (...). Always output the full, compilable replacement block.`;

  const userPrompt = `File: ${fileName}\n\nCode:\n\`\`\`\n${sourceCode}\n\`\`\``;

  const fallbackModels = [
    "cohere/north-mini-code:free",
    "minimax/minimax-m3:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "minimax/minimax-m2.7:free",
    "inclusionai/ling-3.0-flash-fin:free"
  ];

  let lastError = null;

  for (const modelId of fallbackModels) {
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
          model: modelId,
          max_tokens: 4000,
          temperature: 0.1, // Low temperature for high deterministic accuracy
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[${modelId}] API Error:`, text);
        lastError = new Error(`AI API failed with status: ${response.status}`);
        continue; // Try next model
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        console.error(`[${modelId}] returned unexpected data format:`, data);
        lastError = new Error(data.error?.message || "Unexpected response format from AI provider.");
        continue; // Try next model
      }
      
      let content = data.choices[0].message.content;
      
      try {
        if (!content) {
          throw new Error("AI returned empty content");
        }
        
        // Robust JSON extraction: find the first { and the last }
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          content = content.substring(firstBrace, lastBrace + 1);
        }
        
        const parsed = JSON.parse(content.trim());
        
        // Sanitize markdown blocks if the AI stubbornly included them
        if (parsed.findings && Array.isArray(parsed.findings)) {
          parsed.findings.forEach(finding => {
            const stripMd = (str) => {
              if (!str) return str;
              let s = str;
              if (s.startsWith('```')) {
                const nl = s.indexOf('\n');
                if (nl !== -1) s = s.substring(nl + 1);
              }
              if (s.endsWith('```')) {
                s = s.substring(0, s.length - 3);
                if (s.endsWith('\n')) s = s.substring(0, s.length - 1);
                if (s.endsWith('\r')) s = s.substring(0, s.length - 1);
              }
              return s;
            };
            finding.fixedCode = stripMd(finding.fixedCode);
            finding.originalCodeSnippet = stripMd(finding.originalCodeSnippet);
          });
        }
        
        // Success! We found a working model and parsed the JSON perfectly.
        return parsed;
      } catch (e) {
        console.error(`[${modelId}] Failed to parse JSON response:`, content);
        lastError = new Error("Failed to parse structured response from AI.");
        continue; // Try next model
      }
    } catch (err) {
      console.error(`[${modelId}] Network/Execution Error:`, err.message);
      lastError = err;
    }
  }

  // If we exhaust all models in the fallback array, throw the final error
  throw new Error("AI Code Review failed after trying all fallback models: " + (lastError?.message || "Unknown error"));
}

module.exports = {
  analyzeCode
};

