async function analyzeCode(sourceCode, fileName, isRevalidation = false, previousFindings = null, projectContext = null) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing from environment variables.");
  }

  const systemPrompt = `You are a strict JSON-only API. You must NOT output ANY conversational text, reasoning, or chain-of-thought before the JSON. Your response must begin IMMEDIATELY with the character '{' and end with '}'. Failure to do so will crash the system.

You are an expert AI code reviewer. Your task is to analyze the provided source code for bugs, security vulnerabilities, performance issues, code smells, and best practice violations.

CRITICAL FIRST STEP - ACT AS A COMPILER: Before looking for stylistic issues, you MUST act as a strict compiler/linter. Scan the code meticulously for:
- Missing commas, semicolons, brackets '{}', or parentheses '()'.
- Unclosed strings or template literals.
- Undeclared variables, undefined references, or syntax errors.
If you find ANY syntax or compilation errors, report them immediately as HIGH severity issues.

Write your explanations in plain, easy-to-understand English. Avoid overly dense technical jargon where possible. Explain concepts clearly so that even junior developers can easily understand the issue and the solution.

You MUST respond with a strict JSON object matching the following structure exactly. Output ONLY the raw JSON object.
IMPORTANT: Ensure all strings within your JSON are properly escaped (e.g., escape backslashes as \\\\ and double quotes as \\"). The JSON MUST be perfectly valid and parsable.

{
  "summary": "A brief overall summary of the code quality and any major issues found.",
  "overallSeverity": "high" | "medium" | "low" | "none",
  "findings": [
    {
      "severity": "high" | "medium" | "low",
      "lineNumber": 12, // This MUST be the STARTING line number of the problematic snippet
      "issue": "Description of the issue.",
      "recommendation": "How to fix the issue.",
      "originalCodeSnippet": "The EXACT, verbatim lines of original code to be replaced. DO NOT wrap in markdown backticks. MUST NOT contain placeholders or ellipses (...). CRITICAL: Provide the exact minimal contiguous block of lines needed. Include 1-2 lines of surrounding context if necessary to make it unique, but DO NOT output the entire function.",
      "suggestedFix": "A brief explanation of the code changes being made.",
      "fixedCode": "The EXACT, complete replacement code. DO NOT wrap in markdown backticks. MUST NOT contain placeholders or comments like '// existing code'. CRITICAL: This must be a perfectly syntactically valid drop-in replacement for the originalCodeSnippet."
    }
  ]
}

${isRevalidation 
  ? `CRITICAL REVALIDATION INSTRUCTIONS:
This is a RE-VALIDATION pass. The developer has just applied fixes to this code based on your previous review.
Your previous review found these issues:
${previousFindings ? JSON.stringify(previousFindings.map(f => ({ issue: f.issue, recommendation: f.recommendation }))) : "None"}

Your task is ONLY to:
1. Check if the previous issues have been successfully fixed.
2. Check if the developer's recent changes introduced any NEW severe bugs (regressions).
3. CRITICAL: If an issue is NOT fixed, or if a NEW bug is found, you MUST provide the complete 'originalCodeSnippet' and 'fixedCode' exactly as requested in the JSON schema so the developer can apply the fix.

DO NOT report any pre-existing minor or stylistic issues that you did not mention in your previous review. If the code is fixed and no new bugs were introduced, return an empty findings array!`
  : "CRITICAL: You must identify and return MULTIPLE distinct issues if they exist in the code. Do not stop at just one issue. Find all critical bugs, vulnerabilities, performance issues, and bad practices. Ensure you return a comprehensive findings array containing every issue."}

CONSISTENCY RULES:
1. If you mention an issue, flaw, or required improvement in the summary, you MUST include it as a specific finding in the findings array.
2. Do not mention issues in the summary without providing a corresponding fix in the findings.
3. If no actionable issues are found, return an empty array for findings, set overallSeverity to 'none', and ensure the summary explicitly states that the code looks good and no issues were found. Do not add warnings or caveats to the summary if the findings array is empty.

${projectContext ? `PROJECT CONTEXT / TECH STACK:
The developer has provided the following context for this project:
${JSON.stringify(projectContext, null, 2)}
Please prioritize these technologies and frameworks when making suggestions or identifying issues. Do not enforce them exclusively, but use this to avoid suggesting completely unrelated stacks (e.g. suggesting MongoDB when the project uses MySQL).` : ""}`;

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
        model: "nvidia/nemotron-3-super-120b-a12b:free", // Use 120b model to avoid rate limiting and get highly detailed multiple findings
        max_tokens: 8000,
        response_format: { type: "json_object" }, // Enforce strict JSON output to prevent parse errors from rambling text
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
    
    if (!data.choices || !data.choices[0]) {
      console.error("OpenRouter API returned unexpected data format:", data);
      throw new Error(data.error?.message || "Unexpected response format from AI provider.");
    }
    
    let content = data.choices[0].message.content;
    
    try {
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
