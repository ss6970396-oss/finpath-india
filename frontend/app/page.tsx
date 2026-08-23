"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, TrendingUp } from "lucide-react";

type Msg = { role: "user" | "ai"; text: string };

export default function Home() {
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
        const snapshot = acc;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "ai", text: snapshot };
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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold tracking-tight">FinPath India</h1>
            <p className="text-xs text-slate-500">
              Financial literacy counselor
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {messages.length === 0 && (
          <Card className="mb-6 border-dashed p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
            <h2 className="mb-1 font-medium">Ask me anything about money</h2>
            <p className="text-sm text-slate-500">
              Try: &ldquo;Should I get a credit card in college?&rdquo;
            </p>
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
                    : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm leading-relaxed shadow-sm ring-1 ring-slate-200"
                }
              >
                {m.text || "…"}
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