"use client";

import { useEffect, useRef, useState } from "react";

const animations = {
  "fade-up": { hidden: "opacity-0 translate-y-8", visible: "opacity-100 translate-y-0" },
  "fade-down": { hidden: "opacity-0 -translate-y-8", visible: "opacity-100 translate-y-0" },
  "slide-left": { hidden: "opacity-0 -translate-x-16", visible: "opacity-100 translate-x-0" },
  "slide-right": { hidden: "opacity-0 translate-x-16", visible: "opacity-100 translate-x-0" },
  "scale": { hidden: "opacity-0 scale-90", visible: "opacity-100 scale-100" },
  "zoom": { hidden: "opacity-0 scale-75", visible: "opacity-100 scale-100" },
  "fade": { hidden: "opacity-0", visible: "opacity-100" },
};

export default function AnimateOnScroll({
  children,
  className = "",
  delay = 0,
  animation = "fade-up",
  duration = 700,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const anim = animations[animation] || animations["fade-up"];

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${visible ? anim.visible : anim.hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
