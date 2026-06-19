"use client";

import { useEffect } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, width = 420, children }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: 50,
        visibility: isOpen ? "visible" : "hidden",
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 200ms",
          backdropFilter: "blur(4px)",
        }}
      />

      <div
        className="flex flex-col bg-seal-surface"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width,
          height: "100%",
          borderLeft: "1px solid var(--color-seal-border)",
          boxShadow: "-16px 0 48px rgba(0,0,0,0.12)",
          transform: isOpen ? "translateX(0)" : `translateX(${width}px)`,
          transition: "transform 250ms ease-in-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
