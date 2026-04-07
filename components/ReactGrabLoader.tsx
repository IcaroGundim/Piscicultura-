'use client';

import { useEffect } from 'react';

const SCRIPT_ID = 'react-grab-script';

export default function ReactGrabLoader() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://unpkg.com/react-grab/dist/index.global.js';
    script.crossOrigin = 'anonymous';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
