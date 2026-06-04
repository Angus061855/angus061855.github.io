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
  document.querySelectorAll('.faq-item').forEach(faq => faq.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
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
  const text = `我想問：${question}`;
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
  if (label) label.firstChild.textContent = mode === 'beauty' ? '一台（時薪） ' : '節薪 ';
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
    const dailyTipLow = (hours / 3) * 10000;
    const dailyTipHigh = (hours / 3) * 15000;
    const dailyLow = dailyBase + dailyTipLow;
    const dailyHigh = dailyBase + dailyTipHigh;
    const weeklyLow = dailyLow * days;
    const weeklyHigh = dailyHigh * days;
    const monthlyLow = weeklyLow * 4;
    const monthlyHigh = weeklyHigh * 4;
    dailyEl.textContent = `約 ${formatMoney(dailyLow)} - ${formatMoney(dailyHigh)} 元`;
    weeklyEl.textContent = `約 ${formatMoney(weeklyLow)} - ${formatMoney(weeklyHigh)} 元`;
    monthlyEl.textContent = `約 ${formatMoney(monthlyLow)} - ${formatMoney(monthlyHigh)} 元`;
    note.textContent = '美容師以一台為計量單位（時薪）　小費約每 3 小時 10000 到 15000 元';
    return;
  }
  const sectionsPerDay = hours * 6;
  const daily = sectionsPerDay * rate;
  const weekly = daily * days;
  const monthly = weekly * 4;
  dailyEl.textContent = `約 ${formatMoney(daily)} 元`;
  weeklyEl.textContent = `約 ${formatMoney(weekly)} 元`;
  monthlyEl.textContent = `約 ${formatMoney(monthly)} 元`;
  note.textContent = '酒店以 10 分鐘一節計算　節薪依你選擇的數字試算';
}

function initIncomeTool() {
  if (!document.getElementById('income-monthly')) return;
  calculateIncome();
}

const contactQuizResults = [
  { title:'你很適合先了解看看', desc:'你現在最需要的是資訊<br>不是決定<br>什麼都可以問　有問必答<br>了解清楚之後再做決定　沒有任何壓力' },
  { title:'你的顧慮都可以解決', desc:'隱私和合約問題<br>是我被問最多的兩件事<br>這兩件事我都有完整的答案<br>加我說清楚給你聽' },
  { title:'你已經準備好了', desc:'你知道自己要什麼<br>也願意行動<br>現在只差一個問題<br>加我詢問工作吧' },
  { title:'還在思考也沒關係', desc:'不確定很正常<br>很多人一開始也是這樣<br>問了才知道適不適合自己' }
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

document.addEventListener('DOMContentLoaded', () => {
  initWeeklyCount();
  initContactForm();
  initIncomeTool();
  initTotalViews();
});
