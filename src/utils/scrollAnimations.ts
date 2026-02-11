/**
 * Scroll-triggered animations using IntersectionObserver
 * 
 * Features:
 * - Respects prefers-reduced-motion
 * - Staggered animations for child elements
 * - Smooth, subtle transitions
 * - No heavy JS libraries
 */

export function initScrollAnimations() {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    // Remove animation classes and show all elements immediately
    document.querySelectorAll('[data-animate]').forEach((el) => {
      el.classList.add('animate-visible');
    });
    return;
  }

  // Animation options
  const observerOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1,
  };

  // Create observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        const delay = el.dataset.animateDelay || '0';
        const staggerIndex = parseInt(el.dataset.animateStagger || '0', 10);
        
        // Apply staggered delay
        const totalDelay = parseInt(delay, 10) + (staggerIndex * 100);
        
        setTimeout(() => {
          el.classList.add('animate-visible');
        }, totalDelay);
        
        observer.unobserve(el);
      }
    });
  }, observerOptions);

  // Observe all elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach((el, index) => {
    // Set stagger index if in a group
    const parent = el.parentElement;
    if (parent) {
      const siblings = parent.querySelectorAll('[data-animate]');
      siblings.forEach((sibling, sibIndex) => {
        if (sibling === el) {
          (el as HTMLElement).dataset.animateStagger = sibIndex.toString();
        }
      });
    }
    
    observer.observe(el);
  });
}

// Auto-initialize on DOMContentLoaded
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}
