/* ========================================
   SHADOWS OVER THORNFALL - MAIN JS
   The Shadow Guard Trilogy
   ======================================== */

(function() {
  'use strict';

  /* ==================== FADE-IN ON SCROLL ==================== */
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  function initFadeInAnimations() {
    const fadeElements = document.querySelectorAll(
      '.book-card, .character-card, .timeline-item, .about-content, .accordion-item'
    );
    
    fadeElements.forEach(el => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }

  /* ==================== SMOOTH SCROLL ==================== */
  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        
        if (targetId === '#' || this.hasAttribute('data-bs-toggle')) {
          return;
        }
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          e.preventDefault();
          const offsetTop = targetElement.offsetTop - 20;
          window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
      });
    });
  }

  /* ==================== CHARACTER CARD KEYBOARD ==================== */
  
  function initCharacterCardKeyboard() {
    const characterCards = document.querySelectorAll('.character-card');
    
    characterCards.forEach(card => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      
      card.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }

  /* ==================== PROGRESS BAR ANIMATION ==================== */
  
  function initProgressBarAnimation() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    const progressObserver = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const progressBar = entry.target;
          const targetWidth = progressBar.style.width;
          progressBar.style.width = '0%';
          setTimeout(() => { progressBar.style.width = targetWidth; }, 200);
          progressObserver.unobserve(progressBar);
        }
      });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => progressObserver.observe(bar));
  }

  /* ==================== TOOLTIPS ==================== */
  
  function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
  }

  /* ==================== MODAL FOCUS ==================== */
  
  function initModalFocusTrap() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
      modal.addEventListener('shown.bs.modal', function() {
        const focusable = this.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) focusable[0].focus();
      });
    });
  }

  /* ==================== EXTERNAL LINKS ==================== */
  
  function initExternalLinks() {
    document.querySelectorAll('a[href^="http"]').forEach(link => {
      if (link.hostname !== window.location.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /* ==================== INITIALIZE ==================== */
  
  function init() {
    initFadeInAnimations();
    initSmoothScroll();
    initCharacterCardKeyboard();
    initProgressBarAnimation();
    initTooltips();
    initModalFocusTrap();
    initExternalLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ShadowGuardTrilogy = { version: '1.0.0', init: init };

})();
