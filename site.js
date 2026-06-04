const CONTACTS = {
  line: 'https://line.me/ti/p/tTUQTPHKrE',
  wechat: '#wechat',
  telegram: '#telegram'
};

function toggleMobileMenu() {
  const menu = document.querySelector('.mobile-menu');
  const btn = document.querySelector('.mobile-menu-btn');
  const isOpen = menu && menu.classList.toggle('open');
  if (btn) btn.setAttribute('aria-expanded', String(Boolean(isOpen)));
}

function initIncomeCalculator() {
  const root = document.querySelector('[data-income-calculator]');
  if (!root) return;

  const days = root.querySelector('#work-days');
  const hours = root.querySelector('#work-hours');
  const rate = root.querySelector('#section-rate');
  const daysOut = root.querySelector('[data-days-output]');
  const hoursOut = root.querySelector('[data-hours-output]');
  const rateOut = root.querySelector('[data-rate-output]');
  const monthlyOut = root.querySelector('[data-monthly-output]');
  const sectionsOut = root.querySelector('[data-sections-output]');

  function format(num) {
    return Math.round(num).toLocaleString('zh-TW');
  }

  function update() {
    const d = Number(days.value);
    const h = Number(hours.value);
    const r = Number(rate.value);
    const sectionsPerDay = h * 6;
    const weekly = sectionsPerDay * r * d;
    const monthly = weekly * 4.3;

    daysOut.textContent = `${d} 天`;
    hoursOut.textContent = `${h} 小時`;
    rateOut.textContent = `${r} 元`;
    sectionsOut.textContent = `${format(sectionsPerDay * d)} 節 / 週`;
    monthlyOut.textContent = `$${format(monthly)}`;
  }

  [days, hours, rate].forEach(input => input.addEventListener('input', update));
  update();
}

const aiAnswers = {
  salary: '收入會受店型、時段、上檯率、個人狀態和發薪規則影響。網站上的試算只能當參考，不保證實際收入。想知道自己適合哪種店型，建議加 LINE 讓真人幫你看狀況。',
  contract: '我這邊主張不簽合約、不靠違約金綁人。你可以先了解，覺得不適合就不要做。任何要求簽不清楚合約、壓證件或用違約金威脅的狀況，都建議先停下來問清楚。',
  privacy: '隱私要先問清楚：資料誰會看到、工作地點怎麼安排、會不會通知家人朋友、照片是否外流。保守原則是：沒有確認前不要給過多個資，也不要交出證件正本。',
  newbie: '沒有經驗可以先了解，不需要一開始就決定。你可以先問工作內容、穿著、喝酒、請假、薪資、離職方式和隱私保護。問問題不代表你要來做。',
  trial: '試做前建議先確認：幾點到幾點、薪資怎麼算、有沒有扣款、能不能當天領、工作內容界線、如果不適合怎麼離開。這些問清楚，比急著去面試更重要。'
};

function toggleAiConsult(force) {
  const widget = document.querySelector('.ai-widget');
  if (!widget) return;
  const open = typeof force === 'boolean' ? force : !widget.classList.contains('open');
  widget.classList.toggle('open', open);
}

function askAi(topic) {
  const answer = document.querySelector('.ai-answer');
  if (!answer) return;
  answer.innerHTML = `${aiAnswers[topic] || aiAnswers.newbie}<br><br><a href="${CONTACTS.line}" target="_blank" rel="noopener noreferrer">想問真人，點這裡加 LINE。</a>`;
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
    output.textContent = `${text}\n\n你可以複製這段訊息，點 LINE 傳給我。`;
    output.classList.add('show');
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initWeeklyCount();
  initIncomeCalculator();
  initContactForm();
  const aiWidget = document.querySelector('.ai-widget');
  if (aiWidget) askAi('newbie');
});
