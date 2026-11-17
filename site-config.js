window.AS_SITE_CONFIG = Object.freeze({
  officialInstagram: 'https://www.instagram.com/asent0618/',
  // 原有估算公式的起始值；不是逐筆登記的實際面試人數。
  interviewCount: 3000,
  getInterviewCount: function (now) {
    var startDate = new Date('2026-03-01');
    var days = Math.floor(((now || new Date()) - startDate) / 86400000);
    var total = window.AS_SITE_CONFIG.interviewCount;
    for (var index = 0; index < days; index += 1) {
      var date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + index);
      var seed = date.toISOString().slice(0, 10);
      total += (seed.split('').reduce(function (sum, character) { return sum + character.charCodeAt(0); }, 0) % 5) + 1;
    }
    return total;
  }
});

document.addEventListener('DOMContentLoaded', function () {
  var count = window.AS_SITE_CONFIG.getInterviewCount();
  document.querySelectorAll('[data-interview-count]').forEach(function (el) {
    el.textContent = String(count) + (el.textContent.includes('+') ? '+' : '');
  });
  document.querySelectorAll('[aria-label*="個人面試人數"], [data-final]').forEach(function (el) {
    ['aria-label', 'data-final'].forEach(function (attribute) {
      var value = el.getAttribute(attribute);
      if (value) el.setAttribute(attribute, value.replace(/\b3000\b/g, String(count)));
    });
  });
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
