(function () {
  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const downloadLinks = document.querySelectorAll('a[download]');

  downloadLinks.forEach((link) => {
    link.addEventListener('click', () => {
      link.dataset.clicked = 'true';
    });
  });
})();
