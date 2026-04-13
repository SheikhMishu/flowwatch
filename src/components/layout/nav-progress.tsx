"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = useRef(pathname);

  // Start progress bar on internal link clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      // Strip query params before comparing — links with ?instance=X pointing to the current
      // page should not trigger the progress bar (pathname won't change, bar would get stuck)
      const hrefPath = href.split("?")[0];
      if (hrefPath === pathname) return;

      setVisible(true);
      setWidth(15);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setWidth((w) => {
          if (w >= 85) {
            clearInterval(timerRef.current!);
            return 85;
          }
          return w + Math.random() * 8;
        });
      }, 300);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // Complete when pathname changes
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (timerRef.current) clearInterval(timerRef.current);
    setWidth(100);

    const hide = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);

    return () => clearTimeout(hide);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] bg-primary transition-all duration-300 ease-out pointer-events-none"
      style={{ width: `${width}%`, opacity: visible ? 1 : 0 }}
    />
  );
}
