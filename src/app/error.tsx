"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log full error details to console for debugging in webview
  console.error("[Vera] ErrorBoundary caught:", error.message, error.stack);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#1b779b" }} />
      <p className="text-sm font-medium" style={{ color: "#37475E" }}>
        Something went wrong
      </p>
      <p className="text-xs" style={{ color: "#687076" }}>
        {error.message || "An unexpected error occurred"}
      </p>
      <pre
        className="mt-2 max-h-40 w-full overflow-auto rounded bg-gray-100 p-2 text-left text-[10px]"
        style={{ color: "#687076" }}
      >
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="rounded-xl border px-4 py-2 text-sm transition-colors hover:bg-gray-50"
        style={{ borderColor: "#EDF1F5", color: "#37475E" }}
      >
        Try again
      </button>
    </div>
  );
}
