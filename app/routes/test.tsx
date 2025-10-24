export default function Test() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: "1rem" }}>
          Test Route Working!
        </h1>
        <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.9)", marginBottom: "2rem" }}>
          Server is running successfully on port 8780
        </p>
        <div style={{ marginTop: "2rem" }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "white",
              color: "#1f2937",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              fontSize: "1.125rem"
            }}
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
