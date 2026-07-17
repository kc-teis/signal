"use client";

import { useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const [query, setQuery] = useState("");
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contributors;
    return contributors.filter((c) => c.name.toLowerCase().includes(q));
  }, [contributors, query]);

  // "All Contributors" occupies index 0; real options follow.
  const optionCount = filtered.length + 1;

  function toggle(email: string) {
    if (selected.includes(email)) {
      onChange(selected.filter((e) => e !== email));
    } else {
      onChange([...selected, email]);
    }
  }

  function focusOption(index: number) {
    const clamped = Math.max(0, Math.min(optionCount - 1, index));
    optionRefs.current[clamped]?.focus();
  }

  function handleOptionKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOption(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusOption(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusOption(optionCount - 1);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(0);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Search contributors..."
        className="h-9"
      />
      <ul
        role="listbox"
        aria-multiselectable="true"
        aria-label="Contributors"
        className="max-h-44 space-y-0.5 overflow-y-auto rounded-md border p-1"
      >
        <li>
          <button
            ref={(el) => { optionRefs.current[0] = el; }}
            type="button"
            role="option"
            aria-selected={selected.length === 0}
            onClick={() => onChange([])}
            onKeyDown={(e) => handleOptionKeyDown(e, 0)}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            All Contributors
            {selected.length === 0 && <Check className="size-4" />}
          </button>
        </li>
        {filtered.length === 0 && (
          <li className="px-2 py-1.5 text-sm text-muted-foreground">No matches</li>
        )}
        {filtered.map((c, i) => (
          <li key={c.email}>
            <button
              ref={(el) => { optionRefs.current[i + 1] = el; }}
              type="button"
              role="option"
              aria-selected={selected.includes(c.email)}
              onClick={() => toggle(c.email)}
              onKeyDown={(e) => handleOptionKeyDown(e, i + 1)}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {c.name}
              {selected.includes(c.email) && <Check className="size-4" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
