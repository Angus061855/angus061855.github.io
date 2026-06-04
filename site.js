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
      btn.textContent = '按一下複製';
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
  const label = document.getElementById('income-rate-label');
  if (rate) rate.value = mode === 'beauty' ? 1600 : 260;
  if (hours) hours.value = mode === 'beauty' ? 4 : 6;
  if (label) label.textContent = mode === 'beauty' ? '一台（時薪）' : '節薪 / 時薪';
  calculateIncome();
}

function formatMoney(value) {
  return Math.round(value).toLocaleString('zh-TW');
}

function calculateIncome() {
  const days = Number(document.getElementById('income-days')?.value || 0);
  const hours = Number(document.getElementById('income-hours')?.value || 0);
  const rate = Number(document.getElementById('income-rate')?.value || 0);
  const result = document.getElementById('income-result');
  const note = document.getElementById('income-note');
  if (!result || !note) return;
  const monthlyDays = days * 4;
  if (incomeMode === 'beauty') {
    const base = monthlyDays * hours * rate;
    const tipLow = monthlyDays * (hours / 3) * 10000;
    const tipHigh = monthlyDays * (hours / 3) * 15000;
    result.textContent = `約 ${formatMoney(base + tipLow)} - ${formatMoney(base + tipHigh)} 元`;
    note.textContent = '美容師以一台時薪粗估　常見約 1400 到 2000 元　小費約每 3 小時 10000 到 15000 元　實際依店型與客人狀況不同';
    return;
  }
  const sectionsPerDay = hours * 6;
  const monthly = monthlyDays * sectionsPerDay * rate;
  result.textContent = `約 ${formatMoney(monthly)} 元`;
  note.textContent = '酒店以 10 分鐘一節粗估　實際依上檯率　店型　時段與發薪規則不同';
}

function initIncomeTool() {
  if (!document.getElementById('income-result')) return;
  calculateIncome();
}

function nextContactQuiz(step) {
  const current = document.querySelector(`[data-contact-quiz-step="${step}"]`);
  const next = document.querySelector(`[data-contact-quiz-step="${step + 1}"]`);
  if (current) current.classList.remove('active');
  if (next) {
    next.classList.add('active');
    return;
  }
  const result = document.getElementById('contact-quiz-result');
  if (result) result.classList.add('show');
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
