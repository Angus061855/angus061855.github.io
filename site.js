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
    output.textContent = `${text}\n\n你可以複製這段訊息，點 LINE 傳給我。`;
    output.classList.add('show');
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initWeeklyCount();
  initContactForm();
});
