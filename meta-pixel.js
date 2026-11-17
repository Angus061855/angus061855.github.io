(function (window, document) {
  if (window.fbq) return;

  var fbq = window.fbq = function () {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments);
    } else {
      fbq.queue.push(arguments);
    }
  };

  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  fbq('init', '1576529224516912');
  fbq('track', 'PageView');

  function loadFacebookPixel() {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  if (window.requestIdleCallback) requestIdleCallback(loadFacebookPixel, { timeout: 2000 });
  else window.addEventListener('load', loadFacebookPixel, { once: true });

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    if (href.indexOf('line.me') !== -1 || href.indexOf('lin.ee') !== -1) {
      fbq('track', 'Contact', { channel: 'LINE' });
      // 已載入 GA4 的頁面同步記錄 LINE 點擊（只記頁面路徑與按鈕區塊，不含個人資料）
      if (typeof window.gtag === 'function') {
        var section = link.closest('section[id],footer,nav,[class*="float"]');
        window.gtag('event', 'line_click', {
          page_path: window.location.pathname,
          link_section: section ? (section.id || section.tagName.toLowerCase() || '').slice(0, 40) : 'other'
        });
      }
    }
  });
})(window, document);
