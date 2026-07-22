import React, { useState } from 'react';
import { StackConfig, SimulationResponse } from '../types';
import { Play, Database, Zap, RefreshCw, Cpu, Layers, Sparkles, CheckCircle, Clock } from 'lucide-react';

interface SandboxSimulatorProps {
  config: StackConfig;
}

const PRESET_PROMPTS = [
  { label: 'Agent Task Plan', text: 'OpenClaw agent request: Plan a 3-step automated web research workflow for AI developments.' },
  { label: 'Code Refactor', text: 'Refactor Dockerfile to optimize multi-stage cache layers and reduce image size.' },
  { label: 'Model Fallback Check', text: 'Test OmniRoute fallback routing when OpenAI rate limit returns 429 status.' },
];

export const SandboxSimulator: React.FC<SandboxSimulatorProps> = ({ config }) => {
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'groq'>('openai');
  const [model, setModel] = useState<string>('gpt-4o');
  const [prompt, setPrompt] = useState<string>(PRESET_PROMPTS[0].text);
  const [useCache, setUseCache] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<SimulationResponse[]>([]);

  const handleRunSimulation = () => {
    setIsLoading(true);

    const isHit = useCache && history.some((h) => h.prompt === prompt && h.provider === provider);
    const latency = isHit ? Math.floor(Math.random() * 20) + 12 : Math.floor(Math.random() * 450) + 280;

    setTimeout(() => {
      let outputText = '';
      if (provider === 'openai') {
        outputText = `[OmniRoute Proxy -> OpenAI (${model})]\nRequest processed successfully via http://127.0.0.1:${config.omniroutePort}/v1/chat/completions.\nResponse: OpenClaw agent task initialized with 3 sub-agents.`;
      } else if (provider === 'gemini') {
        outputText = `[OmniRoute Proxy -> Gemini (${model})]\nTransformed OpenAI request payload into Gemini API spec.\nResponse: Workflow execution graph generated with grounding search enabled.`;
      } else if (provider === 'anthropic') {
        outputText = `[OmniRoute Proxy -> Anthropic (${model})]\nProxy routed to Claude Messages API endpoint.\nResponse: Agent code refactor plan validated with zero syntax warnings.`;
      } else {
        outputText = `[OmniRoute Proxy -> Groq (${model})]\nExtremely fast inference response received.\nResponse: Task completed in sub-second duration.`;
      }

      const newResponse: SimulationResponse & { prompt: string } = {
        id: Math.random().toString(36).substring(7),
        provider,
        model,
        prompt,
        output: outputText,
        latencyMs: latency,
        cached: isHit,
        redisKeysCount: isHit ? history.length : history.length + 1,
        bytesProcessed: prompt.length * 4 + 180,
        timestamp: new Date().toLocaleTimeString(),
      };

      setHistory([newResponse, ...history]);
      setIsLoading(false);
    }, latency);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">OmniRoute Local Proxy Sandbox</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate OpenClaw agent calling <code className="text-indigo-300 font-mono">http://127.0.0.1:{config.omniroutePort}/v1</code> and observing Redis caching hit/miss metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-800 text-amber-400 border border-slate-700 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> Redis Port {config.redisPort}
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-indigo-400 border border-slate-700">
            Proxy Port {config.omniroutePort}
          </span>
        </div>
      </div>

      {/* Simulator Inputs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 text-xs">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Provider</label>
            <select
              value={provider}
              onChange={(e: any) => {
                setProvider(e.target.value);
                if (e.target.value === 'openai') setModel('gpt-4o');
                if (e.target.value === 'gemini') setModel('gemini-2.5-flash');
                if (e.target.value === 'anthropic') setModel('claude-3-5-sonnet');
                if (e.target.value === 'groq') setModel('llama-3.3-70b');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="openai">OpenAI (OpenAI API)</option>
              <option value="gemini">Google Gemini (GenAI API)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="groq">Groq (Llama)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Redis Response Caching</label>
            <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useCache}
                onChange={(e) => setUseCache(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-300">Enable Redis Cache Lookup (127.0.0.1:{config.redisPort})</span>
            </label>
          </div>
        </div>

        {/* Preset Prompts */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Preset Prompts</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(p.text)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  prompt === p.text
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Prompt Payload</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isLoading || !prompt.trim()}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" /> Routing Request through OmniRoute Proxy...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Send Request through OmniRoute Proxy
            </>
          )}
        </button>

      </div>

      {/* Simulation Results History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Proxy Execution Log History
        </h3>

        {history.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
            No test proxy requests executed yet. Click &quot;Send Request&quot; above to run a routing test.
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono shadow"
            >
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white uppercase">{item.provider}</span>
                  <span className="text-slate-400">({item.model})</span>
                  <span className="text-slate-500">• {item.timestamp}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.cached ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> REDIS CACHE HIT ({item.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> DIRECT PROXY MISS ({item.latencyMs}ms)
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-emerald-400 text-[11px] whitespace-pre-wrap">
                {item.output}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Payload: {item.bytesProcessed} bytes</span>
                <span>Active Redis Cache Keys: {item.redisKeysCount}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
