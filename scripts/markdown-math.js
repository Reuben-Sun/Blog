'use strict';

// 让 $...$、$$...$$ 不经过 Markdown 解析（避免 _ * \\ 等被当成强调或转义、
// 公式内的 = - 行被当成标题或列表），按原样输出给浏览器端 MathJax。
// 定界符与 MathJax 一致，\$ 视为转义。

function isEscaped(src, pos) {
  let n = 0;
  while (pos - 1 - n >= 0 && src.charCodeAt(pos - 1 - n) === 0x5C /* \ */) n++;
  return n % 2 === 1;
}

function findClose(src, from, delim, max) {
  let pos = from;
  while ((pos = src.indexOf(delim, pos)) !== -1 && pos + delim.length <= max) {
    if (!isEscaped(src, pos)) return pos;
    pos += 1;
  }
  return -1;
}

function mathInline(state, silent) {
  const { src, pos: start, posMax: max } = state;
  if (src.charCodeAt(start) !== 0x24 /* $ */ || isEscaped(src, start)) return false;

  const display = src.charCodeAt(start + 1) === 0x24;
  const delim = display ? '$$' : '$';
  const from = start + delim.length;
  const end = findClose(src, from, delim, max);
  if (end === -1 || end === from) return false;

  if (!silent) {
    const token = state.push('math_inline', 'math', 0);
    token.markup = delim;
    token.content = src.slice(from, end);
  }
  state.pos = end + delim.length;
  return true;
}

// 以 $$ 开头的行开始一个公式块，直到某行以 $$ 结尾；可以打断段落
function mathBlock(state, startLine, endLine, silent) {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;

  const lineText = line => state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
  const first = lineText(startLine);
  if (!first.startsWith('$$')) return false;

  let last = startLine;
  let body;
  const firstRest = first.slice(2).trimEnd();
  if (firstRest.length >= 2 && firstRest.endsWith('$$') && !isEscaped(firstRest, firstRest.length - 2)) {
    body = firstRest.slice(0, -2);
  } else {
    if (firstRest.includes('$$')) return false;
    let found = false;
    while (++last < endLine) {
      if (state.sCount[last] < state.blkIndent) break;
      const text = lineText(last).trimEnd();
      if (text.endsWith('$$') && !isEscaped(text, text.length - 2)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
    // getLines 会去掉引用块 > 与列表缩进等容器前缀
    const middle = last > startLine + 1 ? state.getLines(startLine + 1, last, state.blkIndent, false) : '';
    const closeLine = lineText(last).trimEnd();
    body = `${firstRest}\n${middle}${closeLine.slice(0, -2)}`;
  }

  if (silent) return true;
  const token = state.push('math_block', 'math', 0);
  token.block = true;
  token.markup = '$$';
  token.content = body;
  token.map = [startLine, last + 1];
  state.line = last + 1;
  return true;
}

function mathPlugin(md) {
  const { escapeHtml } = md.utils;
  md.inline.ruler.before('escape', 'math_inline', mathInline);
  md.block.ruler.before('fence', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });
  md.renderer.rules.math_inline = (tokens, idx) => {
    const { markup, content } = tokens[idx];
    return markup + escapeHtml(content) + markup;
  };
  md.renderer.rules.math_block = (tokens, idx) => `<p>$$${escapeHtml(tokens[idx].content)}$$</p>\n`;
}

hexo.extend.filter.register('markdown-it:renderer', md => {
  md.use(mathPlugin);
});
