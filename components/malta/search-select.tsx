"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SearchOption {
  value: string;
  label: string;
  sublabel?: string;
}

/**
 * Typeahead select: the user types to filter, then picks from the suggestion
 * list. Closes on outside click or Escape. Used for borrower selection where
 * the full list is long.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Type to search…",
  emptyText = "No matches",
}: {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close when clicking outside.
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          o.sublabel?.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q),
      )
    : options;

  // What the input shows: the live query while open, else the selected label.
  const display = open ? query : (selected?.label ?? "");

  function choose(opt: SearchOption) {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={display}
        placeholder={selected && !open ? selected.label : placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(filtered.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && open && filtered[active]) {
            e.preventDefault();
            choose(filtered[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="h-[42px] w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25"
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-[260px] w-full overflow-auto rounded-md border border-input bg-card py-1 shadow-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[12.5px] text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            filtered.map((o, i) => (
              <button
                type="button"
                key={o.value}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2 text-left",
                  i === active ? "bg-secondary" : "hover:bg-secondary/60",
                  o.value === value && "font-semibold",
                )}
              >
                <span className="text-[13px]">{o.label}</span>
                {o.sublabel && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {o.sublabel}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
