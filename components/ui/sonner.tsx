"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#1f1d1a",
          color: "#f4f1ec",
          border: "1px solid #322f2a",
          borderRadius: "8px",
          fontSize: "13px",
          fontFamily: "var(--font-ibm-plex-sans)",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
