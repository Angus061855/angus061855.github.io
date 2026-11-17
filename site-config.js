window.AS_SITE_CONFIG = Object.freeze({
  officialInstagram: 'https://www.instagram.com/angus.no28/',
  // 個人面試人數（全站唯一來源；頁面顯示為「3000+」「超過 3000 位」）。
  // 2026-11-17 業主決定暫定 3000+，佐證資料待業主提供。修改後執行：node scripts/sync-site-facts.mjs
  interviewCount: 3000
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-official-instagram]').forEach(function (link) {
    link.href = window.AS_SITE_CONFIG.officialInstagram;
  });

  var contactHref = '/contact';
  if (window.location.protocol === 'file:') {
    contactHref = /\/(?:brand|highlights)\//.test(window.location.pathname) ? '../contact.html' : 'contact.html';
  }

  document.querySelectorAll('a[href="/brand"], a[href="/brand/"], a[href="/contact"], a[href="/contact/"]').forEach(function (link) {
    link.href = contactHref;
  });
});
