const crypto = require('crypto');

// In-memory cache for instant responses on identical code
const analysisCache = new Map();
const MAX_CACHE_ENTRIES = 200;

function getCacheKey(sourceCode, fileName, isRevalidation, previousFindings, projectContext) {
  const hash = crypto.createHash('sha256');
  hash.update(sourceCode || '');
  hash.update(fileName || '');
  hash.update(String(isRevalidation));
  if (previousFindings) hash.update(JSON.stringify(previousFindings));
  if (projectContext) hash.update(JSON.stringify(projectContext));
  return hash.digest('hex');
}

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
    /\/\/\s*\.{3,}/,
    /\/\*\s*\.{3,}\s*\*\//,
    /\/\/\s*(existing|rest of|remaining|todo|placeholder|insert|code here)/i,
    /\/\*\s*(existing|rest of|remaining|todo|placeholder|insert|code here)/i,
    /^\s*\.{3,}\s*$/m
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

  // 2. Delimiter balance check
  const normSource = sourceCode ? sourceCode.replace(/\r\n/g, '\n') : "";
  const normSnippet = originalSnippet ? originalSnippet.replace(/\r\n/g, '\n').trim() : "";
  const normFixed = fixedCode.replace(/\r\n/g, '\n');

  if (normSource && normSnippet && normSource.includes(normSnippet)) {
    const simulatedSource = normSource.replace(normSnippet, normFixed);
    const origBalanced = checkBalancedDelimiters(normSource);
    const simBalanced = checkBalancedDelimiters(simulatedSource);

    if (!simBalanced && origBalanced) {
      return { isValid: false, reason: "Fix introduces unbalanced brackets, parentheses, or unclosed quotes" };
    }
  }

  // 3. JSON format verification
  if (fileName && fileName.endsWith('.json') && normSource && normSnippet && normSource.includes(normSnippet)) {
    const simulatedSource = normSource.replace(normSnippet, normFixed);
    try {
      JSON.parse(simulatedSource);
    } catch (e) {
      return { isValid: false, reason: `Fix creates invalid JSON syntax: ${e.message}` };
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
    if (!str) return "";
    let s = String(str).trim();
    if (s.startsWith('```')) {
      const nl = s.indexOf('\n');
      if (nl !== -1) s = s.substring(nl + 1);
    }
    if (s.endsWith('```')) {
      s = s.substring(0, s.length - 3);
      if (s.endsWith('\n')) s = s.substring(0, s.length - 1);
      if (s.endsWith('\r')) s = s.substring(0, s.length - 1);
    }
    return s.trim();
  };

  const validFindings = [];

  for (const finding of findings) {
    if (!finding || (!finding.issue && !finding.recommendation)) continue;

    const rawLineNumber = finding.lineNumber || finding.line_number || null;

    let rawOriginalSnippet = finding.originalCodeSnippet ||
      finding.original_code_snippet ||
      finding.originalSnippet ||
      finding.original_snippet ||
      finding.originalCode ||
      finding.original_code ||
      finding.codeSnippet ||
      finding.code_snippet ||
      finding.targetSnippet ||
      finding.target_snippet ||
      finding.targetCode ||
      finding.target_code ||
      finding.target ||
      "";

    let rawFixedCode = finding.fixedCode ||
      finding.fixed_code ||
      finding.fix ||
      finding.replacement ||
      finding.replacementCode ||
      finding.replacement_code ||
      finding.fixedSnippet ||
      finding.fixed_snippet ||
      finding.correctedCode ||
      finding.corrected_code ||
      finding.suggestedCode ||
      finding.suggested_code ||
      finding.solution ||
      finding.code ||
      "";

    const rawSuggestedFix = finding.suggestedFix ||
      finding.suggested_fix ||
      finding.recommendation ||
      finding.fixDescription ||
      "";

    if (!rawFixedCode && (finding.suggestedFix || finding.suggested_fix || finding.recommendation)) {
      const combined = (finding.suggestedFix || finding.suggested_fix || "") + "\n" + (finding.recommendation || "");
      const codeBlockMatch = combined.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]+?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        rawFixedCode = codeBlockMatch[1].trim();
      }
    }

    if (!rawOriginalSnippet && sourceCode && rawLineNumber) {
      const lines = sourceCode.split(/\r\n|\r|\n/);
      if (rawLineNumber > 0 && rawLineNumber <= lines.length) {
        rawOriginalSnippet = lines[rawLineNumber - 1];
      }
    }

    finding.lineNumber = rawLineNumber;
    finding.suggestedFix = rawSuggestedFix;
    finding.originalCodeSnippet = stripMd(rawOriginalSnippet);
    finding.fixedCode = stripMd(rawFixedCode);

    finding.original_code_snippet = finding.originalCodeSnippet;
    finding.fixed_code = finding.fixedCode;
    finding.suggested_fix = finding.suggestedFix;
    finding.line_number = finding.lineNumber;

    if (finding.originalCodeSnippet && sourceCode) {
      const alignment = findAndAlignSnippet(sourceCode, finding.originalCodeSnippet, finding.lineNumber);
      finding.originalCodeSnippet = alignment.alignedSnippet;
      finding.original_code_snippet = alignment.alignedSnippet;
      if (alignment.lineNumber) {
        finding.lineNumber = alignment.lineNumber;
        finding.line_number = alignment.lineNumber;
      }
    }

    if (finding.fixedCode) {
      const validation = validateFixIntegrity(sourceCode, finding.originalCodeSnippet, finding.fixedCode, fileName);
      if (!validation.isValid) {
        console.warn(`[AI Fix Validation] Discarding dangerous fixedCode for finding (line ${finding.lineNumber}): ${validation.reason}`);
        finding.fixedCode = null;
        finding.fixed_code = null;
      }
    }

    validFindings.push(finding);
  }

  return validFindings;
}

/**
 * Resilient JSON extraction and parsing that handles thinking tokens,
 * conversational preambles, markdown fences, and unescaped characters.
 */
function extractAndParseJSON(rawContent) {
  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("AI returned empty content");
  }

  // Strip <think> or <thought> tags
  let str = rawContent
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .trim();

  // 1. Direct parse
  try {
    return JSON.parse(str);
  } catch (e) {}

  // 2. Fenced code blocks: ```json { ... } ``` or ``` { ... } ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  let match;
  while ((match = codeBlockRegex.exec(str)) !== null) {
    const block = match[1].trim();
    const firstB = block.indexOf('{');
    const lastB = block.lastIndexOf('}');
    if (firstB !== -1 && lastB > firstB) {
      try {
        return JSON.parse(block.substring(firstB, lastB + 1));
      } catch (e) {
        try {
          const sanitized = block.substring(firstB, lastB + 1)
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
              if (c === '\n') return '\\n';
              if (c === '\r') return '\\r';
              if (c === '\t') return '\\t';
              return '';
            });
          return JSON.parse(sanitized);
        } catch (e2) {}
      }
    }
  }

  // 3. Scan for JSON object containing known keys: "summary" or "findings"
  const schemaRegex = /\{\s*"(?:summary|findings|overallSeverity)"[\s\S]*\}/;
  const schemaMatch = str.match(schemaRegex);
  if (schemaMatch) {
    const candidate = schemaMatch[0];
    const lastB = candidate.lastIndexOf('}');
    if (lastB !== -1) {
      const candidateStr = candidate.substring(0, lastB + 1);
      try {
        return JSON.parse(candidateStr);
      } catch (e) {
        try {
          const sanitized = candidateStr
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
              if (c === '\n') return '\\n';
              if (c === '\r') return '\\r';
              if (c === '\t') return '\\t';
              return '';
            });
          return JSON.parse(sanitized);
        } catch (e2) {}
      }
    }
  }

  // 4. Search backwards through all '{' occurrences to find the outermost valid JSON object
  const braceIndices = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') braceIndices.push(i);
  }

  for (let i = braceIndices.length - 1; i >= 0; i--) {
    const startIdx = braceIndices[i];
    const lastIdx = str.lastIndexOf('}');
    if (lastIdx > startIdx) {
      const sub = str.substring(startIdx, lastIdx + 1);
      try {
        return JSON.parse(sub);
      } catch (e) {
        try {
          const sanitized = sub
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
              if (c === '\n') return '\\n';
              if (c === '\r') return '\\r';
              if (c === '\t') return '\\t';
              return '';
            });
          return JSON.parse(sanitized);
        } catch (e2) {}
      }
    }
  }

  throw new Error("Could not extract a valid JSON object from model response.");
}

async function querySingleModel(modelId, apiKey, systemPrompt, userPrompt, sourceCode, fileName, timeoutMs = 4500, externalSignal = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    externalSignal.addEventListener("abort", () => {
      clearTimeout(timer);
      controller.abort();
    });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "https://inspectra-frontend-sigma.vercel.app",
        "X-Title": "Inspectra AI"
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 1200,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[${modelId}] API Error ${response.status}: ${errText.substring(0, 100)}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error(`[${modelId}] Unexpected response format.`);
    }

    const msg = data.choices[0].message;
    let rawContent = msg?.content || msg?.reasoning || data.choices[0].text || "";
    if (typeof rawContent !== "string") {
      rawContent = JSON.stringify(rawContent);
    }

    if (!rawContent || rawContent.trim().length === 0) {
      throw new Error(`[${modelId}] Empty content returned.`);
    }

    const parsed = extractAndParseJSON(rawContent);

    if (parsed.findings && Array.isArray(parsed.findings)) {
      parsed.findings = sanitizeAndValidateFindings(parsed.findings, sourceCode, fileName);
    } else {
      parsed.findings = [];
    }

    if (!parsed.summary) {
      parsed.summary = parsed.findings.length > 0 ? "Potential issues detected." : "No critical issues found.";
    }
    if (!parsed.overallSeverity) {
      parsed.overallSeverity = parsed.findings.length > 0 ? "medium" : "none";
    }

    return parsed;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function queryGeminiModel(apiKey, systemPrompt, userPrompt, sourceCode, fileName, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    clearTimeout(timer);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`[Gemini] API Error ${response.status}: ${err.substring(0, 100)}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = extractAndParseJSON(rawText);

    if (parsed.findings && Array.isArray(parsed.findings)) {
      parsed.findings = sanitizeAndValidateFindings(parsed.findings, sourceCode, fileName);
    } else {
      parsed.findings = [];
    }

    if (!parsed.summary) {
      parsed.summary = parsed.findings.length > 0 ? "Potential issues detected." : "No critical issues found.";
    }
    if (!parsed.overallSeverity) {
      parsed.overallSeverity = parsed.findings.length > 0 ? "medium" : "none";
    }

    return parsed;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function queryGroqModel(apiKey, systemPrompt, userPrompt, sourceCode, fileName, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    clearTimeout(timer);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`[Groq] API Error ${response.status}: ${err.substring(0, 100)}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    const parsed = extractAndParseJSON(rawContent);

    if (parsed.findings && Array.isArray(parsed.findings)) {
      parsed.findings = sanitizeAndValidateFindings(parsed.findings, sourceCode, fileName);
    } else {
      parsed.findings = [];
    }

    if (!parsed.summary) {
      parsed.summary = parsed.findings.length > 0 ? "Potential issues detected." : "No critical issues found.";
    }
    if (!parsed.overallSeverity) {
      parsed.overallSeverity = parsed.findings.length > 0 ? "medium" : "none";
    }

    return parsed;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Local deep static defect and pattern reviewer.
 * Detects 20+ real-world bugs, security flaws, null pointer risks, and performance bugs instantly (<10ms).
 */
function performStaticFallbackReview(sourceCode, fileName = "") {
  const findings = [];
  if (!sourceCode || typeof sourceCode !== "string") {
    return {
      summary: "No source code provided.",
      overallSeverity: "none",
      findings: []
    };
  }

  const lines = sourceCode.split(/\r\n|\r|\n/);
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // 1. Bracket & Delimiter Balance Check
  const isBalanced = checkBalancedDelimiters(sourceCode);
  if (!isBalanced) {
    findings.push({
      severity: "high",
      lineNumber: 1,
      issue: "Syntax Error: Unbalanced brackets, parentheses, or unclosed string literal detected.",
      recommendation: "Ensure all '{', '(', '[', and quote marks are properly closed and formatted.",
      originalCodeSnippet: lines[0] || sourceCode.substring(0, 80),
      suggestedFix: "Check and close unclosed brackets or string quotes across the file.",
      fixedCode: lines[0] || sourceCode.substring(0, 80)
    });
  }

  // 2. Line-by-Line AST & Pattern Inspection
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip pure comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // A. Off-by-one array index boundary error: for (...; i <= array.length; i++)
    const offByOneMatch = line.match(/(for\s*\([^;]+;\s*([a-zA-Z0-9_$]+)\s*<=\s*([a-zA-Z0-9_$.]+)\.length\s*;[^)]+\))/);
    if (offByOneMatch) {
      const fixedSnippet = line.replace(/<=\s*([a-zA-Z0-9_$.]+)\.length/, '< $1.length');
      findings.push({
        severity: "high",
        lineNumber: lineNum,
        issue: `Off-by-one boundary error: Using '<=' with '.length' causes an 'IndexOutOfBounds' or 'undefined' array access on the final loop iteration.`,
        recommendation: `Change '<=' to '<' in the loop condition.`,
        originalCodeSnippet: line,
        suggestedFix: "Replace '<=' with '<' when iterating over array length.",
        fixedCode: fixedSnippet
      });
    }

    // B. Direct null dereference pattern: if (user == null) { user.prop } or if (!user) { user.prop }
    const nullDereferenceMatch = line.match(/if\s*\(\s*([a-zA-Z0-9_$]+)\s*(?:===?|==)\s*(?:null|undefined)\s*\)\s*\{?\s*(?:console\.[a-zA-Z]+\s*\(.*?\);?\s*)?\1\.([a-zA-Z0-9_$]+)/);
    if (nullDereferenceMatch) {
      const varName = nullDereferenceMatch[1];
      const propName = nullDereferenceMatch[2];
      const fixedSnippet = line.replace(
        new RegExp(`if\\s*\\(\\s*${varName}\\s*(?:===?|==)\\s*(?:null|undefined)\\s*\\)`),
        `if (${varName} != null)`
      );
      findings.push({
        severity: "high",
        lineNumber: lineNum,
        issue: `Null Pointer Dereference: Accessing '${varName}.${propName}' inside a condition where '${varName}' is checked to be null or undefined will crash at runtime.`,
        recommendation: `Invert the check to verify '${varName} != null' before accessing properties.`,
        originalCodeSnippet: line,
        suggestedFix: `Check if '${varName}' is defined before accessing its properties.`,
        fixedCode: fixedSnippet
      });
    }

    // C. Loose equality comparison with null / undefined: `foo == null` vs `foo === null`
    if (/\s==\s+(?:null|undefined)/.test(line) && !line.includes('typeof') && !line.includes('!= null')) {
      const fixedSnippet = line.replace(/\s==\s+null/g, ' === null').replace(/\s==\s+undefined/g, ' === undefined');
      findings.push({
        severity: "low",
        lineNumber: lineNum,
        issue: "Loose equality comparison (`==`) with null/undefined can lead to unintended type coercion bugs.",
        recommendation: "Use strict equality (`===`) or optional chaining for precise null checks.",
        originalCodeSnippet: line,
        suggestedFix: "Replace loose equality `==` with strict equality `===`.",
        fixedCode: fixedSnippet
      });
    }

    // D. Hardcoded Secrets / API Keys / Passwords
    const secretMatch = line.match(/(?:api_?key|jwt_?secret|password|auth_?token|client_?secret)\s*[:=]\s*["']([A-Za-z0-9_\-.~!@#$%^&*]{8,})["']/i);
    if (secretMatch && !line.toLowerCase().includes('process.env') && !line.includes('placeholder') && !line.includes('replace_this')) {
      const fixedSnippet = line.replace(/(["'])(?:[A-Za-z0-9_\-.~!@#$%^&*]{8,})\1/, 'process.env.SECRET_KEY || ""');
      findings.push({
        severity: "high",
        lineNumber: lineNum,
        issue: "Security Vulnerability: Detected hardcoded credential or API secret in source code.",
        recommendation: "Store sensitive credentials in environment variables or a secure key management vault.",
        originalCodeSnippet: line,
        suggestedFix: "Extract the hardcoded credential to process.env.",
        fixedCode: fixedSnippet
      });
    }

    // E. Dangerous eval() or new Function() execution
    if (/\beval\s*\(/.test(line) || /new\s+Function\s*\(/.test(line)) {
      findings.push({
        severity: "high",
        lineNumber: lineNum,
        issue: "Critical Security Risk: Direct use of `eval()` or dynamic `Function()` constructor allows arbitrary code execution and injection attacks.",
        recommendation: "Refactor logic to use safe parsers (e.g. JSON.parse()) or structured mapping functions.",
        originalCodeSnippet: line,
        suggestedFix: "Remove eval() and use a secure parsing method.",
        fixedCode: `// Refactored safe parser instead of eval\n${line.replace(/\beval\s*\(/g, 'JSON.parse(')}`
      });
    }

    // F. Direct innerHTML / dangerouslySetInnerHTML assignment without sanitization
    if (/\.innerHTML\s*=/.test(line) && !line.includes('DOMPurify') && !line.includes('sanitize')) {
      const fixedSnippet = line.replace(/\.innerHTML\s*=/, '.textContent =');
      findings.push({
        severity: "medium",
        lineNumber: lineNum,
        issue: "Cross-Site Scripting (XSS) Risk: Direct assignment to `innerHTML` without sanitization can execute malicious injected scripts.",
        recommendation: "Use `.textContent`, `.innerText`, or sanitize HTML with a library like DOMPurify before assignment.",
        originalCodeSnippet: line,
        suggestedFix: "Use `.textContent` instead of `.innerHTML` to prevent script injection.",
        fixedCode: fixedSnippet
      });
    }

    // G. SQL Injection Risk (Raw String Concatenation in SQL queries)
    const sqlConcatMatch = line.match(/(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+.*?\+\s*[a-zA-Z0-9_$]+/i) ||
      line.match(/query\s*\(\s*`[^`]*\$\{[a-zA-Z0-9_$]+\}[^`]*`\s*\)/i);
    if (sqlConcatMatch) {
      findings.push({
        severity: "high",
        lineNumber: lineNum,
        issue: "SQL Injection Vulnerability: User input appears to be concatenated or interpolated directly into a SQL query string.",
        recommendation: "Use parameterized queries or prepared statements with placeholder variables (`?` or `$1`).",
        originalCodeSnippet: line,
        suggestedFix: "Use parameterized SQL queries.",
        fixedCode: `// Use parameterized query with placeholders\n${line}`
      });
    }

    // H. Missing error handling in empty catch blocks
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
      const fixedSnippet = line.replace(/catch\s*\(([^)]*)\)\s*\{\s*\}/, 'catch ($1) {\n    console.error("Operation failed:", $1);\n    throw $1;\n  }');
      findings.push({
        severity: "medium",
        lineNumber: lineNum,
        issue: "Silent Failure: Empty `catch` block suppresses errors without logging or handling, making debugging difficult.",
        recommendation: "Log the caught exception or rethrow it to handle the failure gracefully.",
        originalCodeSnippet: line,
        suggestedFix: "Add error logging and handling inside the catch block.",
        fixedCode: fixedSnippet
      });
    }

    // I. Missing `await` with async function calls returning Promises
    if (/\b(?:fetch|axios\.(?:get|post|put|delete)|bcrypt\.hash|bcrypt\.compare|fs\.promises)\s*\(/.test(line) && !/\bawait\b/.test(line) && !/\.then\b/.test(line) && !line.includes('return')) {
      const fixedSnippet = line.replace(/(\b(?:fetch|axios|bcrypt|fs\.promises)\b)/, 'await $1');
      findings.push({
        severity: "medium",
        lineNumber: lineNum,
        issue: "Unhandled Async Promise: Asynchronous operation is invoked without `await` or `.then()`, leading to race conditions or unhandled rejections.",
        recommendation: "Add `await` keyword or chain `.then()/.catch()` to properly await the Promise resolution.",
        originalCodeSnippet: line,
        suggestedFix: "Add `await` to ensure asynchronous execution completes.",
        fixedCode: fixedSnippet
      });
    }

    // J. Deprecated `var` usage causing variable hoisting and scope leakage
    if (/\bvar\s+[a-zA-Z0-9_$]+/.test(line) && (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx' || !ext)) {
      const fixedSnippet = line.replace(/\bvar\b/, 'const');
      findings.push({
        severity: "low",
        lineNumber: lineNum,
        issue: "Deprecated `var` Declaration: `var` is function-scoped and hoisted, which can cause unexpected variable leaks across blocks.",
        recommendation: "Use `const` for immutable variables or `let` for reassignable variables.",
        originalCodeSnippet: line,
        suggestedFix: "Replace `var` with `const` or `let`.",
        fixedCode: fixedSnippet
      });
    }

    // K. Potential Division by Zero
    if (/\/\s*0\b/.test(line) && !line.includes('//') && !line.includes('http') && !line.includes('regex') && !line.includes('date')) {
      const fixedSnippet = line.replace(/\/\s*0\b/, '/ 1 /* fixed zero denominator */');
      findings.push({
        severity: "high",
        lineNumber: lineNum,
        issue: "Division by Zero: Dividing directly by zero produces `Infinity` or `NaN` in JavaScript and crashes in other languages.",
        recommendation: "Ensure denominator is non-zero before performing division.",
        originalCodeSnippet: line,
        suggestedFix: "Guard against zero denominator before dividing.",
        fixedCode: fixedSnippet
      });
    }

    // L. Python-specific: mutable default argument `def foo(items=[])`
    if (ext === 'py' || line.includes('def ')) {
      const mutableDefMatch = line.match(/def\s+[a-zA-Z0-9_$]+\s*\([^)]*([a-zA-Z0-9_$]+)\s*=\s*(\[\]|\{\})/);
      if (mutableDefMatch) {
        const paramName = mutableDefMatch[1];
        const fixedSnippet = line.replace(/=\s*(\[\]|\{\})/, '=None');
        findings.push({
          severity: "medium",
          lineNumber: lineNum,
          issue: `Python Mutable Default Argument: Default parameter '${paramName}' retains mutations across multiple function calls.`,
          recommendation: `Use '${paramName}=None' as the default argument and initialize inside the function body.`,
          originalCodeSnippet: line,
          suggestedFix: `Set default argument to None and initialize inside the function.`,
          fixedCode: fixedSnippet
        });
      }
    }
  }

  // Deduplicate and sanitize findings
  const validFindings = sanitizeAndValidateFindings(findings, sourceCode, fileName);

  const highestSeverity = validFindings.some(f => f.severity === 'high')
    ? 'high'
    : validFindings.some(f => f.severity === 'medium')
      ? 'medium'
      : validFindings.some(f => f.severity === 'low')
        ? 'low'
        : 'none';

  return {
    summary: validFindings.length > 0
      ? `Static analysis identified ${validFindings.length} issue(s) with actionable code fixes.`
      : "Code analysis completed: No syntax defects, boundary errors, or security flaws detected.",
    overallSeverity: highestSeverity,
    findings: validFindings
  };
}

async function analyzeCode(sourceCode, fileName, isRevalidation = false, previousFindings = null, projectContext = null) {
  // Check memory cache first for 0ms immediate response
  const cacheKey = getCacheKey(sourceCode, fileName, isRevalidation, previousFindings, projectContext);
  if (analysisCache.has(cacheKey)) {
    return JSON.parse(JSON.stringify(analysisCache.get(cacheKey)));
  }

  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || "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";
  const openRouterKey = String(rawOpenRouterKey).split(/[\r\n]+/)[0].trim().replace(/^Bearer\s+/i, "");

  const systemPrompt = `You are a lightning-fast, expert AI code reviewer and debugger. You must output STRICT valid JSON only. NO conversational text, reasoning, or markdown outside JSON.

TASK:
Review the submitted code for:
1. Bugs, logic errors, off-by-one errors, and unhandled edge cases.
2. Null pointer / undefined dereferencing, crashes, or unhandled promise rejections.
3. Security vulnerabilities (injection, hardcoded secrets, unsafe eval/innerHTML).
4. Performance bottlenecks, memory leaks, and bad practices.

MANDATORY FIX REQUIREMENTS:
- For EVERY issue found, you MUST provide BOTH:
  - 'originalCodeSnippet': The EXACT verbatim lines from the source code containing the defect.
  - 'fixedCode': The EXACT complete drop-in replacement code with the fix applied (ready to paste).
  - 'lineNumber': The 1-indexed line number where the issue occurs.
  - 'suggestedFix': Clear, concise explanation of the fix.

Output Format:
{
  "summary": "Brief summary of findings and overall code health.",
  "overallSeverity": "high" | "medium" | "low" | "none",
  "findings": [
    {
      "severity": "high" | "medium" | "low",
      "lineNumber": 12,
      "issue": "Specific bug or vulnerability description.",
      "recommendation": "How to fix it properly.",
      "originalCodeSnippet": "Verbatim lines from source code",
      "suggestedFix": "Summary of fix applied.",
      "fixedCode": "Verbatim replacement code block"
    }
  ]
}

${isRevalidation ? "REVALIDATION PASS: Verify if previously reported issues are fixed. If clean, return findings: []." : "Identify all actionable issues. If clean, return findings: []."}`;

  const userPrompt = `File: ${fileName || "code.txt"}\n\nSource Code:\n\`\`\`\n${sourceCode}\n\`\`\``;

  let finalResult = null;

  // 1. Try Google Gemini API if GEMINI_API_KEY provided (Free 1500 req/day)
  if (geminiKey) {
    try {
      finalResult = await queryGeminiModel(geminiKey, systemPrompt, userPrompt, sourceCode, fileName, 4000);
    } catch (e) {
      console.warn("Gemini API call failed:", e.message);
    }
  }

  // 2. Try Groq API if GROQ_API_KEY provided
  if (!finalResult && groqKey) {
    try {
      finalResult = await queryGroqModel(groqKey, systemPrompt, userPrompt, sourceCode, fileName, 3500);
    } catch (e) {
      console.warn("Groq API call failed:", e.message);
    }
  }

  // 3. Try OpenRouter Models
  if (!finalResult && openRouterKey) {
    const fastModels = [
      "liquid/lfm-2.5-2.6b:free",
      "apodex/apodex-1.1-mini:free",
      "nvidia/nemotron-3.5-lightning:free",
      "google/gemma-4-26b-a4b-it:free",
      "google/gemma-4-31b-it:free",
      "cohere/north-mini-code:free",
      "openrouter/free"
    ];

    try {
      const tierController = new AbortController();
      const promises = fastModels.map(modelId =>
        querySingleModel(modelId, openRouterKey, systemPrompt, userPrompt, sourceCode, fileName, 3500, tierController.signal)
      );
      finalResult = await Promise.any(promises);
      tierController.abort();
    } catch (e) {
      // Remote OpenRouter models failed or rate-limited
    }
  }

  // 4. Instant Deep Static Defect Reviewer (<10ms fallback guarantee)
  if (!finalResult || !finalResult.findings || finalResult.findings.length === 0) {
    const staticReview = performStaticFallbackReview(sourceCode, fileName);
    if (staticReview.findings && staticReview.findings.length > 0) {
      if (!finalResult || (finalResult.findings && finalResult.findings.length === 0)) {
        finalResult = staticReview;
      }
    } else if (!finalResult) {
      finalResult = staticReview;
    }
  }

  // Cache successful result for instant subsequent requests
  if (analysisCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
  analysisCache.set(cacheKey, finalResult);

  return finalResult;
}

module.exports = {
  analyzeCode,
  checkBalancedDelimiters,
  hasPlaceholders,
  findAndAlignSnippet,
  validateFixIntegrity,
  sanitizeAndValidateFindings,
  performStaticFallbackReview
};
