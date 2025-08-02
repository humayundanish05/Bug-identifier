console.log("✅ JS file connected");

// Utility: Get line and column from character index
function getLineAndColumn(code, index) { const lines = code.substring(0, index).split("\n"); const line = lines.length; const col = lines[lines.length - 1].length + 1; return { line, col }; }

function runLinter() { const code = document.getElementById("codeInput").value; const resultsList = document.getElementById("resultsList"); resultsList.innerHTML = "";

const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'track', 'wbr']; const deprecatedTags = ['font', 'center', 'big', 'marquee']; const knownTags = [ 'html', 'head', 'body', 'div', 'span', 'h1','h2','h3','h4','h5','h6','p','a', 'ul','ol','li','table','tr','td','th','thead','tbody','footer','header','section', 'article','aside','nav','button','input','form','label','img','meta','link', 'script','style','title','br','hr','strong','em','b','i','u','small','figure','figcaption' ];

const tagRegex = /<\s*/??\s*([a-zA-Z0-9-]+)([^>])>/g; const attrRegex = /\s+([a-zA-Z-]+)(\s=\s*("[^"]"|'[^']'|[^\s>]+))?/g;

const stack = []; const usedIds = new Set(); const errorLines = new Set(); let match; let hasErrors = false;

while ((match = tagRegex.exec(code)) !== null) { const fullTag = match[0]; const tagName = match[1].toLowerCase(); const attrs = match[2]; const isClosing = fullTag.startsWith("</"); const isSelfClosing = selfClosingTags.includes(tagName) || fullTag.endsWith("/>"); const { line, col } = getLineAndColumn(code, match.index);

if (!knownTags.includes(tagName) && !isClosing) {
  const li = document.createElement("li");
  li.className = "error";
  li.textContent = `❌ HTML Bug: Unknown tag <${tagName}> at line ${line}, column ${col}`;
  resultsList.appendChild(li);
  errorLines.add(line);
  hasErrors = true;
}

if (deprecatedTags.includes(tagName)) {
  const li = document.createElement("li");
  li.className = "error";
  li.textContent = `⚠️ HTML Warning: Deprecated tag <${tagName}> used at line ${line}, column ${col}`;
  resultsList.appendChild(li);
  errorLines.add(line);
}

let attrMatch;
while ((attrMatch = attrRegex.exec(attrs)) !== null) {
  const attrName = attrMatch[1].toLowerCase();
  const attrValue = attrMatch[3];

  if (attrName === "id" && attrValue) {
    const idValue = attrValue.replace(/['"]/g, '');
    if (usedIds.has(idValue)) {
      const li = document.createElement("li");
      li.className = "error";
      li.textContent = `❌ HTML Bug: Duplicate id="${idValue}" found at line ${line}, column ${col}`;
      resultsList.appendChild(li);
      errorLines.add(line);
      hasErrors = true;
    } else {
      usedIds.add(idValue);
    }
  }

  if (tagName === "img" && attrName === "alt" && attrValue === '""') {
    const li = document.createElement("li");
    li.className = "error";
    li.textContent = `⚠️ HTML Warning: <img> has empty alt attribute at line ${line}, column ${col}`;
    resultsList.appendChild(li);
    errorLines.add(line);
  }

  if (!attrMatch[2] && attrName !== "disabled" && attrName !== "checked") {
    const li = document.createElement("li");
    li.className = "error";
    li.textContent = `❌ HTML Bug: Attribute "${attrName}" missing value in tag <${tagName}> at line ${line}, column ${col}`;
    resultsList.appendChild(li);
    errorLines.add(line);
    hasErrors = true;
  }
}

if (isClosing) {
  if (!stack.length || stack[stack.length - 1] !== tagName) {
    const li = document.createElement("li");
    li.className = "error";
    li.textContent = `❌ HTML Bug: Unexpected closing </${tagName}> at line ${line}, column ${col}`;
    resultsList.appendChild(li);
    errorLines.add(line);
    hasErrors = true;
  } else {
    stack.pop();
  }
} else if (!isSelfClosing) {
  stack.push(tagName);
}

}

if (stack.length > 0) { stack.forEach(unclosed => { const li = document.createElement("li"); li.className = "error"; li.textContent = ❌ HTML Bug: Missing closing tag for <${unclosed}>; resultsList.appendChild(li); }); hasErrors = true; }

// Call highlight function with collected error lines 
  highlightLinesWithErrors(errorLines); }

                      
    

// === CSS Validation ===
  const cssBlocks = code.split(/}/);
  const knownCSSProperties = [
    "color", "background", "font-size", "margin", "padding", "border", "display",
    "position", "top", "left", "right", "bottom", "width", "height", "overflow",
    "z-index", "border-radius", "text-align", "box-sizing", "gap", "align-items",
    "justify-content", "object-fit", "border-bottom", "border-top", "border-left",
    "border-right", "font-weight", "line-height", "white-space", "scroll-snap-type",
    "scroll-snap-align", "flex-direction", "flex", "min-width", "max-width",
    "min-height", "max-height"
  ];

  cssBlocks.forEach((block) => {
    if (!block.includes("{")) return;
    const [selector, propertiesRaw] = block.split("{");
    const selectorIndex = code.indexOf(selector);
    const { line, col } = getLineAndColumn(code, selectorIndex);
    const properties = propertiesRaw.trim().split("\n");

    if (!block.includes("}")) {
      const li = document.createElement("li");
      li.className = "error";
      li.textContent = `❌ CSS Bug: Missing closing '}' after selector '${selector.trim()}' at line ${line}, column ${col}`;
      resultsList.appendChild(li);
    }

    properties.forEach((lineText) => {
      const trimmedLine = lineText.trim();
      if (!trimmedLine) return;

      const lineIndex = code.indexOf(trimmedLine, selectorIndex);
      const { line: propLine, col: propCol } = getLineAndColumn(code, lineIndex);

      if (!trimmedLine.includes(":")) {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ CSS Bug: Missing ':' or malformed property in '${selector.trim()}' → "${trimmedLine}" at line ${propLine}, column ${propCol}`;
        resultsList.appendChild(li);
        return;
      }

      const hasSemicolon = trimmedLine.endsWith(";");
      const [prop, value] = trimmedLine.replace(";", "").split(":").map(s => s.trim());

      if (!knownCSSProperties.includes(prop)) {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ CSS Bug: Unknown property '${prop}' in '${selector.trim()}' at line ${propLine}, column ${propCol}`;
        resultsList.appendChild(li);
      }

      if (!hasSemicolon) {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ CSS Bug: Missing semicolon after '${prop}: ${value}' in '${selector.trim()}' at line ${propLine}, column ${propCol}`;
        resultsList.appendChild(li);
      }
    });
  });

  // === Syntax Balance Check ===
  const stackSyntax = [];
  const opening = ['{', '(', '['];
  const closing = ['}', ')', ']'];
  const map = { '}': '{', ')': '(', ']': '[' };

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (opening.includes(char)) {
      stackSyntax.push({ char, index: i });
    } else if (closing.includes(char)) {
      if (stackSyntax.length === 0 || stackSyntax[stackSyntax.length - 1].char !== map[char]) {
        const { line, col } = getLineAndColumn(code, i);
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ Syntax Bug: Unexpected '${char}' at line ${line}, column ${col}`;
        resultsList.appendChild(li);
        return;
      } else {
        stackSyntax.pop();
      }
    }
  }

  if (stackSyntax.length > 0) {
    stackSyntax.forEach(item => {
      const { line, col } = getLineAndColumn(code, item.index);
      const li = document.createElement("li");
      li.className = "error";
      li.textContent = `❌ Syntax Bug: Missing closing for '${item.char}' at line ${line}, column ${col}`;
      resultsList.appendChild(li);
    });
  }

  // ✅ Success message
  if (resultsList.children.length === 0) {
    const li = document.createElement("li");
    li.className = "success";
    li.textContent = "✅ No HTML or CSS bugs found!";
    resultsList.appendChild(li);
  }
}

// 🔁 Button click listener
document.addEventListener("DOMContentLoaded", () => {
  const checkBtn = document.getElementById("checkBtn");
  if (checkBtn) {
    checkBtn.addEventListener("click", runLinter);
  }
});


// Highlight lines with errors
function highlightLinesWithErrors(lines) {
  const code = document.getElementById("codeInput").value;
  const highlight = document.getElementById("codeHighlight");
  const codeLines = code.split("\n");

  const html = codeLines.map((lineText, index) => {
    if (lines.has(index + 1)) {
      return `<div class="highlight-line">${lineText || "&nbsp;"}</div>`;
    }
    return `<div>${lineText || "&nbsp;"}</div>`;
  }).join("");

  highlight.innerHTML = html;
}

// Sync scroll between textarea and highlight
document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("codeInput");
  const highlight = document.getElementById("codeHighlight");

  textarea.addEventListener("scroll", () => {
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  });
});
