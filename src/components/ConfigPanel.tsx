import React, { useState } from 'react';
import { StackConfig, ValidationResult } from '../types';
import { Settings, Shield, HardDrive, Cpu, AlertTriangle, CheckCircle2, Info, Key, Globe, Eye, EyeOff, HelpCircle, Lock } from 'lucide-react';

interface ConfigPanelProps {
  config: StackConfig;
  onChange: (updated: StackConfig) => void;
  validation: ValidationResult | null;
}

const FLY_REGIONS = [
  { code: 'iad', name: 'Ashburn, VA (US East)' },
  { code: 'ord', name: 'Chicago, IL (US Central)' },
  { code: 'sjc', name: 'Sunnyvale, CA (US West)' },
  { code: 'fra', name: 'Frankfurt, Germany (Europe)' },
  { code: 'lhr', name: 'London, UK (Europe)' },
  { code: 'ams', name: 'Amsterdam, Netherlands' },
  { code: 'nrt', name: 'Tokyo, Japan (Asia)' },
  { code: 'sin', name: 'Singapore (Asia)' },
  { code: 'syd', name: 'Sydney, Australia' },
  { code: 'gru', name: 'São Paulo, Brazil' },
];

interface ApiKeyFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  showAllKeys: boolean;
  tooltip: string;
}

const ApiKeyField: React.FC<ApiKeyFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  showAllKeys,
  tooltip,
}) => {
  const [showSingle, setShowSingle] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const isVisible = showAllKeys || showSingle;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-slate-400 font-medium flex items-center gap-1.5">
          <span>{label}</span>
          <div className="relative inline-block">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-slate-500 hover:text-indigo-400 focus:outline-none transition"
              aria-label={`Info for ${label}`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {showTooltip && (
              <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-950 border border-slate-700/90 text-slate-200 text-[11px] rounded-lg shadow-2xl leading-relaxed pointer-events-none">
                <p>{tooltip}</p>
                <div className="mt-1 pt-1 border-t border-slate-800/80 text-[10px] text-indigo-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>Only used for local deployment environment variables.</span>
                </div>
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-8 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowSingle(!showSingle)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
          title={isVisible ? "Mask key" : "Show key"}
        >
          {isVisible ? <EyeOff className="w-3.5 h-3.5 text-amber-400/80" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  validation,
}) => {
  const [showApiKeys, setShowApiKeys] = useState<boolean>(false);

  const handleChange = (field: keyof StackConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-200">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h2 className="text-base font-semibold text-white">Stack Configuration</h2>
        <span className="text-xs text-slate-400 ml-auto">Updates generated files in real-time</span>
      </div>

      <div className="space-y-6 text-xs">
        
        {/* Fly.io Basics */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            1. Fly.io Deployment Basics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Fly App Name</label>
              <input
                type="text"
                value={config.appName}
                onChange={(e) => handleChange('appName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                placeholder="openclaw-omni-stack"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Primary Region</label>
              <select
                value={config.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {FLY_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code.toUpperCase()} - {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Compute & Resources */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            2. Machine Compute & Memory
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Memory Allocation</label>
              <select
                value={config.memoryMb}
                onChange={(e) => handleChange('memoryMb', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={512}>512 MB (Minimal)</option>
                <option value={1024}>1024 MB (Recommended)</option>
                <option value={2048}>2048 MB (Heavy Load)</option>
                <option value={4096}>4096 MB (High Perf)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">CPU Type</label>
              <select
                value={config.cpuKind}
                onChange={(e) => handleChange('cpuKind', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="shared">Shared CPU</option>
                <option value="performance">Dedicated Performance CPU</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">CPU Cores</label>
              <select
                value={config.cpus}
                onChange={(e) => handleChange('cpus', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={1}>1 vCPU</option>
                <option value={2}>2 vCPU</option>
                <option value={4}>4 vCPU</option>
              </select>
            </div>
          </div>
        </div>

        {/* Persistent Storage */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            3. Persistent Volume Storage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Volume Name</label>
              <input
                type="text"
                value={config.volumeName}
                onChange={(e) => handleChange('volumeName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Size (GB)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.volumeSizeGb}
                onChange={(e) => handleChange('volumeSizeGb', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Mount Point</label>
              <input
                type="text"
                value={config.mountPath}
                onChange={(e) => handleChange('mountPath', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Network & Ports */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            4. Port Isolation & Network Ports
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                OpenClaw Gateway (Public)
              </label>
              <input
                type="number"
                value={config.gatewayPort}
                onChange={(e) => handleChange('gatewayPort', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Exposed on Fly.dev HTTPS</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                OmniRoute Proxy (Local)
              </label>
              <input
                type="number"
                value={config.omniroutePort}
                onChange={(e) => handleChange('omniroutePort', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 font-mono text-indigo-400 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Isolated to localhost</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Redis Server (Internal)
              </label>
              <input
                type="number"
                value={config.redisPort}
                onChange={(e) => handleChange('redisPort', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 font-mono text-amber-400 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">127.0.0.1 bound cache</span>
            </div>
          </div>
        </div>

        {/* Security Secrets & API Keys */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              5. Security & Upstream Provider Keys
            </h3>
            <button
              type="button"
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            >
              {showApiKeys ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{showApiKeys ? 'Mask All Keys' : 'Unmask All Keys'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <ApiKeyField
              label="OPENCLAW_GATEWAY_TOKEN"
              value={config.gatewayToken}
              onChange={(val) => handleChange('gatewayToken', val)}
              placeholder="Secure bearer token for logging into OpenClaw dashboard"
              showAllKeys={showApiKeys}
              tooltip="Admin bearer token protecting access to your OpenClaw management console. Configured directly as an environment secret."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ApiKeyField
                label="OpenAI API Key (Optional)"
                value={config.openAiApiKey || ''}
                onChange={(val) => handleChange('openAiApiKey', val)}
                placeholder="sk-proj-..."
                showAllKeys={showApiKeys}
                tooltip="Required for OpenAI model routes (GPT-4o, etc.). Injected into your container as OPENAI_API_KEY for local/Fly deployment."
              />

              <ApiKeyField
                label="Gemini / Google Key (Optional)"
                value={config.geminiApiKey || ''}
                onChange={(val) => handleChange('geminiApiKey', val)}
                placeholder="AIzaSy..."
                showAllKeys={showApiKeys}
                tooltip="Required for Google Gemini model routes. Injected into your deployment container as GEMINI_API_KEY."
              />

              <ApiKeyField
                label="Anthropic Key (Optional)"
                value={config.anthropicApiKey || ''}
                onChange={(val) => handleChange('anthropicApiKey', val)}
                placeholder="sk-ant-..."
                showAllKeys={showApiKeys}
                tooltip="Required for Anthropic Claude routes. Set as ANTHROPIC_API_KEY secret in your local container deployment environment."
              />

              <ApiKeyField
                label="Groq API Key (Optional)"
                value={config.groqApiKey || ''}
                onChange={(val) => handleChange('groqApiKey', val)}
                placeholder="gsk_..."
                showAllKeys={showApiKeys}
                tooltip="Required for ultra-fast Groq Llama model routing. Injected as GROQ_API_KEY in your Fly/local deployment secrets."
              />

              <ApiKeyField
                label="OpenRouter Key (Optional)"
                value={config.openRouterApiKey || ''}
                onChange={(val) => handleChange('openRouterApiKey', val)}
                placeholder="sk-or-v1-..."
                showAllKeys={showApiKeys}
                tooltip="Required for multi-provider fallback routing via OpenRouter. Passed to your deployment environment as OPENROUTER_API_KEY."
              />
            </div>
          </div>
        </div>

        {/* Live Validation Feedback Box */}
        {validation && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                {validation.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                Configuration Inspection
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                validation.valid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {validation.valid ? 'VALID STACK' : 'ISSUES DETECTED'}
              </span>
            </div>

            <div className="space-y-1.5">
              {validation.issues.length === 0 ? (
                <p className="text-slate-400 text-[11px]">All configuration parameters pass architectural sanity checks.</p>
              ) : (
                validation.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 text-[11px] p-2 rounded-lg ${
                      issue.type === 'error'
                        ? 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
                        : issue.type === 'warning'
                        ? 'bg-amber-950/40 border border-amber-800/50 text-amber-300'
                        : 'bg-indigo-950/40 border border-indigo-800/50 text-indigo-300'
                    }`}
                  >
                    {issue.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                    {issue.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                    {issue.type === 'info' && <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />}
                    <span>{issue.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
