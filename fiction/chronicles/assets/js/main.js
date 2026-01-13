/* ========================================
   CHRONICLES OF MARREK LOCKE - MAIN JS
   ======================================== */

(function() {
  'use strict';

  /* ==================== FADE-IN ON SCROLL ==================== */
  
  // Intersection Observer for fade-in animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optionally unobserve after animation to improve performance
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add fade-in class to elements and observe them
  function initFadeInAnimations() {
    const fadeElements = document.querySelectorAll(
      '.book-card, .character-card, .timeline-item, .ship-stats, .infographic-container, .map-container, .accordion-item'
    );
    
    fadeElements.forEach(el => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }

  /* ==================== SMOOTH SCROLL ==================== */
  
  // Smooth scroll for anchor links
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        
        // Ignore if it's just "#" or if it's a Bootstrap toggle
        if (targetId === '#' || this.hasAttribute('data-bs-toggle')) {
          return;
        }
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          e.preventDefault();
          
          const offsetTop = targetElement.offsetTop - 20; // 20px offset from top
          
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /* ==================== NAVBAR SCROLL EFFECT (IF ADDED LATER) ==================== */
  
  // Placeholder for future navbar functionality
  // If you add a fixed navbar later, this function can add a class on scroll
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  /* ==================== DOWNLOAD BUTTON HANDLING ==================== */
  
  // Handle download button clicks
  function initDownloadButtons() {
    const downloadButtons = document.querySelectorAll('.btn-download:not(:disabled)');
    
    downloadButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        // For now, this is a placeholder
        // When you have actual download files, update the logic here
        
        const bookCard = this.closest('.book-card');
        const bookTitle = bookCard ? bookCard.querySelector('.book-title').textContent : 'Book';
        
        console.log(`Download requested for: ${bookTitle}`);
        
        // Future implementation:
        // window.location.href = 'assets/downloads/ghost-in-the-black-chapter-1.pdf';
        
        // Temporary alert for demonstration
        alert('Download functionality will be enabled once files are available. Check back soon!');
      });
    });
  }

  /* ==================== CHARACTER MODAL ENHANCEMENTS ==================== */
  
  // Add keyboard navigation for character cards
  function initCharacterCardKeyboard() {
    const characterCards = document.querySelectorAll('.character-card');
    
    characterCards.forEach(card => {
      // Make cards keyboard accessible
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      
      // Allow Enter key to open modal
      card.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }

  /* ==================== ACCORDION AUTO-CLOSE ENHANCEMENT ==================== */
  
  // Ensure only one accordion item is open at a time (optional enhancement)
  function initAccordionBehavior() {
    const accordions = document.querySelectorAll('.accordion');
    
    accordions.forEach(accordion => {
      const items = accordion.querySelectorAll('.accordion-collapse');
      
      items.forEach(item => {
        item.addEventListener('show.bs.collapse', function() {
          // Optional: Close other items in same accordion
          // Uncomment if you want only one open at a time
          /*
          const parent = this.closest('.accordion');
          const siblings = parent.querySelectorAll('.accordion-collapse.show');
          siblings.forEach(sibling => {
            if (sibling !== this) {
              bootstrap.Collapse.getInstance(sibling)?.hide();
            }
          });
          */
        });
      });
    });
  }

  /* ==================== PROGRESS BAR ANIMATION ==================== */
  
  // Animate progress bars when they come into view
  function initProgressBarAnimation() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    const progressObserver = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const progressBar = entry.target;
          const targetWidth = progressBar.style.width;
          
          // Reset width to 0 for animation
          progressBar.style.width = '0%';
          
          // Trigger animation after a brief delay
          setTimeout(() => {
            progressBar.style.width = targetWidth;
          }, 200);
          
          progressObserver.unobserve(progressBar);
        }
      });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => {
      progressObserver.observe(bar);
    });
  }

  /* ==================== TOOLTIP INITIALIZATION ==================== */
  
  // Initialize Bootstrap tooltips if any are present
  function initTooltips() {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    
    tooltipTriggerList.map(function(tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  /* ==================== COPY TO CLIPBOARD (FUTURE FEATURE) ==================== */
  
  // Placeholder for future "copy link" or "copy email" functionality
  function initCopyToClipboard() {
    const copyButtons = document.querySelectorAll('[data-copy]');
    
    copyButtons.forEach(button => {
      button.addEventListener('click', function() {
        const textToCopy = this.getAttribute('data-copy');
        
        navigator.clipboard.writeText(textToCopy).then(() => {
          // Show success message
          const originalText = this.textContent;
          this.textContent = 'Copied!';
          
          setTimeout(() => {
            this.textContent = originalText;
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy:', err);
        });
      });
    });
  }

  /* ==================== EXTERNAL LINK HANDLING ==================== */
  
  // Add target="_blank" and rel="noopener noreferrer" to external links
  function initExternalLinks() {
    const links = document.querySelectorAll('a[href^="http"]');
    
    links.forEach(link => {
      // Check if link is external (not same domain)
      if (link.hostname !== window.location.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /* ==================== SCROLL TO TOP BUTTON (OPTIONAL) ==================== */
  
  // Show/hide scroll to top button
  function initScrollToTop() {
    // Check if scroll-to-top button exists in HTML
    const scrollButton = document.querySelector('.scroll-to-top');
    
    if (!scrollButton) return;
    
    window.addEventListener('scroll', function() {
      if (window.scrollY > 500) {
        scrollButton.classList.add('visible');
      } else {
        scrollButton.classList.remove('visible');
      }
    });
    
    scrollButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /* ==================== LAZY LOADING IMAGES (ENHANCEMENT) ==================== */
  
  // Native lazy loading is already handled by HTML loading="lazy"
  // This is a fallback for older browsers
  function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      return;
    }
    
    // Fallback for older browsers
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  }

  /* ==================== ACCESSIBILITY ENHANCEMENTS ==================== */
  
  // Skip navigation for keyboard users
  function initSkipNav() {
    const skipLink = document.querySelector('.skip-nav');
    
    if (!skipLink) return;
    
    skipLink.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  /* ==================== MODAL ACCESSIBILITY ==================== */
  
  // Trap focus within modals when open
  function initModalFocusTrap() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
      modal.addEventListener('shown.bs.modal', function() {
        const focusableElements = this.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      });
    });
  }

  /* ==================== PRELOAD CRITICAL IMAGES ==================== */
  
  // Preload hero images or other critical assets
  function preloadCriticalImages() {
    const criticalImages = [
      // Add paths to critical images here
      // 'assets/images/hero-background.jpg',
    ];
    
    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  /* ==================== PERFORMANCE MONITORING (OPTIONAL) ==================== */
  
  // Log page load performance (optional, for development)
  function logPerformance() {
    if (!window.performance) return;
    
    window.addEventListener('load', function() {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      console.log(`Page load time: ${pageLoadTime}ms`);
    });
  }

  /* ==================== INITIALIZE ALL FUNCTIONS ==================== */
  
  function init() {
    // Core functionality
    initFadeInAnimations();
    initSmoothScroll();
    initDownloadButtons();
    initCharacterCardKeyboard();
    initAccordionBehavior();
    initProgressBarAnimation();
    
    // Bootstrap components
    initTooltips();
    initModalFocusTrap();
    
    // Enhancements
    initExternalLinks();
    initLazyLoading();
    initSkipNav();
    
    // Optional features (uncomment if needed)
    // initScrollToTop();
    // initNavbarScroll();
    // initCopyToClipboard();
    // preloadCriticalImages();
    
    // Development only (comment out for production)
    // logPerformance();
  }

  /* ==================== DOM READY ==================== */
  
  // Initialize when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ==================== EXPOSE PUBLIC API (OPTIONAL) ==================== */
  
  // Expose certain functions globally if needed
  window.MarrekChronicles = {
    version: '1.0.0',
    init: init,
    // Add other public methods here if needed
  };

})();

/* ==================== UTILITY FUNCTIONS ==================== */

// Debounce function for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/* ==================== CUSTOM EVENTS (OPTIONAL) ==================== */

// Example: Dispatch custom event when book card is clicked
/*
document.addEventListener('click', function(e) {
  const bookCard = e.target.closest('.book-card');
  if (bookCard) {
    const bookTitle = bookCard.querySelector('.book-title').textContent;
    const customEvent = new CustomEvent('bookCardClick', {
      detail: { title: bookTitle }
    });
    document.dispatchEvent(customEvent);
  }
});

// Listen for custom event
document.addEventListener('bookCardClick', function(e) {
  console.log('Book card clicked:', e.detail.title);
});
*/