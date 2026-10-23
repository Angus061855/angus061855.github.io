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
    }
  });
})(window, document);
