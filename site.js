const CONTACTS = {
  line: 'https://line.me/ti/p/tTUQTPHKrE'
};

function toggleMobileMenu() {
  const menu = document.querySelector('.mobile-menu');
  const btn = document.querySelector('.mobile-menu-btn');
  const isOpen = menu && menu.classList.toggle('open');
  if (btn) {
    btn.classList.toggle('open', Boolean(isOpen));
    btn.setAttribute('aria-expanded', String(Boolean(isOpen)));
  }
}

function toggleConsult(force) {
  const widget = document.querySelector('.consult-widget');
  if (!widget) return;
  const open = typeof force === 'boolean' ? force : !widget.classList.contains('open');
  widget.classList.toggle('open', open);
  const toggle = widget.querySelector('.consult-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', String(open));
}

function initWeeklyCount() {
  const el = document.getElementById('weekly-count');
  if (!el) return;
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const base = [0, 15, 32, 49, 66, 83, 100];
  const dayIndex = day === 0 ? 6 : day - 1;
  el.textContent = base[dayIndex] + Math.floor(hour * 0.7);
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(faq => {
    faq.classList.remove('open');
    const question = faq.querySelector('.faq-question');
    if (question) question.setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

function initFaqAccessibility() {
  document.querySelectorAll('.faq-question').forEach((btn, index) => {
    const item = btn.closest('.faq-item');
    const answer = item && item.querySelector('.faq-answer');
    if (!answer) return;
    if (!answer.id) answer.id = `faq-answer-${index + 1}`;
    btn.setAttribute('aria-controls', answer.id);
    btn.setAttribute('aria-expanded', String(item.classList.contains('open')));
    const icon = btn.querySelector('.faq-plus');
    if (icon) icon.setAttribute('aria-hidden', 'true');
  });
}

function toggleMoreFaq(btn) {
  const section = btn.closest('.section');
  const more = section && section.querySelector('.faq-more');
  if (!more) return;
  const isOpen = more.classList.toggle('open');
  btn.textContent = isOpen ? '收起部分問題 ↑' : '觀看更多問題 ↓';
  btn.setAttribute('aria-expanded', String(isOpen));
}

function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const output = form.querySelector('[data-form-output]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const text = [
      '我想先諮詢八大工作：',
      `稱呼：${data.get('name') || '未填'}`,
      `聯絡方式：${data.get('contactWay') || '未填'}`,
      `聯絡 ID：${data.get('contactId') || '未填'}`,
      `想問方向：${data.get('topic') || '未填'}`,
      `想說的話：${data.get('message') || '未填'}`
    ].join('\n');
    output.textContent = `${text}\n\n你可以複製這段訊息　點 LINE 傳給我`;
    output.classList.add('show');
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  });
}

function copyQuestion(btn) {
  const card = btn.closest('.copy-card');
  const question = card ? card.querySelector('h3')?.textContent.trim() : '';
  if (!question) return;
  const text = question;
  const done = () => {
    btn.textContent = '已複製';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '點我複製';
      btn.classList.remove('copied');
    }, 1200);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done).catch(done);
  } else {
    done();
  }
}

let incomeMode = 'club';
function setIncomeMode(mode) {
  incomeMode = mode;
  document.querySelectorAll('[data-income-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.incomeMode === mode);
  });
  const rate = document.getElementById('income-rate');
  const hours = document.getElementById('income-hours');
  const days = document.getElementById('income-days');
  const label = document.getElementById('income-rate-label');
  if (rate) {
    rate.min = mode === 'beauty' ? 1400 : 230;
    rate.max = mode === 'beauty' ? 2000 : 290;
    rate.step = mode === 'beauty' ? 100 : 10;
    rate.value = mode === 'beauty' ? 1600 : 260;
  }
  if (hours) hours.value = mode === 'beauty' ? 4 : 6;
  if (days) days.value = 3;
  if (label) label.firstChild.textContent = mode === 'beauty' ? '台費 ' : '節薪（10分鐘） ';
  calculateIncome();
}

function formatMoney(value) {
  return Math.round(value).toLocaleString('zh-TW');
}

function calculateIncome() {
  const days = Number(document.getElementById('income-days')?.value || 0);
  const hours = Number(document.getElementById('income-hours')?.value || 0);
  const rate = Number(document.getElementById('income-rate')?.value || 0);
  const dailyEl = document.getElementById('income-daily');
  const weeklyEl = document.getElementById('income-weekly');
  const monthlyEl = document.getElementById('income-monthly');
  const note = document.getElementById('income-note');
  if (!dailyEl || !weeklyEl || !monthlyEl || !note) return;
  const daysValue = document.getElementById('income-days-value');
  const hoursValue = document.getElementById('income-hours-value');
  const rateValue = document.getElementById('income-rate-value');
  if (daysValue) daysValue.textContent = `${days} 天`;
  if (hoursValue) hoursValue.textContent = `${hours} 小時`;
  if (rateValue) rateValue.textContent = `${rate} 元`;
  const monthlyDays = days * 4;
  if (incomeMode === 'beauty') {
    const dailyBase = hours * rate;
    const dailyTip = (hours / 3) * 13000;
    const daily = dailyBase + dailyTip;
    const weekly = daily * days;
    const monthly = weekly * 4;
    dailyEl.textContent = `約 ${formatMoney(daily)} 元`;
    weeklyEl.textContent = `約 ${formatMoney(weekly)} 元`;
    monthlyEl.textContent = `約 ${formatMoney(monthly)} 元`;
    note.innerHTML = '美容師以台費加小費試算<br>小費抓每 3 小時 13000 元';
    return;
  }
  const sectionsPerDay = hours * 6;
  const daily = sectionsPerDay * rate;
  const weekly = daily * days;
  const monthly = weekly * 4;
  dailyEl.textContent = `約 ${formatMoney(daily)} 元`;
  weeklyEl.textContent = `約 ${formatMoney(weekly)} 元`;
  monthlyEl.textContent = `約 ${formatMoney(monthly)} 元`;
  note.innerHTML = '酒店以 10 分鐘一節計算<br>節薪依你選擇的數字試算';
}

function initIncomeTool() {
  if (!document.getElementById('income-monthly')) return;
  document.querySelectorAll('[data-income-mode]').forEach(btn => {
    btn.addEventListener('click', () => setIncomeMode(btn.dataset.incomeMode || 'club'));
  });
  ['income-days', 'income-hours', 'income-rate'].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', calculateIncome);
    input.addEventListener('change', calculateIncome);
  });
  calculateIncome();
}

const contactQuizResults = [
  { title:'你適合先從收入方向了解', desc:'你現在最需要的是先把薪資規則看懂<br>我會先跟你講清楚節薪　台費　發薪和可能扣款<br>不用急著試做　先知道大概範圍再決定' },
  { title:'你適合先確認時間和彈性', desc:'你比較在意能不能配合生活<br>建議先問清楚每週天數　每天時數　請假方式<br>我會依照你的時間幫你篩比較適合的方向' },
  { title:'你適合先做匿名了解', desc:'你目前還在觀望很正常<br>可以先問工作內容　店型差異　隱私保護<br>我會先講清楚　不會要求你馬上決定' },
  { title:'你適合先一對一判斷方向', desc:'你的狀況可能不是單一答案<br>我會依照你的條件　顧慮　可上班時間<br>幫你判斷比較適合酒店　美容師或先不要急著做' }
];
const contactQuizAnswers = [];

function nextContactQuiz(step, ans = 0) {
  contactQuizAnswers[step] = ans;
  const current = document.querySelector(`[data-contact-quiz-step="${step}"]`);
  const next = document.querySelector(`[data-contact-quiz-step="${step + 1}"]`);
  const currentDot = document.getElementById(`contact-qdot-${step}`);
  if (currentDot) currentDot.classList.add('done');
  if (current) current.classList.remove('active');
  if (next) {
    next.classList.add('active');
    const nextDot = document.getElementById(`contact-qdot-${step + 1}`);
    if (nextDot) nextDot.classList.add('active');
    return;
  }
  const result = document.getElementById('contact-quiz-result');
  const title = document.getElementById('contact-quiz-title');
  const desc = document.getElementById('contact-quiz-desc');
  const copy = contactQuizResults[ans] || contactQuizResults[0];
  if (title) title.textContent = copy.title;
  if (desc) desc.innerHTML = copy.desc;
  if (result) result.classList.add('show');
}

function restartContactQuiz() {
  contactQuizAnswers.length = 0;
  document.querySelectorAll('[data-contact-quiz-step]').forEach(step => step.classList.remove('active'));
  const first = document.querySelector('[data-contact-quiz-step="0"]');
  if (first) first.classList.add('active');
  document.querySelectorAll('.quiz-progress-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === 0);
    dot.classList.remove('done');
  });
  const result = document.getElementById('contact-quiz-result');
  if (result) result.classList.remove('show');
}

function initTotalViews() {
  const els = document.querySelectorAll('[data-total-views]');
  if (!els.length) return;
  const startDate = new Date('2026-03-01');
  const startCount = 28547;
  const today = new Date();
  const days = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  let total = startCount;
  for (let i = 0; i < days; i++) {
    const seed = i * 7919 + 3571;
    total += 543 + (seed % 701);
  }
  els.forEach(el => { el.textContent = total.toLocaleString('zh-TW'); });
}

function initRevealAnimations() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll([
    '.hero .container > *',
    '.section > .container > *',
    '.final-contact-inner > *',
    'footer > *'
  ].join(','));
  items.forEach((el, index) => {
    if (!el.classList.contains('reveal-soft')) el.classList.add('reveal-soft');
    el.style.transitionDelay = reduceMotion ? '0ms' : `${Math.min(index % 5, 4) * 45}ms`;
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => observer.observe(el));
}

function initMobileFloatingContact() {
  const floats = document.querySelectorAll('.site-line-float');
  if (!floats.length) return;
  const update = () => {
    const show = window.innerWidth > 900 || window.scrollY > Math.min(460, window.innerHeight * .62);
    floats.forEach(item => item.classList.toggle('mobile-visible', show));
  };
  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update, { passive:true });
}

function initVelvetBackground() {
  if (document.getElementById('velvet-bg')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'velvet-bg';
  canvas.className = 'velvet-background-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  document.body.classList.add('velvet-background');

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let time = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  const folds = [
    { x:.15, y:.10, tx:.75, ty:.55, speed:.00002, phase:0 },
    { x:.05, y:.40, tx:.60, ty:.90, speed:.00002, phase:1.2 },
    { x:.30, y:0, tx:.95, ty:.70, speed:.00002, phase:2.4 }
  ];
  const bumps = [
    { x:.55, y:.35, r:.42, speed:.000002, phase:0 },
    { x:.25, y:.65, r:.35, speed:.000002, phase:1.8 },
    { x:.75, y:.75, r:.30, speed:.000002, phase:3.2 }
  ];

  function drawFold(fold) {
    const drift = Math.sin(time * fold.speed * 1000 + fold.phase) * .06;
    const x1 = (fold.x + drift) * width;
    const y1 = (fold.y + drift * .5) * height;
    const x2 = (fold.tx - drift) * width;
    const y2 = (fold.ty - drift * .3) * height;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const nx = -(y2 - y1) / length;
    const ny = (x2 - x1) / length;
    const foldWidth = Math.max(width, height) * (.28 + Math.sin(time * fold.speed * 800 + fold.phase) * .04);
    const gradient = ctx.createLinearGradient(
      x1 + nx * foldWidth,
      y1 + ny * foldWidth,
      x1 - nx * foldWidth,
      y1 - ny * foldWidth
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(.35, 'rgba(0,0,0,0)');
    gradient.addColorStop(.48, 'rgba(72,70,68,.08)');
    gradient.addColorStop(.5, 'rgba(95,92,88,.13)');
    gradient.addColorStop(.52, 'rgba(72,70,68,.08)');
    gradient.addColorStop(.65, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.beginPath();
    const ex = (x2 - x1) / length;
    const ey = (y2 - y1) / length;
    const extension = Math.max(width, height) * 2;
    ctx.moveTo(x1 - ex * extension + nx * foldWidth, y1 - ey * extension + ny * foldWidth);
    ctx.lineTo(x2 + ex * extension + nx * foldWidth, y2 + ey * extension + ny * foldWidth);
    ctx.lineTo(x2 + ex * extension - nx * foldWidth, y2 + ey * extension - ny * foldWidth);
    ctx.lineTo(x1 - ex * extension - nx * foldWidth, y1 - ey * extension - ny * foldWidth);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  function drawBump(bump) {
    const drift = Math.sin(time * bump.speed * 1000 + bump.phase);
    const cx = (bump.x + drift * .07) * width;
    const cy = (bump.y + Math.cos(time * bump.speed * 800 + bump.phase) * .06) * height;
    const radius = bump.r * Math.max(width, height);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(88,85,80,.20)');
    gradient.addColorStop(.25, 'rgba(65,62,58,.14)');
    gradient.addColorStop(.55, 'rgba(30,28,26,.07)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function draw() {
    time += 1;
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, width, height);
    if (!reduceMotion) {
      bumps.forEach(drawBump);
      folds.forEach(drawFold);
    }
    const vignette = ctx.createRadialGradient(
      width * .5,
      height * .45,
      0,
      width * .5,
      height * .45,
      Math.max(width, height) * .78
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(.55, 'rgba(0,0,0,.18)');
    vignette.addColorStop(.8, 'rgba(0,0,0,.55)');
    vignette.addColorStop(1, 'rgba(0,0,0,.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    if (!reduceMotion && !document.hidden) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize, { passive:true });
  draw();
}

document.addEventListener('DOMContentLoaded', () => {
  initVelvetBackground();
  initWeeklyCount();
  initContactForm();
  initIncomeTool();
  initFaqAccessibility();
  initTotalViews();
  initRevealAnimations();
  initMobileFloatingContact();
});
