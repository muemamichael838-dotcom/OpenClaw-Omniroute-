import React, { useState } from 'react';
import { Layers, Server, ShieldCheck, Download, Sparkles, Cpu, RefreshCw, Github, CheckCircle2, AlertTriangle, X, Copy, Check, ExternalLink, Terminal, GitBranch } from 'lucide-react';
import { ActiveTab, StackConfig } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appName: string;
  config: StackConfig;
  onDownloadZip: () => void;
  onResetDefaults: () => void;
  isDownloading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  appName,
  config,
  onDownloadZip,
  onResetDefaults,
  isDownloading,
}) => {
  const [showHealthTooltip, setShowHealthTooltip] = useState<boolean>(false);
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Deployment Health Check Rules
  const portsAreDistinct =
    config.gatewayPort !== config.omniroutePort &&
    config.gatewayPort !== config.redisPort &&
    config.omniroutePort !== config.redisPort;

  const portsInValidRange =
    config.gatewayPort >= 1024 && config.gatewayPort <= 65535 &&
    config.omniroutePort >= 1024 && config.omniroutePort <= 65535 &&
    config.redisPort >= 1024 && config.redisPort <= 65535;

  const hasAppName = config.appName.trim().length > 0;
  const hasGatewayToken = config.gatewayToken.trim().length > 0;

  const isHealthy = portsAreDistinct && portsInValidRange && hasAppName && hasGatewayToken;

  const getConflictDetails = () => {
    const issues: string[] = [];
    if (config.gatewayPort === config.omniroutePort) issues.push(`OpenClaw & OmniRoute collide on port ${config.gatewayPort}`);
    if (config.gatewayPort === config.redisPort) issues.push(`OpenClaw & Redis collide on port ${config.gatewayPort}`);
    if (config.omniroutePort === config.redisPort) issues.push(`OmniRoute & Redis collide on port ${config.omniroutePort}`);
    if (!portsInValidRange) issues.push('Ports must be between 1024 and 65535');
    if (!hasAppName) issues.push('Fly App Name is empty');
    if (!hasGatewayToken) issues.push('OPENCLAW_GATEWAY_TOKEN is required');
    return issues;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const gitCliScript = `git init
git add .
git commit -m "feat: initial OmniRoute + OpenClaw Fly.io deployment stack"
gh repo create ${config.appName || 'openclaw-fly-stack'} --public --source=. --remote=origin --push`;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Stack Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                  OmniRoute <span className="text-slate-500">+</span> OpenClaw
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Server className="w-3 h-3" /> Fly.io Bundle
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Container Fly Machine Architect & Generator • Co-located Gateway Engine
              </p>
            </div>
          </div>

          {/* Quick Metrics, Health Check & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* Deployment Health Status Indicator */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowHealthTooltip(!showHealthTooltip)}
                onMouseEnter={() => setShowHealthTooltip(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  isHealthy
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
                }`}
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isHealthy ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  ></span>
                </span>
                <span className="font-semibold">
                  {isHealthy ? 'Deployment Health: OK' : 'Port Conflict Alert'}
                </span>
              </button>

              {/* Health Check Details Popover */}
              {showHealthTooltip && (
                <div className="absolute z-50 top-full left-0 sm:left-auto sm:right-0 mt-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      {isHealthy ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>Configuration Diagnostics</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowHealthTooltip(false)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isHealthy ? (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-[11px] text-emerald-400 font-medium">
                        ✓ All 3 machine ports are distinct & valid
                      </p>
                      <ul className="text-[11px] font-mono space-y-0.5 text-slate-400 pl-1">
                        <li>• Gateway (OpenClaw): :{config.gatewayPort}</li>
                        <li>• Local Router (OmniRoute): :{config.omniroutePort}</li>
                        <li>• Cache (Redis): :{config.redisPort}</li>
                      </ul>
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        Zero port collision detected. Supervised process tree will execute cleanly on Fly.io.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-[11px] text-rose-400 font-semibold">
                        ⚠️ Deployment configuration issues:
                      </p>
                      <ul className="text-[11px] space-y-1 pl-1 text-rose-300">
                        {getConflictDetails().map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>App: <strong className="text-white font-mono">{appName}</strong></span>
            </div>

            {/* Deploy to GitHub Button */}
            <button
              onClick={() => setShowGithubModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition flex items-center gap-1.5 shadow-sm"
              title="Deploy or Export Stack to GitHub"
            >
              <Github className="w-4 h-4 text-white" />
              <span>Deploy to GitHub</span>
            </button>

            <button
              onClick={onResetDefaults}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
              title="Reset configuration to defaults"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={onDownloadZip}
              disabled={isDownloading}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isDownloading ? 'Building ZIP...' : 'Download Stack (.zip)'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-2.5">
          <button
            onClick={() => setActiveTab('configurator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'configurator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Configurator & Code
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'topology'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Architecture Topology
          </button>

          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'wizard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Deployment Wizard
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Gateway Routing Sandbox
          </button>

          <button
            onClick={() => setActiveTab('ai-advisor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ai-advisor'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                : 'text-purple-400 hover:text-purple-300 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            AI DevOps Advisor
          </button>
        </div>
      </div>

      {/* GitHub Deployment Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative space-y-5 my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Deploy Stack to GitHub</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      CI/CD Ready
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sync your OpenClaw + OmniRoute configuration directly to GitHub
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Option 1: AI Studio Export */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Option 1: Direct AI Studio GitHub Export
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                    Recommended
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Use the native <strong>AI Studio Export menu</strong> in the top header bar of your studio workspace. Click <strong>Share / Export</strong> or open <strong>Settings &rarr; Export to GitHub</strong> to instantly push or sync this complete codebase to your connected GitHub account.
                </p>
              </div>

              {/* Option 2: CLI Push Commands */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    Option 2: Terminal / GitHub CLI Push
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(gitCliScript, 'git-cli')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 font-mono transition"
                  >
                    {copiedCmd === 'git-cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{copiedCmd === 'git-cli' ? 'Copied Script!' : 'Copy Shell Commands'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="text-slate-500"># 1. Download & extract your .zip or navigate to project root</p>
                  <p className="text-indigo-300">git init</p>
                  <p className="text-indigo-300">git add .</p>
                  <p className="text-indigo-300">git commit -m "feat: initial OmniRoute + OpenClaw Fly.io deployment stack"</p>
                  <p className="text-slate-500 pt-1"># 2. Create remote repo & push using GitHub CLI (gh)</p>
                  <p className="text-emerald-300">gh repo create {appName || 'openclaw-fly-stack'} --public --source=. --remote=origin --push</p>
                </div>
              </div>

              {/* Option 3: GitHub Actions CI/CD */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  Option 3: Automated Fly.io Deployment Workflow
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Your generated stack already includes <code className="text-amber-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">.github/workflows/deploy.yml</code>. Once pushed to GitHub:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-400">
                  <li>Generate a Fly.io access token: <code className="text-indigo-300 font-mono">fly auth token</code></li>
                  <li>In your GitHub Repository, go to <strong>Settings &rarr; Secrets & variables &rarr; Actions</strong>.</li>
                  <li>Add a new secret named <code className="text-emerald-300 font-mono">FLY_API_TOKEN</code> with your Fly token.</li>
                  <li>Every <code className="text-indigo-300 font-mono">git push</code> to <code className="text-slate-200 font-mono">main</code> will now automatically deploy your multi-process stack to Fly.io!</li>
                </ol>
              </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={onDownloadZip}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center gap-2 hover:opacity-90 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download .ZIP Bundle First</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

