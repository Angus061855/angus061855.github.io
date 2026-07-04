# Dual Job Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone long-form advertising landing page for hotel hostess and massage beautician inquiries.

**Architecture:** Create one isolated HTML page and one page-specific stylesheet while reusing the existing logo, velvet background asset, Instagram configuration, Meta Pixel, and LINE destinations. Keep the page independent from the main navigation so it can be reviewed and advertised separately.

**Tech Stack:** Static HTML5, CSS, vanilla JavaScript, existing Meta Pixel and site configuration, Playwright verification.

---

### Task 1: Page structure and content

**Files:**
- Create: `work-landing.html`

- [ ] Build semantic sections for hero, concerns, role comparison, decision guide, authority, comparison, suitability, FAQ, and final CTA.
- [ ] Use existing personal LINE, official LINE, TikTok, and configurable Instagram destinations.
- [ ] Add SEO, Open Graph, Meta Pixel, and accessible labels.
- [ ] Verify HTML links and required section IDs with `rg`.

### Task 2: Responsive visual system

**Files:**
- Create: `work-landing.css`

- [ ] Implement the black-and-gold velvet design with the existing `IMG_6337.JPG` asset.
- [ ] Build stable desktop and mobile grids without nested decorative cards.
- [ ] Add subtle reveal motion and reduced-motion support.
- [ ] Add a mobile sticky LINE CTA that does not cover page content.

### Task 3: Interaction and conversion behavior

**Files:**
- Modify: `work-landing.html`

- [ ] Add FAQ disclosure behavior using native `details` elements.
- [ ] Add job-choice anchors that scroll to each role.
- [ ] Add Meta Pixel `Contact` tracking only to personal LINE CTA clicks on this advertising page.

### Task 4: Browser verification

**Files:**
- Test: `work-landing.html`
- Test: `work-landing.css`

- [ ] Run a local static server.
- [ ] Verify at 1440×1000, 430×932, and 375×812 with Playwright.
- [ ] Confirm no horizontal overflow, nonblank visual asset, readable text, and working external links.
- [ ] Save screenshots in `output/playwright/` for review.

### Task 5: Final review

**Files:**
- Modify only if verification finds defects: `work-landing.html`, `work-landing.css`

- [ ] Run `git diff --check` on the two page files.
- [ ] Confirm the page is not linked from the existing site navigation.
- [ ] Provide the local preview URL without uploading to GitHub until requested.
