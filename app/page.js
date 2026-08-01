"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Repeat2, Flag, Rss, Radio, LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const AVATAR_PALETTE = ["#FFB020", "#4ADE80", "#7C9DFF", "#F76E6E", "#C792EA", "#5FD4D0"];
function colorForHandle(handle) {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = handle.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [dispatches, setDispatches] = useState([]);
  const [draft, setDraft] = useState("");
  const [pulse, setPulse] = useState(true);
  const LIMIT = 280;

  // auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1400);
    return () => clearInterval(t);
  }, []);

  const loadFeed = useCallback(async () => {
    const { data, error } = await supabase
      .from("dispatches")
      .select(
        `id, text, created_at, user_id,
         profiles ( handle, name ),
         amplifies ( user_id ),
         flags ( user_id )`
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setDispatches(data);
  }, []);

  useEffect(() => {
    if (!session) return;
    loadFeed();

    // live updates: new dispatches from anyone
    const channel = supabase
      .channel("dispatches-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatches" }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "amplifies" }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "flags" }, () => loadFeed())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session, loadFeed]);

  if (session === undefined) return <CenteredMessage text="Loading…" />;
  if (!session) return null;

  const me = session.user.id;
  const remaining = LIMIT - draft.length;
  const canSend = draft.trim().length > 0 && remaining >= 0;

  async function send() {
    if (!canSend) return;
    const text = draft.trim();
    setDraft("");
    const { error } = await supabase.from("dispatches").insert({ user_id: me, text });
    if (error) alert(error.message);
    else loadFeed();
  }

  async function toggleAmplify(d) {
    const already = d.amplifies.some((a) => a.user_id === me);
    if (already) await supabase.from("amplifies").delete().eq("dispatch_id", d.id).eq("user_id", me);
    else await supabase.from("amplifies").insert({ dispatch_id: d.id, user_id: me });
    loadFeed();
  }

  async function toggleFlag(d) {
    const already = d.flags.some((f) => f.user_id === me);
    if (already) await supabase.from("flags").delete().eq("dispatch_id", d.id).eq("user_id", me);
    else await supabase.from("flags").insert({ dispatch_id: d.id, user_id: me });
    loadFeed();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const tickerText = dispatches
    .slice(0, 6)
    .map((d) => `${d.profiles?.handle ?? "@unknown"} — ${d.text.slice(0, 60)}${d.text.length > 60 ? "…" : ""}`)
    .join("     //     ");

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 576, margin: "0 auto", padding: "0 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Rss size={22} color="var(--amber)" strokeWidth={2.5} />
            <span className="wire-display" style={{ fontSize: 26, fontWeight: 800 }}>WIRE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="wire-mono" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--slate)" }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: "var(--green)",
                  opacity: pulse ? 1 : 0.35,
                  transition: "opacity .4s ease",
                }}
              />
              ON AIR
            </div>
            <button onClick={signOut} style={{ background: "none", border: "none", cursor: "p
