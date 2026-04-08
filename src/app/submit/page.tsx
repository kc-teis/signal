"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SubmitForm } from "@/components/submit/submit-form";
import { EnrichmentPreview } from "@/components/submit/enrichment-preview";
import { Button } from "@/components/ui/button";
import type { EnrichmentPreview as EnrichmentPreviewType } from "@/types";

type Step = "submit" | "preview" | "success";

export default function SubmitPage() {
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
    toast.success("Link published successfully");
  }, []);

  const handleStartOver = useCallback(() => {
    setPreview(null);
    setStep("submit");
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Submit a Link
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share an article or video with the team. AI will enrich it with a
          title, summary, and category.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "submit" && (
          <motion.div
            key="submit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SubmitForm onSuccess={handleEnrichmentSuccess} />
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
              <h2 className="text-lg font-semibold">Published</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your link is now live in the feed.
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
