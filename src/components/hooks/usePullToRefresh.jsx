import { useRef, useEffect, useState } from 'react';

function getScrollParent(el) {
  let node = el.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflow + style.overflowY)) return node;
    node = node.parentElement;
  }
  return document.documentElement;
}

export function usePullToRefresh(onRefresh, threshold = 100) {
  const containerRef = useRef(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const isScrolledRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollParent = getScrollParent(container);

    const handleTouchStart = (e) => {
      // Check the actual scroll parent, not the container itself
      isScrolledRef.current = scrollParent.scrollTop > 0;
      if (!isScrolledRef.current) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (isScrolledRef.current) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;

      if (distance > 0) {
        e.preventDefault();
        setPullDistance(distance);
        setIsPulling(distance > threshold);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold) {
        setIsPulling(true);
        try {
          await onRefresh();
        } finally {
          setPullDistance(0);
          setIsPulling(false);
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, onRefresh]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    pullPercentage: Math.min((pullDistance / threshold) * 100, 100)
  };
}
