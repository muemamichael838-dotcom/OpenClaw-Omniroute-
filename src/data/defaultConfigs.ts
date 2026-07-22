import { StackConfig, GeneratedFile } from '../types';

export const initialConfig: StackConfig = {
  appName: 'openclaw-omni-stack',
  region: 'iad',
  memoryMb: 1024,
  cpuKind: 'shared',
  cpus: 1,
  volumeName: 'claw_omni_data',
  volumeSizeGb: 2,
  mountPath: '/data',
  gatewayPort: 18789,
  omniroutePort: 20128,
  redisPort: 6379,
  gatewayToken: 'sk-openclaw-gateway-secure-token-2026',
  nodeVersion: '24-bookworm-slim',
  autoStop: 'suspend',
  minMachinesRunning: 1,
  openAiApiKey: '',
  geminiApiKey: '',
  anthropicApiKey: '',
  groqApiKey: '',
  openRouterApiKey: '',
};

export function generateStackFiles(config: StackConfig): GeneratedFile[] {
  const dockerfileContent = `# =======================================================
# STAGE 1: Build OmniRoute (Local AI Gateway)
# =======================================================
FROM node:${config.nodeVersion} AS omniroute-builder
WORKDIR /app/omniroute
COPY omniroute/package*.json ./
RUN npm ci
COPY omniroute/ .
RUN npm run build --if-present

# =======================================================
# STAGE 2: Build OpenClaw (Autonomous AI Assistant)
# =======================================================
FROM node:${config.nodeVersion} AS openclaw-builder
WORKDIR /app/openclaw
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY openclaw/package.json openclaw/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY openclaw/ .
RUN pnpm build --if-present

# =======================================================
# STAGE 3: Final Runner Image
# =======================================================
FROM node:${config.nodeVersion} AS runner

# Install supervisord process manager, Redis server, and essential CLI tools
RUN apt-get update && apt-get install -y \\
    supervisor \\
    redis-server \\
    git \\
    curl \\
    ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

# Copy built OmniRoute application
COPY --from=omniroute-builder /app/omniroute /app/omniroute
WORKDIR /app/omniroute
RUN npm prune --production

# Copy built OpenClaw application
COPY --from=openclaw-builder /app/openclaw /app/openclaw
WORKDIR /app/openclaw
RUN pnpm prune --prod

# Back to root context
WORKDIR /app

# Create internal persistent storage directories on volume mount
RUN mkdir -p ${config.mountPath}/omniroute ${config.mountPath}/openclaw

# Expose OpenClaw Web Control UI / Gateway Port
EXPOSE ${config.gatewayPort}

# Copy supervisor configuration and entrypoint startup script
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]
`;

  const supervisordContent = `[supervisord]
nodaemon=true
logfile=/dev/null
logfile_maxbytes=0

[program:redis]
command=redis-server --port ${config.redisPort} --bind 127.0.0.1 --protected-mode yes
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:omniroute]
directory=/app/omniroute
command=npm run start
autostart=true
autorestart=true
environment=PORT="${config.omniroutePort}",REDIS_URL="redis://127.0.0.1:${config.redisPort}",NODE_ENV="production"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:openclaw]
directory=/app/openclaw
command=node dist/index.js gateway --bind 0.0.0.0 --port ${config.gatewayPort}
autostart=true
autorestart=true
environment=NODE_ENV="production",OPENCLAW_CONFIG_DIR="${config.mountPath}/openclaw",OPENCLAW_WORKSPACE_DIR="${config.mountPath}/openclaw/workspace"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
`;

  const startShContent = `#!/bin/bash
set -e

echo "=== Initializing OmniRoute + OpenClaw Container ==="

# Ensure persistent mount directories exist
mkdir -p ${config.mountPath}/omniroute
mkdir -p ${config.mountPath}/openclaw
mkdir -p ${config.mountPath}/openclaw/workspace

# Initialize default OpenClaw configuration if missing
if [ ! -f ${config.mountPath}/openclaw/openclaw.json ]; then
  echo "Writing default openclaw.json configuration..."
  cat <<EOF > ${config.mountPath}/openclaw/openclaw.json
{
  "agents": {
    "defaults": {
      "workspace": "${config.mountPath}/openclaw/workspace",
      "modelGatewayUrl": "http://127.0.0.1:${config.omniroutePort}/v1"
    }
  },
  "gateway": {
    "bind": "0.0.0.0",
    "port": ${config.gatewayPort}
  }
}
EOF
fi

echo "Starting Supervisord Process Manager..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
`;

  const flyTomlContent = `# fly.toml - Configuration for ${config.appName}
app = "${config.appName}"
primary_region = "${config.region}"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = ${config.gatewayPort}
  force_https = true
  auto_stop_machines = "${config.autoStop}"
  auto_start_machines = true
  min_machines_running = ${config.minMachinesRunning}
  processes = ["app"]

[mounts]
  source = "${config.volumeName}"
  destination = "${config.mountPath}"

[vm]
  cpu_kind = "${config.cpuKind}"
  cpus = ${config.cpus}
  memory_mb = ${config.memoryMb}
`;

  const dockerIgnoreContent = `.git
.github
node_modules
dist
.next
omniroute/node_modules
omniroute/.next
openclaw/node_modules
openclaw/dist
*.log
.DS_Store
`;

  const openclawJsonContent = `{
  "agents": {
    "defaults": {
      "workspace": "${config.mountPath}/openclaw/workspace",
      "modelGatewayUrl": "http://127.0.0.1:${config.omniroutePort}/v1",
      "defaultProvider": "omniroute"
    }
  },
  "gateway": {
    "bind": "0.0.0.0",
    "port": ${config.gatewayPort}
  }
}
`;

  const deployShContent = `#!/bin/bash
set -e

APP_NAME="${config.appName}"
REGION="${config.region}"
VOLUME_NAME="${config.volumeName}"
VOLUME_SIZE="${config.volumeSizeGb}"
GATEWAY_TOKEN="${config.gatewayToken}"

echo "🚀 Step 1: Checking Fly.io CLI authentication..."
fly status &>/dev/null || fly auth login

echo "📁 Step 2: Initializing Git submodules if needed..."
git submodule update --init --recursive

echo "🛠️ Step 3: Launching Fly app registration..."
fly apps create $APP_NAME || echo "App $APP_NAME already exists."

echo "💾 Step 4: Creating persistent Fly volume..."
fly volumes create $VOLUME_NAME --size $VOLUME_SIZE --region $REGION --app $APP_NAME -y || echo "Volume $VOLUME_NAME already exists."

echo "🔐 Step 5: Setting secure gateway token secret..."
fly secrets set OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN" --app $APP_NAME

${config.openAiApiKey ? `fly secrets set OPENAI_API_KEY="${config.openAiApiKey}" --app $APP_NAME\n` : ''}${config.geminiApiKey ? `fly secrets set GEMINI_API_KEY="${config.geminiApiKey}" --app $APP_NAME\n` : ''}${config.anthropicApiKey ? `fly secrets set ANTHROPIC_API_KEY="${config.anthropicApiKey}" --app $APP_NAME\n` : ''}${config.groqApiKey ? `fly secrets set GROQ_API_KEY="${config.groqApiKey}" --app $APP_NAME\n` : ''}${config.openRouterApiKey ? `fly secrets set OPENROUTER_API_KEY="${config.openRouterApiKey}" --app $APP_NAME\n` : ''}
echo "📦 Step 6: Deploying container to Fly.io..."
fly deploy --app $APP_NAME

echo "✅ Stack deployment complete!"
echo "Access OpenClaw dashboard at: https://$APP_NAME.fly.dev"
`;

  const readmeContent = `# ${config.appName} — OmniRoute + OpenClaw Co-Located Fly.io Deployment Stack

This repository contains the complete multi-process deployment bundle for running **OmniRoute** (AI gateway router) and **OpenClaw** (autonomous personal AI assistant) co-located inside a single Fly Machine container.

## 🏗️ Stack Architecture
- **Public Gateway**: Port \`${config.gatewayPort}\` (OpenClaw Web Console & WebSocket)
- **Local AI Proxy**: Port \`${config.omniroutePort}\` (OmniRoute OpenAI-compatible model router, bound to localhost)
- **Local Redis Storage**: Port \`${config.redisPort}\` (Internal rate-limiter, session store & model cache)
- **Persistent NVMe Mount**: \`${config.mountPath}\` (\`${config.volumeName}\`, ${config.volumeSizeGb} GB in region \`${config.region}\`)

## 🔑 Upstream Provider & Environment Secrets
Configure secrets securely in Fly.io using \`fly secrets set\`:
- \`OPENCLAW_GATEWAY_TOKEN\`: Admin token for OpenClaw dashboard
- \`OPENAI_API_KEY\`: OpenAI models (GPT-4o, etc.)
- \`GEMINI_API_KEY\`: Google Gemini models
- \`ANTHROPIC_API_KEY\`: Anthropic Claude models
- \`GROQ_API_KEY\`: Groq ultra-fast Llama inference models
- \`OPENROUTER_API_KEY\`: OpenRouter provider fallback routes

## 🚀 Quick Start Deployment

### 1. Automated Script
\`\`\`bash
chmod +x deploy.sh
./deploy.sh
\`\`\`

### 2. Manual Fly CLI Deployment
\`\`\`bash
# Create Fly application & volume
fly apps create ${config.appName}
fly volumes create ${config.volumeName} --size ${config.volumeSizeGb} --region ${config.region} --app ${config.appName}

# Set security token
fly secrets set OPENCLAW_GATEWAY_TOKEN="${config.gatewayToken}" --app ${config.appName}

# Deploy stack container
fly deploy --app ${config.appName}
\`\`\`

## 🤖 GitHub Actions CI/CD Deployment
This stack includes \`.github/workflows/deploy.yml\` for continuous deployment:
1. Push this repository to GitHub:
   \`\`\`bash
   git init && git add .
   git commit -m "feat: stack release"
   gh repo create ${config.appName} --public --source=. --remote=origin --push
   \`\`\`
2. Retrieve your Fly API token:
   \`\`\`bash
   fly auth token
   \`\`\`
3. On GitHub, navigate to **Settings → Secrets and variables → Actions**.
4. Create a new repository secret named \`FLY_API_TOKEN\` containing your Fly token.
5. Every push to \`main\` or \`master\` will automatically build and deploy your stack to Fly.io.

## 🌐 Accessing Your Deployment
Navigate to \`https://${config.appName}.fly.dev\` and enter your \`OPENCLAW_GATEWAY_TOKEN\` to access the OpenClaw management console.
`;

  const githubWorkflowContent = `name: Deploy to Fly.io

on:
  push:
    branches: [ main, master ]

jobs:
  deploy:
    name: Deploy Stack
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Flyctl CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy application to Fly.io
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: \${{ secrets.FLY_API_TOKEN }}
`;

  return [
    {
      id: 'dockerfile',
      path: 'Dockerfile',
      filename: 'Dockerfile',
      language: 'dockerfile',
      description: 'Multi-stage Dockerfile bundling OmniRoute, OpenClaw, Redis, and Supervisor',
      content: dockerfileContent,
    },
    {
      id: 'supervisord',
      path: 'supervisord.conf',
      filename: 'supervisord.conf',
      language: 'ini',
      description: 'Supervisord process manager configuration for Redis, OmniRoute, and OpenClaw',
      content: supervisordContent,
    },
    {
      id: 'start-sh',
      path: 'start.sh',
      filename: 'start.sh',
      language: 'bash',
      description: 'Container entrypoint script initializing /data volume directories & configs',
      content: startShContent,
    },
    {
      id: 'fly-toml',
      path: 'fly.toml',
      filename: 'fly.toml',
      language: 'toml',
      description: 'Fly.io deployment descriptor with HTTP port routing and volume mounts',
      content: flyTomlContent,
    },
    {
      id: 'github-workflow',
      path: '.github/workflows/deploy.yml',
      filename: 'deploy.yml',
      language: 'yaml',
      description: 'GitHub Actions workflow for automated CI/CD deployments to Fly.io on push',
      content: githubWorkflowContent,
    },
    {
      id: 'dockerignore',
      path: '.dockerignore',
      filename: '.dockerignore',
      language: 'text',
      description: 'Excludes unnecessary node_modules and build build artifacts from container',
      content: dockerIgnoreContent,
    },
    {
      id: 'openclaw-json',
      path: 'openclaw.json',
      filename: 'openclaw.json',
      language: 'json',
      description: 'Default OpenClaw gateway & agent model router configuration',
      content: openclawJsonContent,
    },
    {
      id: 'deploy-sh',
      path: 'deploy.sh',
      filename: 'deploy.sh',
      language: 'bash',
      description: 'Automated shell script to provision Fly app, volumes, secrets, and trigger deploy',
      content: deployShContent,
    },
    {
      id: 'readme',
      path: 'README.md',
      filename: 'README.md',
      language: 'markdown',
      description: 'Documentation guide for running and managing the combined stack',
      content: readmeContent,
    },
  ];
}
