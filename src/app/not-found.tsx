export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#1b779b" }} />
      <p className="text-sm font-medium" style={{ color: "#37475E" }}>
        Page not found
      </p>
      <p className="text-xs" style={{ color: "#687076" }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
    </div>
  );
}
