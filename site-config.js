window.AS_SITE_CONFIG = Object.freeze({
  officialInstagram: 'https://www.instagram.com/as.mask_/'
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-official-instagram]').forEach(function (link) {
    link.href = window.AS_SITE_CONFIG.officialInstagram;
  });
});
