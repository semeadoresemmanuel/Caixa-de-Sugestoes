export const applyWhatsAppFormatting = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const elements = div.querySelectorAll('.wa-fmt');
  elements.forEach(el => {
    let textContent = el.textContent;
    if (textContent === '**' || textContent === '****' || textContent === '__' || textContent === '~~' || textContent === '``````') {
      textContent = '';
    }
    const textNode = document.createTextNode(textContent);
    el.parentNode.replaceChild(textNode, el);
  });
  let cleanHtml = div.innerHTML;

  const marker = (char) => `<span class="wa-marker" style="opacity: 0.5; font-style: normal;">${char}</span>`;
  
  return cleanHtml
    .replace(/(?<!<[^>]*)\*\*(.+?)\*\*(?![^<]*>)/g, `<b class="wa-fmt">${marker('**')}$1${marker('**')}</b>`)
    .replace(/(?<!<[^>]*)\*(.+?)\*(?![^<]*>)/g, `<b class="wa-fmt">${marker('*')}$1${marker('*')}</b>`)
    .replace(/(?<!<[^>]*)\_(.+?)\_(?![^<]*>)/g, `<i class="wa-fmt">${marker('_')}$1${marker('_')}</i>`)
    .replace(/(?<!<[^>]*)\~(.+?)\~(?![^<]*>)/g, `<strike class="wa-fmt">${marker('~')}$1${marker('~')}</strike>`)
    .replace(/(?<!<[^>]*)\`{3}(.+?)\`{3}(?![^<]*>)/g, `<code class="wa-fmt" style="font-family: monospace; background: rgba(0,204,0,0.1); padding: 2px 4px; border-radius: 4px;">${marker('```')}$1${marker('```')}</code>`);
};

export const getCaretCharacterOffsetWithin = (element) => {
  let caretOffset = 0;
  const doc = element.ownerDocument || element.document;
  const win = doc.defaultView || doc.parentWindow;
  const sel = win.getSelection();
  if (sel.rangeCount > 0) {
    const range = win.getSelection().getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length;
  }
  return caretOffset;
};

export const setCaretPosition = (element, offset) => {
  const doc = element.ownerDocument || element.document;
  const win = doc.defaultView || doc.parentWindow;
  const sel = win.getSelection();
  const range = doc.createRange();
  
  let charIndex = 0, nodeStack = [element], node, foundStart = false, stop = false;
  range.setStart(element, 0);
  range.collapse(true);
  
  while (!stop && (node = nodeStack.pop())) {
    if (node.nodeType === 3) {
      const nextCharIndex = charIndex + node.length;
      if (!foundStart && offset >= charIndex && offset <= nextCharIndex) {
        range.setStart(node, offset - charIndex);
        foundStart = true;
      }
      if (foundStart && offset >= charIndex && offset <= nextCharIndex) {
        range.setEnd(node, offset - charIndex);
        stop = true;
      }
      charIndex = nextCharIndex;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }
  sel.removeAllRanges();
  sel.addRange(range);
};
