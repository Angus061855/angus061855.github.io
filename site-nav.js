// 共用主導覽列的手機選單開關（搭配 site-nav.css）
(function () {
  var btn = document.querySelector('.as-sitenav-btn');
  var menu = document.getElementById('as-sitenav-menu');
  if (!btn || !menu) return;
  function setOpen(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
  }
  btn.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (event) { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); btn.focus(); } });
})();
