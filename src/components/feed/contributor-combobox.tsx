"use client";

import { useMemo, useState } from "react";
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

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
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
  );
}
