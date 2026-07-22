import React, { useState } from 'react';
import { StackConfig } from '../types';
import { Sparkles, Send, Bot, User, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

interface AIAdvisorDrawerProps {
  config: StackConfig;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const SAMPLE_QUESTIONS = [
  'How do I add custom provider fallbacks in OmniRoute?',
  'What if the container crashes with OOM on 1GB RAM?',
  'How do I persist OpenClaw vector memory in /data/openclaw?',
  'How do I configure Fly.io SSL certificates for custom domains?',
];

export const AIAdvisorDrawer: React.FC<AIAdvisorDrawerProps> = ({ config }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your AI DevOps & Stack Architecture Advisor powered by Gemini. I can help you troubleshoot your Fly.io deployment, optimize OmniRoute proxy rules, or configure OpenClaw agents. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          configContext: config,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to communicate with AI Advisor.');
      }

      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error generating AI response.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[650px]">
      
      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Gemini DevOps AI Advisor</h2>
            <p className="text-xs text-slate-400">Contextual assistant for Fly.io, OmniRoute & OpenClaw architecture</p>
          </div>
        </div>

        <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded border border-purple-500/20">
          Gemini 2.5 Flash
        </span>
      </div>

      {/* Suggested Questions */}
      <div className="bg-slate-950/60 p-3 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" /> Quick Questions:
        </span>
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-purple-400" />}
            </div>

            <div
              className={`max-w-[80%] rounded-xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none space-y-2'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div
                className={`text-[9px] text-right font-mono mt-1 ${
                  msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-purple-400 p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl w-max">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Analyzing Fly.io & container process configuration...</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI DevOps Advisor about Fly.io, Redis, OmniRoute, or OpenClaw..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>

    </div>
  );
};
