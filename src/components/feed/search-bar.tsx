"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  isLoading?: boolean;
}

export function SearchBar({ value, onChange, resultCount, isLoading }: SearchBarProps) {
  const [input, setInput] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(input.trim());
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [input, onChange]);

  // Sync if parent clears value externally
  useEffect(() => {
    if (value === "" && input !== "") setInput("");
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function clear() {
    setInput("");
    onChange("");
    inputRef.current?.focus();
  }

  const showMeta = input.trim().length > 0 && !isLoading && resultCount !== undefined;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search titles, summaries, notes..."
          className="h-10 w-full rounded-lg border bg-background pl-10 pr-9 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-muted-foreground/50"
        />
        {input && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {showMeta && (
        <p className="pl-1 text-xs text-muted-foreground">
          {resultCount === 0
            ? `No results for "${input.trim()}"`
            : `${resultCount} result${resultCount === 1 ? "" : "s"} for "${input.trim()}"`}
        </p>
      )}
    </div>
  );
}
