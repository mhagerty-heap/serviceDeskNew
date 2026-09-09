document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.sd-flash').forEach(function (el) {
    setTimeout(function () {
      el.style.transition = 'opacity .3s ease';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 300);
    }, 5000);
  });
});
