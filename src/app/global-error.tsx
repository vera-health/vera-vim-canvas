"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 h-screen overflow-hidden">
        <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#1b779b" }} />
          <p className="text-sm font-medium" style={{ color: "#37475E" }}>
            Something went wrong
          </p>
          <p className="text-xs" style={{ color: "#687076" }}>
            An unexpected error occurred
          </p>
          <button
            onClick={unstable_retry}
            className="rounded-xl border px-4 py-2 text-sm transition-colors hover:bg-gray-50"
            style={{ borderColor: "#EDF1F5", color: "#37475E" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
