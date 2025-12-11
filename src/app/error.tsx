"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/ui/500-error-page";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return <ErrorPage reset={reset} />;
}
