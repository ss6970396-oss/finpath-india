"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SiteFooter from "../components/SiteFooter";

type Src = { n: number; source: string; page: number };
type Msg = { role: "user" | "ai"; text: string; sources?: Src[] };

export default function Counselor() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const question = input;
    setInput("");
    setLoading(true);

    setMessages((m) => [
      ...m,
      { role: "user", text: question },
      { role: "ai", text: "" },
    ]);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const [body, meta] = acc.split("␟SOURCES␟");
        const snapshot = body;
        let srcs: Src[] | undefined;
        try {
          srcs = meta ? (JSON.parse(meta) as Src[]) : undefined;
        } catch {
          srcs = undefined;
        }
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "ai", text: snapshot, sources: srcs };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "ai",
          text: "Couldn't reach the server. Is the backend running on port 8000?",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "Should I get a credit card in college?",
    "What is a SIP?",
    "How do I start saving from pocket money?",
  ];

  return (
    <main className="flex h-dvh flex-col bg-slate-950">
      <PageHeader
        title="The Counselor"
        subtitle="Answers only from verified RBI, SEBI and NCFE sources — every one cited."
        active="/counselor"
        width="max-w-3xl"
        compact
      />

      {/* messages take the remaining height and scroll on their own */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-8 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Sparkles className="mb-6 h-7 w-7 text-emerald-400" />
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-100">
                Ask me anything about money
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                Answers come only from verified RBI, SEBI and NCFE sources. Ask
                something outside them and it will say so.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-400 transition hover:border-emerald-500/60 hover:text-emerald-400"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "flex justify-end" : "flex"}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[80%] rounded-2xl rounded-br-sm bg-white px-5 py-3 text-sm font-medium text-slate-950"
                        : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-slate-900 bg-slate-900/40 px-5 py-3 text-sm leading-relaxed text-slate-200"
                    }
                  >
                    {m.text || "…"}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-800 pt-3">
                        {m.sources.map((s) => (
                          <span
                            key={s.n}
                            className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[11px] text-slate-400"
                          >
                            <span className="text-emerald-400">[{s.n}]</span>{" "}
                            {s.source} · p.{s.page}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* composer pinned to the bottom of the viewport */}
      <div className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto flex max-w-3xl gap-3 px-8 py-5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about SIPs, credit cards, savings…"
            className="h-12 rounded-full border-slate-800 bg-slate-900/60 px-5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20"
          />
          <Button
            onClick={send}
            disabled={loading}
            className="h-12 shrink-0 rounded-full bg-white px-7 text-xs font-bold uppercase tracking-[0.12em] text-slate-950 hover:bg-emerald-400"
          >
            {loading ? "Thinking" : "Send"}
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
