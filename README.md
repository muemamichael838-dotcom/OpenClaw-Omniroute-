# OpenClaw + OmniRoute Fly.io Stack Generator

A modern React + TypeScript web application for generating, configuring, inspecting, and deploying co-located **OpenClaw** (autonomous personal AI assistant) and **OmniRoute** (local AI gateway router) multi-process stacks on **Fly.io**.

## 🚀 Key Features

- **Interactive Configuration Panel**: Configure Fly.io app name, region, volume size, process ports (`gatewayPort`, `omniroutePort`, `redisPort`), and upstream model keys (OpenAI, Gemini, Anthropic, Groq, OpenRouter).
- **Maskable API Keys & Tooltips**: Built-in toggle to mask/unmask sensitive keys with contextual security tooltips.
- **Real-Time Deployment Health Check**: Live diagnostic status indicator flagging port collisions or invalid machine configurations.
- **Code Inspector**: Interactive tabbed view to inspect generated stack files: `Dockerfile`, `supervisord.conf`, `start.sh`, `fly.toml`, `deploy.sh`, `.github/workflows/deploy.yml`, `openclaw.json`, and `README.md`.
- **Live Terminal Log Stream**: Animated simulation of container multi-stage build, process supervisor initialization, health probes, and Fly.io ingress setup.
- **GitHub & CI/CD Integration Guide**: One-click instructions and CLI scripts to push generated stack files directly to GitHub with automated Fly.io deployments.
- **Zip Archiver**: Export the complete deployment bundle as a `.zip` archive ready for production deployment.

## 🛠️ Stack Architecture Overview

The generated deployment bundle co-locates three core processes inside a single multi-stage Docker container managed by `supervisord`:

1. **OpenClaw Agent Gateway**: Serves the web management console and WebSocket connections.
2. **OmniRoute Proxy**: OpenAI-compatible gateway routing local model requests across multiple providers.
3. **Redis Store**: In-memory cache and rate-limiter for high-throughput AI agent operations.
4. **Fly.io Volume Mount**: Persistent NVMe storage attached at `/data` for stateful SQLite/JSON databases and workspace files.

## 💻 Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React (`lucide-react`)
- **Archiving**: JSZip (`jszip`)

## ⚡ Development & Local Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript linter
npm run lint

# Build production bundle
npm run build
```

## 📦 Deploying Generated Stacks to Fly.io

1. Use the web interface to configure your desired region, ports, and API keys.
2. Click **Download Zip** or use **Deploy to GitHub** to export your configuration files.
3. In your terminal, run:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
4. Access your live assistant at `https://<your-app-name>.fly.dev`.
