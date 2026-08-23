"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, TrendingUp } from "lucide-react";

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
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight text-slate-900">
                FinPath India
              </h1>
              <p className="text-xs text-slate-500">
                Financial literacy counselor
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            My Spending →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {messages.length === 0 && (
          <Card className="mb-6 border-dashed p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
            <h2 className="mb-1 font-medium">Ask me anything about money</h2>
            <p className="mb-5 text-sm text-slate-500">
              Answers come only from verified RBI, SEBI and NCFE sources.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : "flex"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-emerald-600 px-4 py-2.5 text-sm text-white"
                    : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200"
                }
              >
                {m.text || "…"}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-2.5">
                    {m.sources.map((s) => (
                      <span
                        key={s.n}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                      >
                        [{s.n}] {s.source} · p.{s.page}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-6 mt-6 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about SIPs, credit cards, savings…"
            className="bg-white"
          />
          <Button onClick={send} disabled={loading} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
