(function () {
  const creatorUrl = 'https://mattlivingston.com';
  const toolsUrl = '../';

  function normalizeExternalCredits() {
    document.querySelectorAll('a[href^="https://mattlivingston.com"]').forEach((link) => {
      if (link.target === '_blank') {
        const rel = new Set((link.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.rel = Array.from(rel).join(' ');
      }
    });
  }

  function addCredit() {
    if (document.querySelector('.ml-tool-credit')) return;

    normalizeExternalCredits();

    const credit = document.createElement('aside');
    credit.className = 'ml-tool-credit';
    credit.setAttribute('aria-label', 'Tool credit');
    credit.innerHTML = [
      '<div class="ml-tool-credit__inner">',
      '<span>Built by <a href="' + creatorUrl + '">Matt Livingston</a></span>',
      '<span class="ml-tool-credit__dot" aria-hidden="true"></span>',
      '<a href="' + toolsUrl + '">All tools</a>',
      '<span class="ml-tool-credit__dot" aria-hidden="true"></span>',
      '<span class="ml-tool-credit__privacy">Runs in your browser</span>',
      '</div>'
    ].join('');

    document.body.appendChild(credit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCredit);
  } else {
    addCredit();
  }
})();
