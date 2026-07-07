# Work Landing Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the dual-job advertising landing page so it feels like a native extension of the AS Entertainment homepage while shortening mobile reading length and preserving conversion tracking.

**Architecture:** Keep the existing static HTML and dedicated stylesheet. Recompose existing sections in `work-landing.html`, add an accessible native JavaScript role switcher for mobile, and isolate every visual change in `work-landing.css` so other pages are unaffected.

**Tech Stack:** Semantic HTML, CSS Grid/Flexbox, vanilla JavaScript, Meta Pixel, Playwright browser verification.

---

## File Map

- Modify `work-landing.html`: semantic page structure, mobile role tabs, section copy hierarchy, existing link and Pixel behavior.
- Modify `work-landing.css`: homepage-aligned visual system, responsive layouts, role tab states, reduced-motion behavior.
- Create `tests/work-landing-smoke.mjs`: static assertions for required content, links, Pixel ID, role controls, and stylesheet isolation.

### Task 1: Add static landing-page smoke coverage

**Files:**
- Create: `tests/work-landing-smoke.mjs`

- [ ] **Step 1: Write the static smoke test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../work-landing.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../work-landing.css', import.meta.url), 'utf8');

assert.match(html, /先詢問再決定/);
assert.match(html, /不簽約也不壓薪水/);
assert.match(html, /role-tab/);
assert.match(html, /aria-selected=/);
assert.match(html, /1817663066269089/);
assert.match(html, /data-personal-line/);
assert.match(html, /data-official-instagram/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /\.role-tab/);
assert.doesNotMatch(css, /body\s*\{[^}]*background:\s*(white|#fff)/i);

console.log('work-landing smoke checks passed');
```

- [ ] **Step 2: Run the test and confirm the role-control assertions initially fail**

Run: `node tests/work-landing-smoke.mjs`

Expected: FAIL because the existing HTML does not contain `role-tab` or `aria-selected`.

### Task 2: Recompose the landing-page structure

**Files:**
- Modify: `work-landing.html`

- [ ] **Step 1: Refine the hero structure**

Keep the existing title, proof claims, four promises, personal LINE URL and Meta Pixel. Add presentation wrappers only where required for homepage-style spacing; do not introduce new claims or external media.

- [ ] **Step 2: Convert the role area to an accessible tab interface**

Add the following control before the two existing role panels:

```html
<div class="role-tabs" role="tablist" aria-label="選擇工作方向">
  <button class="role-tab is-active" type="button" role="tab" aria-selected="true" aria-controls="beauty-role" data-role-target="beauty-role">美容師</button>
  <button class="role-tab" type="button" role="tab" aria-selected="false" aria-controls="hotel-role" data-role-target="hotel-role">酒店公關</button>
</div>
```

On mobile, default to the beauty panel. On desktop, display both panels and visually de-emphasize the tab controls without hiding their accessible purpose.

- [ ] **Step 3: Add native role-switching behavior**

```js
document.querySelectorAll('.role-tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.role-tab').forEach(function (item) {
      item.classList.toggle('is-active', item === tab);
      item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
    });
    document.querySelectorAll('.role-panel').forEach(function (panel) {
      panel.classList.toggle('is-active', panel.id === tab.dataset.roleTarget);
    });
  });
});
```

- [ ] **Step 4: Remove repeated trust copy without deleting decision-critical information**

Keep the experience numbers in the hero and about section, but shorten surrounding prose. Keep contract, salary, privacy, refusal rights, payment cadence and disclaimer wording.

- [ ] **Step 5: Run the smoke test**

Run: `node tests/work-landing-smoke.mjs`

Expected: PASS and print `work-landing smoke checks passed`.

### Task 3: Match the homepage visual language

**Files:**
- Modify: `work-landing.css`

- [ ] **Step 1: Refine hero scale and spacing**

Use the existing velvet image and centered composition. Cap the desktop hero title near `5.6rem`, keep gold-white text treatment, and ensure mobile hero content and primary CTA fit inside common 844px to 932px viewport heights.

- [ ] **Step 2: Reduce repeated card treatment**

Use single bordered groups with internal dividers for concerns, decisions and proof. Keep `border-radius` at `4px` or less and reserve shadows for the primary CTA.

- [ ] **Step 3: Style role tabs and mobile panels**

```css
.role-tabs { display: none; }

@media (max-width: 760px) {
  .role-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .role-tab { min-height: 48px; border: 1px solid var(--border); background: rgba(8,7,6,.72); color: var(--muted); }
  .role-tab.is-active { color: var(--gold-light); border-color: rgba(200,169,110,.62); background: rgba(200,169,110,.08); }
  .role-panel { display: none; }
  .role-panel.is-active { display: block; }
}
```

- [ ] **Step 4: Tighten responsive vertical rhythm**

Reduce mobile section padding, oversized heading margins and repeated content height while preserving readable line-height and minimum 44px interactive targets.

- [ ] **Step 5: Preserve reduced-motion support**

Keep all reveal content visible when `prefers-reduced-motion: reduce` is active and do not add continuous decorative motion.

### Task 4: Verify behavior and responsive quality

**Files:**
- Test: `tests/work-landing-smoke.mjs`
- Verify: `work-landing.html`
- Verify: `work-landing.css`

- [ ] **Step 1: Run static validation**

Run: `node tests/work-landing-smoke.mjs`

Expected: PASS.

- [ ] **Step 2: Start the local static server**

Run: `python3 -m http.server 8765`

Expected: server listens on `http://127.0.0.1:8765/`.

- [ ] **Step 3: Verify desktop layouts**

Open `/work-landing` at 1440x1000 and 1280x720. Confirm both role panels appear, the hero is centered, no content overlaps, and there is no horizontal overflow.

- [ ] **Step 4: Verify mobile layouts**

Open `/work-landing` at 430x932, 390x844 and 375x812. Confirm the hero CTA is visible, role tabs switch panels, the floating LINE button appears after leaving the hero, and there is no horizontal overflow.

- [ ] **Step 5: Verify links and tracking contracts**

Confirm personal LINE, official LINE, TikTok, Instagram and homepage links resolve to their configured destinations. Confirm the source still contains Pixel ID `1817663066269089`, `PageView`, and the personal LINE `Contact` handler.

- [ ] **Step 6: Check the diff**

Run: `git diff --check -- work-landing.html work-landing.css tests/work-landing-smoke.mjs`

Expected: no output.

### Task 5: Commit and publish only the landing-page changes

**Files:**
- `work-landing.html`
- `work-landing.css`
- `tests/work-landing-smoke.mjs`
- `docs/superpowers/plans/2026-07-08-work-landing-refinement.md`

- [ ] **Step 1: Stage explicit files only**

```bash
git add work-landing.html work-landing.css tests/work-landing-smoke.mjs docs/superpowers/plans/2026-07-08-work-landing-refinement.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "Refine work landing page"
```

- [ ] **Step 3: Synchronize and push without including unrelated working-tree changes**

Fetch the remote, reconcile only committed history, then push `main` to `origin`. Do not stage `.DS_Store`, generated images, Worker files, previews or other untracked artifacts.
