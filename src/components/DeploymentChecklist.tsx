import React, { useState } from 'react';
import { StackConfig } from '../types';
import { Terminal, Copy, Check, CheckSquare, Square, Play, ShieldAlert, ArrowUpRight, Github, GitBranch, Key, Sparkles } from 'lucide-react';

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

        <button
          onClick={() => copyToClipboard(fullScript, 'full')}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-2 shrink-0"
        >
          {copiedId === 'full' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          {copiedId === 'full' ? 'All Commands Copied!' : 'Copy Entire Deploy Script'}
        </button>
      </div>

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

