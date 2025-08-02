function runLinter() {
  const code = document.getElementById("codeInput").value;
  const resultsList = document.getElementById("resultsList");
  resultsList.innerHTML = "";


  const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'track', 'wbr'];
  const deprecatedTags = ['font', 'center', 'big', 'marquee'];
  const knownTags = [
    'html', 'head', 'body', 'div', 'span', 'h1','h2','h3','h4','h5','h6','p','a',
    'ul','ol','li','table','tr','td','th','thead','tbody','footer','header','section',
    'article','aside','nav','button','input','form','label','img','meta','link',
    'script','style','title','br','hr','strong','em','b','i','u','small','figure','figcaption'
  ];


  const tagRegex = /<\s*\/?\s*([a-zA-Z0-9\-]+)([^>]*)>/g;
  const attrRegex = /\s+([a-zA-Z\-]+)(\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;


  const stack = [];
  const usedIds = new Set();
  let match;
  let hasErrors = false;


  while ((match = tagRegex.exec(code)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const attrs = match[2];
    const isClosing = fullTag.startsWith("</");
    const isSelfClosing = selfClosingTags.includes(tagName) || fullTag.endsWith("/>");


    if (!knownTags.includes(tagName) && !isClosing) {
      const li = document.createElement("li");
      li.className = "error";
      li.textContent = `❌ HTML Bug: Unknown tag <${tagName}> at position ${match.index}`;
      resultsList.appendChild(li);
      hasErrors = true;
    }


    if (deprecatedTags.includes(tagName)) {
      const li = document.createElement("li");
      li.className = "error";
      li.textContent = `⚠️ HTML Warning: Deprecated tag <${tagName}> used`;
      resultsList.appendChild(li);
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
          li.textContent = `❌ HTML Bug: Duplicate id="${idValue}" found`;
          resultsList.appendChild(li);
          hasErrors = true;
        } else {
          usedIds.add(idValue);
        }
      }


      if (tagName === "img" && attrName === "alt" && attrValue === '""') {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `⚠️ HTML Warning: <img> has empty alt attribute`;
        resultsList.appendChild(li);
      }


      if (!attrMatch[2] && attrName !== "disabled" && attrName !== "checked") {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ HTML Bug: Attribute "${attrName}" missing value in tag <${tagName}>`;
        resultsList.appendChild(li);
        hasErrors = true;
      }
    }


    if (isClosing) {
      if (!stack.length || stack[stack.length - 1] !== tagName) {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ HTML Bug: Unexpected closing </${tagName}> at position ${match.index}`;
        resultsList.appendChild(li);
        hasErrors = true;
      } else {
        stack.pop();
      }
    } else if (!isSelfClosing) {
      stack.push(tagName);
    }
  }


  if (stack.length > 0) {
    stack.forEach(unclosed => {
      const li = document.createElement("li");
      li.className = "error";
      li.textContent = `❌ HTML Bug: Missing closing tag for <${unclosed}>`;
      resultsList.appendChild(li);
    });
    hasErrors = true;
  }


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
    const properties = propertiesRaw.trim().split("\n");


    if (!block.includes("}")) {
      const li = document.createElement("li");
      li.className = "error";
      li.textContent = `❌ CSS Bug: Missing closing '}' brace after selector '${selector.trim()}'`;
      resultsList.appendChild(li);
    }


    properties.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;


      if (!trimmedLine.includes(":")) {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ CSS Bug: Missing ':' or malformed property in block '${selector.trim()}' → "${trimmedLine}"`;
        resultsList.appendChild(li);
        return;
      }


      const hasSemicolon = trimmedLine.endsWith(";");
      const [prop, value] = trimmedLine.replace(";", "").split(":").map(s => s.trim());


      if (!knownCSSProperties.includes(prop)) {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ CSS Bug: Unknown property '${prop}' in '${selector.trim()}'`;
        resultsList.appendChild(li);
      }


      if (!hasSemicolon) {
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ CSS Bug: Missing semicolon after '${prop}: ${value}' in '${selector.trim()}'`;
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
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = `❌ Syntax Bug: Unexpected '${char}' at position ${i}`;
        resultsList.appendChild(li);
        return;
      } else {
        stackSyntax.pop();
      }
    }
  }


  if (stackSyntax.length > 0) {
    stackSyntax.forEach(item => {
      const li = document.createElement("li");
      li.className = "error";
      li.textContent = `❌ Syntax Bug: Missing closing for '${item.char}' at position ${item.index}`;
      resultsList.appendChild(li);
    });
  }


  if (resultsList.children.length === 0) {
    const li = document.createElement("li");
    li.className = "success";
    li.textContent = "✅ No HTML or CSS bugs found!";
    resultsList.appendChild(li);
  }
}