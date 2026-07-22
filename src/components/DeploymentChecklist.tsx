import React, { useState, useEffect, useRef } from 'react';
import { StackConfig } from '../types';
import { Terminal, Copy, Check, CheckSquare, Square, Play, ShieldAlert, ArrowUpRight, Github, GitBranch, Key, Sparkles, Pause, RotateCcw, Activity, Radio } from 'lucide-react';

interface DeploymentChecklistProps {
  config: StackConfig;
}

export const DeploymentChecklist: React.FC<DeploymentChecklistProps> = ({ config }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isStreamingLogs, setIsStreamingLogs] = useState<boolean>(false);
  const [isLogPaused, setIsLogPaused] = useState<boolean>(false);
  const [logIndex, setLogIndex] = useState<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const toggleStep = (key: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const simulatedLogSequence = [
    { level: 'BUILD', text: `Initiating multi-stage Docker build for stack [${config.appName}]...` },
    { level: 'BUILD', text: 'Step 1/14 : FROM redis:7.2-alpine' },
    { level: 'BUILD', text: 'Step 2/14 : FROM node:20-alpine AS omniroute-builder' },
    { level: 'BUILD', text: 'Step 3/14 : COPY omniroute/package.json ./ && npm install --production' },
    { level: 'BUILD', text: 'Step 4/14 : FROM golang:1.22-alpine AS openclaw-builder' },
    { level: 'BUILD', text: 'Step 5/14 : COPY openclaw/ ./ && go build -o /usr/local/bin/openclaw' },
    { level: 'BUILD', text: 'Step 6/14 : COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf' },
    { level: 'BUILD', text: 'Successfully compiled multi-process supervisord container image.' },
    { level: 'DEPLOY', text: `Pushing image layer to registry.fly.io/${config.appName}:latest (42.8 MB)...` },
    { level: 'DEPLOY', text: `Attaching persistent volume '${config.volumeName}' (${config.volumeSizeGb}GB) in region '${config.region}'` },
    { level: 'DEPLOY', text: `Injecting encrypted secrets (OPENCLAW_GATEWAY_TOKEN, LLM_KEYS)...` },
    { level: 'INIT', text: '[supervisord] 2026-07-22 04:28:30,012 INFO supervisord started with pid 1' },
    { level: 'REDIS', text: `[redis] 1:M 22 Jul 2026 04:28:30.100 * Running standalone mode on port ${config.redisPort}` },
    { level: 'REDIS', text: '[redis] 1:M 22 Jul 2026 04:28:30.102 * Memory storage engine initialized successfully' },
    { level: 'OMNI', text: `[omniroute] [INFO] Starting OmniRoute proxy gateway engine on 0.0.0.0:${config.omniroutePort}` },
    { level: 'OMNI', text: `[omniroute] [INFO] Routes: OpenAI (${config.openAiApiKey ? 'Ready' : 'Unconfigured'}), Gemini (${config.geminiApiKey ? 'Ready' : 'Unconfigured'}), Anthropic (${config.anthropicApiKey ? 'Ready' : 'Unconfigured'}), Groq (${config.groqApiKey ? 'Ready' : 'Unconfigured'}), OpenRouter (${config.openRouterApiKey ? 'Ready' : 'Unconfigured'})` },
    { level: 'CLAW', text: `[openclaw] 2026/07/22 04:28:30 [INFO] OpenClaw Agent Gateway listening on 0.0.0.0:${config.gatewayPort}` },
    { level: 'CLAW', text: '[openclaw] 2026/07/22 04:28:30 [INFO] Bearer token verification active for gateway requests' },
    { level: 'HEALTH', text: `[health-check] GET http://127.0.0.1:${config.gatewayPort}/health -> 200 OK (0.6ms)` },
    { level: 'HEALTH', text: `[fly-ingress] Machine 9080e72f102048 [app] is healthy! Routing public HTTPS traffic.` },
    { level: 'SUCCESS', text: `🚀 Deployment complete! Live URL: https://${config.appName}.fly.dev` },
  ];

  useEffect(() => {
    if (!isStreamingLogs || isLogPaused) return;

    if (logIndex >= simulatedLogSequence.length) {
      return;
    }

    const timer = setTimeout(() => {
      setLogIndex((prev) => prev + 1);
    }, 450);

    return () => clearTimeout(timer);
  }, [isStreamingLogs, isLogPaused, logIndex, simulatedLogSequence.length]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logIndex, isStreamingLogs]);

  const startStream = () => {
    setIsStreamingLogs(true);
    setIsLogPaused(false);
    if (logIndex >= simulatedLogSequence.length) {
      setLogIndex(1);
    }
  };

  const resetStream = () => {
    setLogIndex(0);
    setIsLogPaused(false);
  };

  const githubPushScript = `# 1. Initialize local repository & add stack files
git init
git add .
git commit -m "feat: initial OpenClaw + OmniRoute Fly.io deployment stack"

# 2. Create GitHub repository & push (using GitHub CLI 'gh')
gh repo create ${config.appName || 'openclaw-fly-stack'} --public --source=. --remote=origin --push

# 3. Get your Fly API Token and add it to GitHub Secrets
fly auth token
# Go to your repo on GitHub: Settings -> Secrets and variables -> Actions
# Add secret: FLY_API_TOKEN with the output of 'fly auth token'`;

  const steps = [
    {
      id: 'step1',
      title: '1. Initialize Submodules & Repository Root',
      description: 'Clone or navigate to your openclaw-omni-stack repository root and fetch both submodules.',
      command: `mkdir -p ${config.appName} && cd ${config.appName}
git init
git submodule add https://github.com/diegosouzapw/OmniRoute.git omniroute
git submodule add https://github.com/openclaw/openclaw.git openclaw
git submodule update --init --recursive`,
    },
    {
      id: 'step2',
      title: '2. Register Fly App Context',
      description: 'Authenticate with Fly CLI and create your Fly app entry.',
      command: `fly auth login
fly apps create ${config.appName}`,
    },
    {
      id: 'step3',
      title: '3. Provision Persistent Storage Volume',
      description: `Create a ${config.volumeSizeGb} GB Fly volume in region ${config.region} to persist OpenClaw memory & OmniRoute keys.`,
      command: `fly volumes create ${config.volumeName} --size ${config.volumeSizeGb} --region ${config.region} --app ${config.appName}`,
    },
    {
      id: 'step4',
      title: '4. Inject Fly Secrets & API Credentials',
      description: 'Set OPENCLAW_GATEWAY_TOKEN and upstream LLM keys into encrypted secrets storage.',
      command: `fly secrets set OPENCLAW_GATEWAY_TOKEN="${config.gatewayToken}" --app ${config.appName}${
        config.openAiApiKey ? `\nfly secrets set OPENAI_API_KEY="${config.openAiApiKey}" --app ${config.appName}` : ''
      }${
        config.geminiApiKey ? `\nfly secrets set GEMINI_API_KEY="${config.geminiApiKey}" --app ${config.appName}` : ''
      }${
        config.anthropicApiKey ? `\nfly secrets set ANTHROPIC_API_KEY="${config.anthropicApiKey}" --app ${config.appName}` : ''
      }${
        config.groqApiKey ? `\nfly secrets set GROQ_API_KEY="${config.groqApiKey}" --app ${config.appName}` : ''
      }${
        config.openRouterApiKey ? `\nfly secrets set OPENROUTER_API_KEY="${config.openRouterApiKey}" --app ${config.appName}` : ''
      }`,
    },
    {
      id: 'step5',
      title: '5. Execute Container Build & Deployment',
      description: 'Trigger the multi-stage Docker build and boot supervisord on Fly.io.',
      command: `fly deploy --app ${config.appName}`,
    },
    {
      id: 'step6',
      title: '6. Verification & Health Monitoring',
      description: 'Check runtime logs and verify that Redis, OmniRoute, and OpenClaw processes are running.',
      command: `fly status --app ${config.appName}
fly logs --app ${config.appName}`,
    },
  ];

  const fullScript = steps.map((s) => `# ${s.title}\n${s.command}`).join('\n\n');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Step-by-Step Fly.io Deployment Wizard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Follow this sequential checklist or execute the automated <code className="text-indigo-300 font-mono">./deploy.sh</code> script.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              if (isStreamingLogs) {
                setIsStreamingLogs(false);
              } else {
                startStream();
              }
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition flex items-center gap-2 ${
              isStreamingLogs
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
            }`}
          >
            <Radio className={`w-4 h-4 ${isStreamingLogs ? 'animate-pulse text-amber-400' : 'text-emerald-400'}`} />
            <span>{isStreamingLogs ? 'Hide Live Log Stream' : 'Live Log Stream Simulation'}</span>
          </button>

          <button
            onClick={() => copyToClipboard(fullScript, 'full')}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-2 shrink-0"
          >
            {copiedId === 'full' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copiedId === 'full' ? 'All Commands Copied!' : 'Copy Entire Deploy Script'}
          </button>
        </div>
      </div>

      {/* Live Log Stream Terminal Simulation Panel */}
      {isStreamingLogs && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Docker & Fly.io Startup Stream — {config.appName}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {logIndex >= simulatedLogSequence.length ? (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stack Boot Complete</span>
                </span>
              ) : isLogPaused ? (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1.5">
                  <Pause className="w-3.5 h-3.5" />
                  <span>Stream Paused</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>Streaming Logs ({logIndex}/{simulatedLogSequence.length})</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsLogPaused(!isLogPaused)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1"
                title={isLogPaused ? "Resume Stream" : "Pause Stream"}
              >
                {isLogPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                <span>{isLogPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                type="button"
                onClick={resetStream}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1"
                title="Restart Log Stream"
              >
                <RotateCcw className="w-3 h-3 text-indigo-400" />
                <span>Replay</span>
              </button>
            </div>
          </div>

          <div
            ref={logContainerRef}
            className="p-4 font-mono text-[11px] leading-relaxed max-h-80 overflow-y-auto space-y-1 bg-slate-950 text-slate-300"
          >
            {simulatedLogSequence.slice(0, logIndex).map((log, idx) => {
              const getBadgeColor = (lvl: string) => {
                switch (lvl) {
                  case 'BUILD': return 'bg-purple-950/80 text-purple-300 border-purple-800';
                  case 'DEPLOY': return 'bg-blue-950/80 text-blue-300 border-blue-800';
                  case 'REDIS': return 'bg-rose-950/80 text-rose-300 border-rose-800';
                  case 'OMNI': return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
                  case 'CLAW': return 'bg-amber-950/80 text-amber-300 border-amber-800';
                  case 'HEALTH': return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                  case 'SUCCESS': return 'bg-emerald-900 text-emerald-200 border-emerald-500 font-bold';
                  default: return 'bg-slate-800 text-slate-300 border-slate-700';
                }
              };

              return (
                <div key={idx} className="flex items-start gap-2.5 hover:bg-slate-900/50 py-0.5 px-1 rounded transition">
                  <span className="text-slate-600 shrink-0 text-[10px]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getBadgeColor(log.level)} shrink-0`}>
                    {log.level}
                  </span>
                  <span className={log.level === 'SUCCESS' ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                    {log.text}
                  </span>
                </div>
              );
            })}

            {logIndex === 0 && (
              <div className="text-slate-500 italic text-center py-6">
                Click "Resume" or wait for container initialization stream to begin...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checklist Grid */}
      <div className="space-y-4">
        {steps.map((step) => {
          const isDone = completedSteps[step.id];
          return (
            <div
              key={step.id}
              className={`border rounded-xl p-4 transition ${
                isDone
                  ? 'bg-slate-950/80 border-emerald-500/40 opacity-80'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="text-slate-400 hover:text-emerald-400 transition"
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                    {step.title}
                  </h3>
                </div>

                <button
                  onClick={() => copyToClipboard(step.command, step.id)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition flex items-center gap-1.5"
                >
                  {copiedId === step.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-3 pl-7">{step.description}</p>

              <div className="pl-7">
                <pre className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
                  <code>{step.command}</code>
                </pre>
              </div>
            </div>
          );
        })}
      </div>

      {/* GitHub Deployment & CI/CD Guide Section */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>GitHub Repository & Automated CI/CD Guide</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  GitHub Actions
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Push your generated stack files to GitHub to enable automated deployments on every commit.
              </p>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(githubPushScript, 'github-script')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shrink-0"
          >
            {copiedId === 'github-script' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copiedId === 'github-script' ? 'Copied GitHub Script!' : 'Copy GitHub Setup Commands'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <span className="flex h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 items-center justify-center text-[10px]">1</span>
              <span>Initialize & Push Repo</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Initialize a git repository in your unzipped stack folder or use AI Studio's <strong>Export to GitHub</strong> option.
            </p>
            <pre className="bg-slate-900 p-2 rounded text-[11px] font-mono text-indigo-300 border border-slate-800/80 overflow-x-auto">
              git init && git add .{"\n"}
              git commit -m "feat: stack"
            </pre>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <span className="flex h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 items-center justify-center text-[10px]">2</span>
              <span>Configure Fly API Secret</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Run <code className="text-amber-300 font-mono">fly auth token</code> in terminal. On GitHub, add a secret named <code className="text-emerald-300 font-mono">FLY_API_TOKEN</code> under <strong>Settings &rarr; Secrets &rarr; Actions</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <span className="flex h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 items-center justify-center text-[10px]">3</span>
              <span>Automated Deployments</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Your stack includes <code className="text-amber-300 font-mono">.github/workflows/deploy.yml</code>. Any push to <code className="text-slate-200 font-mono">main</code> will trigger GitHub Actions to deploy to Fly.io automatically.
            </p>
          </div>

        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 font-mono text-xs text-slate-300 overflow-x-auto space-y-1">
          <p className="text-slate-500"># Complete Shell Commands to Push Stack to New GitHub Repo:</p>
          <p className="text-emerald-300">{githubPushScript}</p>
        </div>
      </div>

      {/* Completion Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-5 text-slate-200 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" /> Live Endpoint After Deploy
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Once deployed, sign into the OpenClaw Control Dashboard using your token.
          </p>
        </div>
        <a
          href={`https://${config.appName}.fly.dev`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          Open App https://{config.appName}.fly.dev <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

    </div>
  );
};

