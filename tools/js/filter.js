// Tool Card Filtering
// Simple category filter for tools grid

(function() {
  'use strict';

  const filterButtons = document.querySelectorAll('.filter-btn');
  const toolCards = document.querySelectorAll('.tool-card');

  if (!filterButtons.length || !toolCards.length) return;

  function filterTools(category) {
    toolCards.forEach(card => {
      const cardCategory = card.dataset.category;
      if (category === 'all' || cardCategory === category) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  function setActiveButton(activeBtn) {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.dataset.filter;
      setActiveButton(this);
      filterTools(filter);
    });
  });

  // Handle URL hash for direct linking to filtered views
  function handleHash() {
    const hash = window.location.hash.slice(1);
    if (hash === 'warehouse' || hash === 'webdev') {
      const btn = document.querySelector(`[data-filter="${hash}"]`);
      if (btn) {
        setActiveButton(btn);
        filterTools(hash);
      }
    }
  }

  handleHash();
  window.addEventListener('hashchange', handleHash);
})();
