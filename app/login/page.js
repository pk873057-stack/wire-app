"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name || email.split("@")[0] } },
      });
      setLoading(false);
      if (error) return setError(error.message);
      setCheckEmail(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--card)",
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: 28,
        }}
      >
        <h1 className="wire-display" style={{ fontSize: 32, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          WIRE
        </h1>
        <p className="wire-mono" style={{ color: "var(--slate)", fontSize: 12, margin: "0 0 20px" }}>
          {mode === "signin" ? "SIGN IN TO THE NETWORK" : "REGISTER A NEW CORRESPONDENT"}
        </p>

        {checkEmail ? (
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Check your inbox — we sent a confirmation link to <strong>{email}</strong>. Confirm it, then come back and sign in.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            {error && (
              <p className="wire-mono" style={{ color: "#F76E6E", fontSize: 12, margin: 0 }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="wire-display"
              style={{
                background: "var(--amber)",
                color: "#14161C",
                border: "none",
                borderRadius: 999,
                padding: "10px 0",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}

        {!checkEmail && (
          <p style={{ fontSize: 13, color: "var(--slate)", marginTop: 16, textAlign: "center" }}>
            {mode === "signin" ? "New here?" : "Already registered?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
              }}
              style={{ background: "none", border: "none", color: "var(--amber)", cursor: "pointer", padding: 0, fontSize: 13 }}
            >
              {mode === "signin" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#14161C",
  border: "1px solid var(--card-border)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "var(--paper)",
  fontSize: 14,
};
