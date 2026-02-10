import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  /**
   * Threshold for triggering reveal (0-1)
   * 0 = element starts entering viewport
   * 1 = element fully in viewport
   * @default 0.1
   */
  threshold?: number;
  
  /**
   * Root margin for intersection observer
   * @default '0px'
   */
  rootMargin?: string;
  
  /**
   * Whether to trigger only once or every time element enters viewport
   * @default true
   */
  once?: boolean;
  
  /**
   * Delay before triggering reveal (milliseconds)
   * @default 0
   */
  delay?: number;
  
  /**
   * Disable animations (respects prefers-reduced-motion)
   * @default false
   */
  disabled?: boolean;
}

/**
 * Custom hook to reveal elements as they scroll into view
 * Uses Intersection Observer API for performance
 * Respects prefers-reduced-motion preference
 * 
 * @example
 * const ref = useScrollReveal({ threshold: 0.2, delay: 100 });
 * return <div ref={ref} className="reveal-on-scroll">Content</div>
 */
export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    once = true,
    delay = 0,
    disabled = false,
  } = options;

  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    // Intersection Observer callback
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Apply delay if specified
          if (delay > 0) {
            timeoutRef.current = setTimeout(() => {
              setIsVisible(true);
            }, delay);
          } else {
            setIsVisible(true);
          }

          // Disconnect observer if once=true
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          // Reset visibility if element leaves viewport and once=false
          setIsVisible(false);
        }
      });
    };

    // Create observer
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    // Start observing
    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [threshold, rootMargin, once, delay, disabled]);

  return { ref: elementRef, isVisible };
}

/**
 * Wrapper component for scroll reveal animations
 * Automatically applies CSS classes based on visibility
 */
interface ScrollRevealProps extends UseScrollRevealOptions {
  children: React.ReactNode;
  className?: string;
  /**
   * Animation variant
   * @default 'fade-up'
   */
  variant?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'fade' | 'scale' | 'none';
}

export function ScrollReveal({
  children,
  className = '',
  variant = 'fade-up',
  ...options
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>(options);

  const baseClasses = 'scroll-reveal-element';
  const visibilityClass = isVisible ? 'is-visible' : '';
  const variantClass = variant !== 'none' ? `reveal-${variant}` : '';

  return (
    <div
      ref={ref}
      className={`${baseClasses} ${variantClass} ${visibilityClass} ${className}`}
    >
      {children}
    </div>
  );
}
