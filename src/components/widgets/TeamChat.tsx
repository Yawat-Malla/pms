"use client";
import { useState } from "react";
import { Card } from "../ui/Card";
import { MessageSquare } from "lucide-react";
import { IconButton } from "../ui/IconButton";

export function TeamChat() {
  const [messages, setMessages] = useState([
    { id: 1, name: "Alex Parker", text: "Can you tell me how the task is progressing?", me: false, time: "1h ago" },
    { id: 2, name: "You", text: "In progress, will text later about some tasks", me: true, time: "1h ago" },
    { id: 3, name: "Sam Kim", text: "Waiting, ok", me: false, time: "55m" },
  ]);
  const [input, setInput] = useState("");
  return (
    <Card>
      <div className="flex items-center justify-between py-3 px-3">
        <div className="font-medium text-gray-700">Team Chat</div>
        <IconButton><MessageSquare className="h-4 w-4" /></IconButton>
      </div>
      <div className="space-y-3 px-3 pb-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.me ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
              <div className="text-[10px] opacity-70">{m.name}</div>
              <div>{m.text}</div>
              <div className="mt-1 text-[10px] opacity-60">{m.time}</div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          <button onClick={() => { if (!input.trim()) return; setMessages((ms) => [...ms, { id: Date.now(), name: "You", text: input, me: true, time: "now" }]); setInput(""); }} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Send</button>
        </div>
      </div>
    </Card>
  );
}