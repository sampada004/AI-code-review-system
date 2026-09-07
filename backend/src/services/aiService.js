/**
 * Delimiter balance validator (handles strings, template literals, and comments)
 */
function checkBalancedDelimiters(code) {
  if (!code) return true;
  const stack = [];
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let inLineComment = false;
  let inBlockComment = false;
  let isEscaped = false;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    // Handle Comments
    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
      if (inLineComment) {
        if (char === '\n' || char === '\r') inLineComment = false;
        continue;
      }
      if (inBlockComment) {
        if (char === '*' && nextChar === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }
      if (char === '/' && nextChar === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    // Handle Quotes
    if (!inLineComment && !inBlockComment) {
      if (char === "'" && !inDoubleQuote && !inTemplateLiteral) {
        inSingleQuote = !inSingleQuote;
        continue;
      }
      if (char === '"' && !inSingleQuote && !inTemplateLiteral) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }
      if (char === '`' && !inSingleQuote && !inDoubleQuote) {
        inTemplateLiteral = !inTemplateLiteral;
        continue;
      }
    }

    // Delimiter tracking outside strings and comments
    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral && !inLineComment && !inBlockComment) {
      if (char === '{' || char === '(' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) return false;
        const last = stack.pop();
        if (char === '}' && last !== '{') return false;
        if (char === ')' && last !== '(') return false;
        if (char === ']' && last !== '[') return false;
      }
    }
  }

  return stack.length === 0 && !inSingleQuote && !inDoubleQuote && !inTemplateLiteral && !inBlockComment;
}

/**
 * Detects placeholder patterns that AI models sometimes leave behind
 */
function hasPlaceholders(code) {
  if (!code) return false;
  const placeholderPatterns = [
    /\/\/\s*\.{3,}/,                          // // ...
    /\/\*\s*\.{3,}\s*\*\//,                    // /* ... */
    /\/\/\s*(existing|rest of|remaining|todo|placeholder|insert|code here)/i,
    /\/\*\s*(existing|rest of|remaining|todo|placeholder|insert|code here)/i,
    /^\s*\.{3,}\s*$/m                         // standalone ...
  ];
  return placeholderPatterns.some(pattern => pattern.test(code));
}

/**
 * Finds and aligns originalCodeSnippet with sourceCode verbatim
 */
function findAndAlignSnippet(sourceCode, originalSnippet, reportedLineNumber) {
  if (!sourceCode || !originalSnippet) {
    return { alignedSnippet: originalSnippet, lineNumber: reportedLineNumber };
  }

  // 1. Direct match
  if (sourceCode.includes(originalSnippet)) {
    const beforeText = sourceCode.substring(0, sourceCode.indexOf(originalSnippet));
    const calcLine = beforeText.split(/\r\n|\r|\n/).length;
    return { alignedSnippet: originalSnippet, lineNumber: calcLine };
  }

  // 2. Normalized newline match
  const normSource = sourceCode.replace(/\r\n/g, '\n');
  const normSnippet = originalSnippet.replace(/\r\n/g, '\n').trim();

  const idx = normSource.indexOf(normSnippet);
  if (idx !== -1) {
    const beforeText = normSource.substring(0, idx);
    const calcLine = beforeText.split('\n').length;
    const matchedSubstring = sourceCode.replace(/\r\n/g, '\n').substring(idx, idx + normSnippet.length);
    return { alignedSnippet: matchedSubstring, lineNumber: calcLine };
  }

  // 3. Fallback: Trimmed line matching
  const sourceLines = sourceCode.split(/\r\n|\r|\n/);
  const snippetLines = originalSnippet.split(/\r\n|\r|\n/).map(l => l.trim()).filter(Boolean);
  
  if (snippetLines.length > 0) {
    const firstLine = snippetLines[0];
    for (let i = 0; i < sourceLines.length; i++) {
      if (sourceLines[i].trim() === firstLine) {
        let match = true;
        for (let j = 1; j < snippetLines.length; j++) {
          if (i + j >= sourceLines.length || sourceLines[i + j].trim() !== snippetLines[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          const matchedLines = sourceLines.slice(i, i + snippetLines.length);
          return { alignedSnippet: matchedLines.join('\n'), lineNumber: i + 1 };
        }
      }
    }
  }

  return { alignedSnippet: originalSnippet, lineNumber: reportedLineNumber };
}

/**
 * Static syntax sanity verification
 */
function validateFixIntegrity(sourceCode, originalSnippet, fixedCode, fileName) {
  if (!fixedCode) return { isValid: true };

  // 1. Placeholder check
  if (hasPlaceholders(fixedCode)) {
    return { isValid: false, reason: "Fix contains placeholder comments or ellipses (...)" };
  }

  // 2. Delimiter balance check on fixedCode block
  if (!checkBalancedDelimiters(fixedCode)) {
    // Also test replacement in full source
    if (sourceCode && originalSnippet && sourceCode.includes(originalSnippet)) {
      const simulatedSource = sourceCode.replace(originalSnippet, fixedCode);
      if (!checkBalancedDelimiters(simulatedSource)) {
        return { isValid: false, reason: "Fix introduces unbalanced brackets, parentheses, or unclosed quotes" };
      }
    } else {
      return { isValid: false, reason: "Fix has unbalanced brackets, parentheses, or unclosed quotes" };
    }
  }

  // 3. Full file simulation syntax check for JS / JSON
  if (sourceCode && originalSnippet && sourceCode.includes(originalSnippet)) {
    const simulatedSource = sourceCode.replace(originalSnippet, fixedCode);

    if (fileName && fileName.endsWith('.json')) {
      try {
        JSON.parse(simulatedSource);
      } catch (e) {
        return { isValid: false, reason: `Fix creates invalid JSON syntax: ${e.message}` };
      }
    }

    if (fileName && (fileName.endsWith('.js') || fileName.endsWith('.mjs') || fileName.endsWith('.cjs'))) {
      try {
        // Test basic JS parse without executing
        new Function(`"use strict"; return (function() { \n${simulatedSource}\n });`);
      } catch (e) {
        // If the original source already had this exact syntax error (e.g. top-level imports/exports), ignore
        try {
          new Function(`"use strict"; return (function() { \n${sourceCode}\n });`);
          // Original was valid but simulated failed -> regression detected!
          return { isValid: false, reason: `Fix introduces JavaScript syntax error: ${e.message}` };
        } catch {
          // Original was an ES module or fragment, allow if delimiters are balanced
        }
      }
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes and validates findings returned by AI
 */
function sanitizeAndValidateFindings(findings, sourceCode, fileName) {
  if (!Array.isArray(findings)) return [];

  const stripMd = (str) => {
    if (!str) return str;
    let s = str.trim();
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

  const validFindings = [];

  for (const finding of findings) {
    if (!finding || (!finding.issue && !finding.recommendation)) continue;

    // Normalize keys from different LLM outputs (camelCase and snake_case)
    const rawOriginalSnippet = finding.originalCodeSnippet || finding.original_code_snippet || "";
    const rawFixedCode = finding.fixedCode || finding.fixed_code || "";
    const rawSuggestedFix = finding.suggestedFix || finding.suggested_fix || "";
    const rawLineNumber = finding.lineNumber || finding.line_number || null;

    finding.lineNumber = rawLineNumber;
    finding.suggestedFix = rawSuggestedFix;
    finding.originalCodeSnippet = stripMd(rawOriginalSnippet);
    finding.fixedCode = stripMd(rawFixedCode);

    // Also populate snake_case aliases for compatibility
    finding.original_code_snippet = finding.originalCodeSnippet;
    finding.fixed_code = finding.fixedCode;
    finding.suggested_fix = finding.suggestedFix;
    finding.line_number = finding.lineNumber;

    // Align snippet against actual source code
    if (finding.originalCodeSnippet && sourceCode) {
      const alignment = findAndAlignSnippet(sourceCode, finding.originalCodeSnippet, finding.lineNumber);
      finding.originalCodeSnippet = alignment.alignedSnippet;
      finding.original_code_snippet = alignment.alignedSnippet;
      if (alignment.lineNumber) {
        finding.lineNumber = alignment.lineNumber;
        finding.line_number = alignment.lineNumber;
      }
    }

    // Validate fixedCode against introducing regressions / syntax errors
    if (finding.fixedCode) {
      const validation = validateFixIntegrity(sourceCode, finding.originalCodeSnippet, finding.fixedCode, fileName);
      if (!validation.isValid) {
        console.warn(`[AI Fix Validation] Discarding dangerous fixedCode for finding (line ${finding.lineNumber}): ${validation.reason}`);
        // Nullify dangerous fixedCode so broken code is never applied to the user's editor
        finding.fixedCode = null;
        finding.fixed_code = null;
      }
    }

    validFindings.push(finding);
  }

  return validFindings;
}

async function analyzeCode(sourceCode, fileName, isRevalidation = false, previousFindings = null, projectContext = null) {
  const rawKey = process.env.OPENROUTER_API_KEY || "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";
  const apiKey = String(rawKey).split(/[\r\n]+/)[0].trim().replace(/^Bearer\s+/i, "");
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

SURGICAL ZERO-REGRESSION & INTEGRITY MANDATE:
1. 'fixedCode' MUST be a surgical, 100% syntactically valid drop-in replacement for 'originalCodeSnippet'.
2. NEVER rewrite untouched code, change function names, modify argument counts, or alter return types.
3. NEVER introduce unimported libraries, undeclared variables, or hallucinated APIs. Only use variables/methods already in scope.
4. ZERO PLACEHOLDER RULE: NEVER output '// ...', '/* existing code */', or ellipses (...). Every statement must be fully written out and valid.
5. DELIMITER BALANCE GUARANTEE: Verify that all brackets '{}', '[]', and parentheses '()' are 100% balanced and closed.
6. 'originalCodeSnippet' MUST match the source code character-for-character so replacement is perfectly clean.`;

  const userPrompt = `File: ${fileName}\n\nCode:\n\`\`\`\n${sourceCode}\n\`\`\``;

  const fallbackModels = [
    "minimax/minimax-m3:free",
    "minimax/minimax-m2.7:free",
    "poolside/laguna-s-2.1:free",
    "inclusionai/ling-3.0-flash-fin:free",
    "cohere/north-mini-code:free"
  ];

  let lastError = null;

  for (const modelId of fallbackModels) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "https://inspectra-frontend-sigma.vercel.app",
          "X-Title": "Inspectra AI"
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
      
      const msg = data.choices[0].message;
      let rawContent = msg?.content || msg?.reasoning || data.choices[0].text || "";
      if (typeof rawContent !== "string") {
        rawContent = JSON.stringify(rawContent);
      }
      
      try {
        if (!rawContent || rawContent.trim() === "") {
          throw new Error("AI returned empty content");
        }
        
        let content = rawContent;
        // Robust JSON extraction: find the first { and the last }
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          content = content.substring(firstBrace, lastBrace + 1);
        }
        
        const parsed = JSON.parse(content.trim());
        
        // Sanitize and validate findings against syntax regressions / hallucinations
        if (parsed.findings && Array.isArray(parsed.findings)) {
          parsed.findings = sanitizeAndValidateFindings(parsed.findings, sourceCode, fileName);
        }
        
        // Success! We found a working model and parsed & validated the response.
        return parsed;
      } catch (e) {
        console.error(`[${modelId}] Failed to parse/validate JSON response:`, rawContent?.substring ? rawContent.substring(0, 200) : rawContent);
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
  analyzeCode,
  checkBalancedDelimiters,
  hasPlaceholders,
  findAndAlignSnippet,
  validateFixIntegrity,
  sanitizeAndValidateFindings
};
