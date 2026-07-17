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
  // Roving tabindex: only one option is a Tab stop at a time (updated via
  // focus, covering both click and arrow-key movement) so Tab moves past the
  // whole listbox in one press instead of visiting every contributor —
  // otherwise a long list turns "Tab out of the filter modal" into dozens
  // of key presses.
  const [activeIndex, setActiveIndex] = useState(0);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  // Bring the listbox into view when the search field gains focus — it sits
  // at the bottom of a scrollable modal, so without this the input can be
  // focused while the options below it stay scrolled out of sight. Deferred
  // two frames because the browser's own focus-into-view scrolling (which
  // only guarantees the input itself is visible) can otherwise run after
  // ours and undo it. block:"start" aligns the TOP of the list with the top
  // of the visible area, so as many rows as fit below are shown, rather than
  // block:"end" which only guarantees the bottom edge and can leave most of
  // the list above the fold.
  function handleInputFocus() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contributors;
    return contributors.filter((c) => c.name.toLowerCase().includes(q));
  }, [contributors, query]);

  // "All Contributors" occupies index 0; real options follow.
  const optionCount = filtered.length + 1;
  const clampedActiveIndex = Math.min(activeIndex, optionCount - 1);

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

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
        onChange={(e) => handleQueryChange(e.target.value)}
        onKeyDown={handleInputKeyDown}
        onFocus={handleInputFocus}
        placeholder="Search contributors..."
        className="h-9"
      />
      <ul
        ref={listRef}
        role="listbox"
        aria-multiselectable="true"
        aria-label="Contributors"
        className="max-h-72 space-y-0.5 overflow-y-auto rounded-md border p-1"
      >
        <li>
          <button
            ref={(el) => { optionRefs.current[0] = el; }}
            type="button"
            role="option"
            aria-selected={selected.length === 0}
            tabIndex={clampedActiveIndex === 0 ? 0 : -1}
            onFocus={() => setActiveIndex(0)}
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
              tabIndex={clampedActiveIndex === i + 1 ? 0 : -1}
              onFocus={() => setActiveIndex(i + 1)}
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
