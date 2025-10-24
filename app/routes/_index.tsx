import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #FFE87C 0%, #FFB88C 50%, #A8E6A1 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1rem" }}>
          🎉 PositiveNRG Remix App Working!
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#374151", marginBottom: "2rem" }}>
          Server is running successfully on port 8780
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link 
            to="/login" 
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#10b981",
              color: "white",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              fontSize: "1.125rem"
            }}
          >
            Login
          </Link>
          <Link 
            to="/register" 
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              fontSize: "1.125rem"
            }}
          >
            Sign Up
          </Link>
        </div>
        
        <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", maxWidth: "800px", margin: "3rem auto 0" }}>
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>😊</div>
            <h3 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>PositiveNRG</h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Your bright companion</p>
          </div>
          
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧘‍♀️</div>
            <h3 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>CalmFlow</h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Mindfulness guide</p>
          </div>
          
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
            <h3 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>Spark</h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Goal motivator</p>
          </div>
          
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌙</div>
            <h3 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>Luna</h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Night companion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
