"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * ارتفاع واقعی المنت را با ResizeObserver برمی‌گرداند (برای فضای زیر نوار fixed).
 */
export function useResizeObserverHeight(
  ref: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      setHeight(0);
      return;
    }

    const measure = () => {
      setHeight(el.getBoundingClientRect().height);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when footer content changes
  }, [ref, ...deps]);

  return height;
}
