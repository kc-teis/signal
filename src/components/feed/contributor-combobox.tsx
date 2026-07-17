"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Contributor {
  name: string;
  email: string;
}

interface ContributorComboboxProps {
  contributors: Contributor[];
  selected: string[];
  onChange: (emails: string[]) => void;
}

export function ContributorCombobox({
  contributors,
  selected,
  onChange,
}: ContributorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contributors;
    return contributors.filter((c) => c.name.toLowerCase().includes(q));
  }, [contributors, query]);

  function toggle(email: string) {
    if (selected.includes(email)) {
      onChange(selected.filter((e) => e !== email));
    } else {
      onChange([...selected, email]);
    }
  }

  const triggerLabel =
    selected.length === 0
      ? "All Contributors"
      : selected.length === 1
        ? contributors.find((c) => c.email === selected[0])?.name ?? "1 contributor"
        : `${selected.length} contributors`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn(selected.length === 0 && "text-muted-foreground")}>
          {triggerLabel}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
          <div className="border-b p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contributors..."
              className="h-8"
            />
          </div>
          <ul role="listbox" aria-multiselectable="true" className="max-h-56 overflow-y-auto p-1">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={selected.length === 0}
                onClick={() => onChange([])}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                All Contributors
                {selected.length === 0 && <Check className="size-4" />}
              </button>
            </li>
            {filtered.length === 0 && (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">No matches</li>
            )}
            {filtered.map((c) => (
              <li key={c.email}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected.includes(c.email)}
                  onClick={() => toggle(c.email)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {c.name}
                  {selected.includes(c.email) && <Check className="size-4" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
