'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!ref.current || hasAnimated) return;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent =
            prefix +
            obj.val.toLocaleString('pt-BR', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }) +
            suffix;
        }
      },
    });

    setHasAnimated(true);
  }, [value, duration, decimals, prefix, suffix, hasAnimated]);

  // Valor inicial enquanto não anima
  const initialValue =
    prefix +
    (0).toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  return (
    <span ref={ref} className={className}>
      {initialValue}
    </span>
  );
}
