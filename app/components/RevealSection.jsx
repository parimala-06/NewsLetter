"use client";

import { useEffect, useRef } from "react";

// A <section> that plays its entrance every time it scrolls into view, from
// either direction. data-reveal is "in" while the section is on screen and
// "pending" once it has fully left, so CSS keyed on [data-reveal="in"] replays
// on re-entry. Content stays visible without JS. Pass initial="in" for
// above-the-fold sections so their entrance plays on load without a flash.
const ENTER_RATIO = 0.15;

export default function RevealSection({ children, initial, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (!el.dataset.reveal) el.dataset.reveal = "pending";

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= ENTER_RATIO) {
          el.dataset.reveal = "in";
        } else if (!entry.isIntersecting) {
          el.dataset.reveal = "pending";
        }
      },
      { threshold: [0, ENTER_RATIO] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} data-reveal={initial} {...props}>
      {children}
    </section>
  );
}
