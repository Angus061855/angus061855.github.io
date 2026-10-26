import { segmentText } from './typography-segments.mjs';
const targets = 'h1,h2,h3,h4,p,li,button,summary,dt,dd,.hero-lead,.faq-q,.faq-a,.blog-card-title,.quiz-result-title,.compare-title,.stat-label,.faq-line-text';
const excluded = 'script,style,textarea,code,pre,svg,select,option,label,[contenteditable],.visually-hidden,.semantic-intro,.chip,.hero-sub-shine,.hero-title-line,.copy-run,.copy-clause,.copy-phrase,[data-total-views]';

function enhance(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!/[\u3400-\u9fff]/u.test(node.data) || !node.parentElement?.closest(targets) || node.parentElement.closest(excluded)) continue;
    // URLs retain their own wrapping rules; do not alter link destinations or events.
    if (/https?:\/\//.test(node.data)) continue;
    nodes.push(node);
  }
  for (const node of nodes) {
    const control = node.parentElement.closest('button,summary');
    if (control && (!control.hasAttribute('aria-label') || control.hasAttribute('data-typography-label'))) {
      const label = control.cloneNode(true);
      label.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove());
      control.setAttribute('aria-label', label.textContent.trim());
      control.setAttribute('data-typography-label', '');
    }
    const fragment = document.createDocumentFragment();
    const clauses = node.data.match(/[^，。！？；：、\u3000\n]+[，。！？；：、]?|[\u3000\n]+|./gu) || [];
    for (const text of clauses) {
      if (!text.trim()) { fragment.append(text); continue; }
      const clause = document.createElement('as-clause');
      clause.className = 'copy-clause';
      for (const phrase of segmentText(text)) {
        const part = document.createElement('as-phrase');
        part.className = 'copy-phrase';
        part.textContent = phrase;
        clause.append(part);
      }
      fragment.append(clause);
    }
    // A text node is one flex item; keep its clauses in one item as well.
    const run = document.createElement('as-copy');
    run.className = 'copy-run';
    run.append(fragment);
    node.replaceWith(run);
  }
}

function init() {
  enhance(document.body);
  // Cover loaded blog cards, quiz results and timer messages without replacing controls.
  const observer = new MutationObserver(records => {
    const roots = new Set(records.map(r => r.type === 'characterData' ? r.target.parentElement : r.target));
    observer.disconnect();
    for (const root of roots) {
      if (root instanceof Element && root.isConnected && !root.closest(excluded)) enhance(root);
    }
    observe();
  });
  const observe = () => observer.observe(document.body, {childList:true, subtree:true, characterData:true});
  observe();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
else init();
