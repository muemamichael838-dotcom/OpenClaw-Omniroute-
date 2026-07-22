import React, { useState } from 'react';
import { StackConfig } from '../types';
import { Network, Server, Database, ShieldAlert, Cpu, ArrowRight, Lock, CheckCircle2, HardDrive, Globe } from 'lucide-react';

interface TopologyDiagramProps {
  config: StackConfig;
}

export const TopologyDiagram: React.FC<TopologyDiagramProps> = ({ config }) => {
  const [selectedNode, setSelectedNode] = useState<string>('omniroute');

  return (
    <div className="space-y-6">
      
      {/* Topology Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Co-Located Network & Process Topology</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual map of Fly Machine ingress, internal loopback ports, process supervisor, and upstream LLM gateways.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Ports 20128 & 6379 Localhost Bound
          </span>
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Fly VM Memory: {config.memoryMb} MB
          </span>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-x-auto">
        <div className="min-w-[850px] flex items-stretch gap-6">
          
          {/* Node 1: External Client */}
          <div
            onClick={() => setSelectedNode('client')}
            className={`w-48 p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
              selectedNode === 'client'
                ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Globe className="w-6 h-6 text-indigo-400" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  PUBLIC
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">External Client / User</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Web browsers, CLI tools, & OAuth callbacks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-indigo-400">
              https://{config.appName}.fly.dev
            </div>
          </div>

          {/* Connection Arrow */}
          <div className="flex flex-col items-center justify-center text-slate-600 font-mono text-[10px]">
            <span className="text-slate-400 font-semibold mb-1">HTTPS:443</span>
            <ArrowRight className="w-5 h-5 text-indigo-500" />
            <span className="text-slate-500 mt-1">Fly Edge Proxy</span>
          </div>

          {/* Node 2: Fly Machine Container Box */}
          <div className="flex-1 bg-slate-900/80 border-2 border-indigo-500/40 rounded-2xl p-5 relative shadow-xl">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold font-mono tracking-wider shadow">
              FLY MACHINE CONTAINER ({config.appName})
            </div>

            <div className="grid grid-cols-3 gap-4 h-full pt-2">
              
              {/* Process A: OpenClaw */}
              <div
                onClick={() => setSelectedNode('openclaw')}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedNode === 'openclaw'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Server className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      PORT {config.gatewayPort}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white">OpenClaw Gateway</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Autonomous agent logic, WebSocket gateway, & task execution scheduler.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
                  Binds: 0.0.0.0
                </div>
              </div>

              {/* Process B: OmniRoute */}
              <div
                onClick={() => setSelectedNode('omniroute')}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedNode === 'omniroute'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      PORT {config.omniroutePort}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white">OmniRoute AI Gateway</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    OpenAI-compatible multi-provider proxy, key manager, & model transformer.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-indigo-400 font-mono">
                  Binds: 127.0.0.1
                </div>
              </div>

              {/* Process C: Redis Server */}
              <div
                onClick={() => setSelectedNode('redis')}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedNode === 'redis'
                    ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      PORT {config.redisPort}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white">Redis Server</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    In-memory response caching, session token store, & request rate-limiting.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-amber-400 font-mono">
                  Binds: 127.0.0.1
                </div>
              </div>

            </div>

            {/* Sub-block: Storage Volume Mount */}
            <div
              onClick={() => setSelectedNode('volume')}
              className={`mt-4 p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                selectedNode === 'volume'
                  ? 'bg-indigo-950/70 border-indigo-400 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-white">Persistent Fly Volume: </span>
                  <span className="text-xs font-mono text-purple-300">{config.volumeName}</span>
                  <span className="text-[10px] text-slate-400 ml-2">({config.volumeSizeGb} GB mounted at {config.mountPath})</span>
                </div>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded">
                MOUNTED
              </span>
            </div>

          </div>

          {/* Connection Arrow */}
          <div className="flex flex-col items-center justify-center text-slate-600 font-mono text-[10px]">
            <span className="text-slate-400 font-semibold mb-1">HTTPS</span>
            <ArrowRight className="w-5 h-5 text-indigo-500" />
            <span className="text-slate-500 mt-1">Egress APIs</span>
          </div>

          {/* Node 3: Upstream LLM Provider APIs */}
          <div
            onClick={() => setSelectedNode('upstream')}
            className={`w-48 p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
              selectedNode === 'upstream'
                ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Globe className="w-6 h-6 text-purple-400" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  EXTERNAL
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Upstream LLMs</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                OpenAI, Gemini, Anthropic, DeepSeek, & Groq endpoints.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-purple-400">
              Authenticated via Secrets
            </div>
          </div>

        </div>
      </div>

      {/* Node Inspector Details Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          Component Inspector: <span className="text-white">{selectedNode.toUpperCase()}</span>
        </h3>

        {selectedNode === 'omniroute' && (
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-indigo-400">OmniRoute</strong> runs as a background process managed by Supervisor inside the container. It listens exclusively on <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono">127.0.0.1:{config.omniroutePort}</code>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              <li>Never exposed to external internet — preventing unauthorized access to upstream API keys.</li>
              <li>Receives standard OpenAI-formatted JSON from OpenClaw via <code className="font-mono text-indigo-300">http://127.0.0.1:{config.omniroutePort}/v1/chat/completions</code>.</li>
              <li>Uses the local Redis server at port {config.redisPort} to cache prompt responses and manage provider rate limits.</li>
            </ul>
          </div>
        )}

        {selectedNode === 'openclaw' && (
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-emerald-400">OpenClaw Gateway</strong> is the primary public entrypoint. It binds to <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono">0.0.0.0:{config.gatewayPort}</code> and is exposed through Fly.io&apos;s HTTPS reverse proxy.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              <li>Requires bearer token authentication via <code className="font-mono text-amber-300">OPENCLAW_GATEWAY_TOKEN</code>.</li>
              <li>Stores agent logs, memory, and workspace tools in persistent path <code className="font-mono text-purple-300">{config.mountPath}/openclaw</code>.</li>
              <li>Routes all model generation calls internally through OmniRoute at <code className="font-mono text-indigo-300">http://127.0.0.1:{config.omniroutePort}/v1</code>.</li>
            </ul>
          </div>
        )}

        {selectedNode === 'redis' && (
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-amber-400">Redis Server</strong> runs in protected mode on <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-400 font-mono">127.0.0.1:{config.redisPort}</code>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              <li>Provides sub-millisecond caching for OmniRoute proxy requests.</li>
              <li>No authentication required because binding is strictly limited to localhost loopback.</li>
            </ul>
          </div>
        )}

        {selectedNode === 'volume' && (
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-purple-400">Persistent Storage Volume ({config.volumeName})</strong> is mounted to <code className="bg-slate-950 px-1.5 py-0.5 rounded text-purple-300 font-mono">{config.mountPath}</code>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              <li>Ensures agent configurations (<code className="font-mono">openclaw.json</code>), workspace memory, and OmniRoute credentials persist across VM restarts or scale events.</li>
            </ul>
          </div>
        )}

        {selectedNode === 'client' && (
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <p>
              Users connect securely over TLS to <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">https://{config.appName}.fly.dev</code>. Fly.io handles SSL termination automatically.
            </p>
          </div>
        )}

        {selectedNode === 'upstream' && (
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <p>
              Egress traffic leaves OmniRoute to official API provider gateways using secrets set via <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-mono">fly secrets set</code>.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
