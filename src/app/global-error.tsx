"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/ui/500-error-page";

export default function GlobalError({
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

  return (
    <html>
      <body>
        <ErrorPage reset={reset} />
      </body>
    </html>
  );
}
