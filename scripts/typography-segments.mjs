import { Parser } from '../assets/vendor/budoux/parser.js';
import { model } from '../assets/vendor/budoux/zh-hant.js';

const parser = new Parser(model);
const words = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-Hant', {granularity: 'word'}) : null;

export function segmentText(text) {
  const boundaries = words ? new Set([...words.segment(text)].map(part => part.index)) : null;
  const result = [];
  let chunk = '', offset = 0;
  for (const phrase of parser.parse(text)) {
    if (chunk && (!boundaries || boundaries.has(offset))) { result.push(chunk); chunk = ''; }
    chunk += phrase;
    offset += phrase.length;
  }
  if (chunk) result.push(chunk);
  return result.reduce((chunks, part) => {
    if (chunks.length && /^[的了嗎呢吧啊。，、！？；：」』）]+$/u.test(part)) chunks[chunks.length - 1] += part;
    else chunks.push(part);
    return chunks;
  }, []);
}
