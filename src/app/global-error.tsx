"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#05060a", color: "#e9ecff", margin: 0 }}>
        <div style={{ maxWidth: 480, margin: "10vh auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f2f4ff" }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#aab0d4" }}>{error.message || "An unexpected error occurred."}</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(100deg,#8fd0ff,#a9b8ff 45%,#c9a2ff)",
              color: "#0a0b16",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
