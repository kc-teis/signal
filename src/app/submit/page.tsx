"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SubmitForm } from "@/components/submit/submit-form";
import { PromptSubmitForm } from "@/components/submit/prompt-submit-form";
import { EnrichmentPreview } from "@/components/submit/enrichment-preview";
import { Button } from "@/components/ui/button";
import type { EnrichmentPreview as EnrichmentPreviewType } from "@/types";

type Mode = "link" | "prompt";
type Step = "submit" | "preview" | "success";

export default function SubmitPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("link");
  const [step, setStep] = useState<Step>("submit");
  const [preview, setPreview] = useState<EnrichmentPreviewType | null>(null);

  const handleEnrichmentSuccess = useCallback(
    (data: EnrichmentPreviewType) => {
      setPreview(data);
      setStep("preview");
    },
    []
  );

  const handlePublish = useCallback(() => {
    setStep("success");
    toast.success(mode === "prompt" ? "Prompt published" : "Link published");
    queryClient.invalidateQueries({ queryKey: ["links"] });
    queryClient.invalidateQueries({ queryKey: ["contributors"] });
  }, [mode, queryClient]);

  const handleStartOver = useCallback(() => {
    setPreview(null);
    setStep("submit");
  }, []);

  const descriptions: Record<Mode, { title: string; subtitle: string }> = {
    link: {
      title: "Submit a Link",
      subtitle: "Share an article or video with the team. AI will enrich it with a title, summary, and category.",
    },
    prompt: {
      title: "Submit a Prompt",
      subtitle: "Share an AI prompt with the team. It will be published directly to the feed.",
    },
  };

  const current = descriptions[mode];

  return (
    <div className="mx-auto max-w-xl">
      {step === "submit" && (
        <div className="mb-6 flex gap-1 rounded-md border p-0.5 w-fit" role="tablist" aria-label="Submission type">
          <button
            role="tab"
            aria-selected={mode === "link"}
            onClick={() => setMode("link")}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              mode === "link"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Link
          </button>
          <button
            role="tab"
            aria-selected={mode === "prompt"}
            onClick={() => setMode("prompt")}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              mode === "prompt"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Prompt
          </button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === "submit" ? current.title : step === "preview" ? "Review & Publish" : "Published"}
        </h1>
        {step === "submit" && (
          <p className="mt-1 text-sm text-muted-foreground">
            {current.subtitle}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === "submit" && mode === "link" && (
          <motion.div
            key="submit-link"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SubmitForm onSuccess={handleEnrichmentSuccess} />
          </motion.div>
        )}

        {step === "submit" && mode === "prompt" && (
          <motion.div
            key="submit-prompt"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <PromptSubmitForm onSuccess={handlePublish} />
          </motion.div>
        )}

        {step === "preview" && preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <EnrichmentPreview
              preview={preview}
              onPublish={handlePublish}
              onBack={handleStartOver}
            />
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-center space-y-6 py-8"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your {mode === "prompt" ? "prompt" : "link"} is now live in the feed.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleStartOver}>
                Submit Another
              </Button>
              <Button asChild><Link href="/">Go to Feed</Link></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
