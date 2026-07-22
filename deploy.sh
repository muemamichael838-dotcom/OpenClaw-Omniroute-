#!/bin/bash
set -e

# Configurable Variables
APP_NAME="${FLY_APP_NAME:-openclaw-omniroute-stack}"
REGION="${FLY_REGION:-iad}"
VOLUME_NAME="${FLY_VOLUME_NAME:-openclaw_data}"
VOLUME_SIZE="${FLY_VOLUME_SIZE:-10}"
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-openclaw-secret-key}"

echo "=========================================================="
echo "🚀 OpenClaw + OmniRoute Fly.io Stack Pre-Deployment Checks"
echo "=========================================================="

# 1. Check Fly.io CLI
if ! command -v fly &> /dev/null && ! command -v flyctl &> /dev/null; then
    echo "❌ Error: Neither 'fly' nor 'flyctl' CLI is installed."
    echo "Please install flyctl: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

FLY_CMD=$(command -v fly || command -v flyctl)
echo "✅ Fly CLI detected: $FLY_CMD"

# 2. Check Authentication
echo "🔍 Step 1/5: Verifying Fly.io authentication..."
if ! $FLY_CMD auth whoami &>/dev/null; then
    echo "⚠️ Not logged into Fly.io. Launching interactive authentication..."
    $FLY_CMD auth login
fi
echo "✅ Authenticated with Fly.io."

# 3. Check / Create Application
echo "🔍 Step 2/5: Checking Fly application '$APP_NAME'..."
if ! $FLY_CMD status --app "$APP_NAME" &>/dev/null; then
    echo "🛠️ Creating Fly application '$APP_NAME'..."
    $FLY_CMD apps create "$APP_NAME"
else
    echo "✅ Fly application '$APP_NAME' exists."
fi

# 4. Check / Provision Persistent Volume
echo "🔍 Step 3/5: Checking persistent volume '$VOLUME_NAME'..."
VOLUMES_LIST=$($FLY_CMD volumes list --app "$APP_NAME" 2>/dev/null || true)

if echo "$VOLUMES_LIST" | grep -q "$VOLUME_NAME"; then
    echo "✅ Volume '$VOLUME_NAME' is already provisioned on app '$APP_NAME'."
else
    echo "💾 Volume '$VOLUME_NAME' not found. Provisioning ${VOLUME_SIZE}GB volume in region '${REGION}'..."
    $FLY_CMD volumes create "$VOLUME_NAME" --size "$VOLUME_SIZE" --region "$REGION" --app "$APP_NAME" -y
    echo "✅ Volume '$VOLUME_NAME' created successfully."
fi

# 5. Check & Set Secrets
echo "🔍 Step 4/5: Setting required application secrets..."
SECRETS_TO_SET=()

if [ -n "$GATEWAY_TOKEN" ]; then
    SECRETS_TO_SET+=("OPENCLAW_GATEWAY_TOKEN=$GATEWAY_TOKEN")
fi

if [ -n "$OPENAI_API_KEY" ]; then
    SECRETS_TO_SET+=("OPENAI_API_KEY=$OPENAI_API_KEY")
fi

if [ -n "$GEMINI_API_KEY" ]; then
    SECRETS_TO_SET+=("GEMINI_API_KEY=$GEMINI_API_KEY")
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    SECRETS_TO_SET+=("ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY")
fi

if [ -n "$GROQ_API_KEY" ]; then
    SECRETS_TO_SET+=("GROQ_API_KEY=$GROQ_API_KEY")
fi

if [ -n "$OPENROUTER_API_KEY" ]; then
    SECRETS_TO_SET+=("OPENROUTER_API_KEY=$OPENROUTER_API_KEY")
fi

if [ ${#SECRETS_TO_SET[@]} -gt 0 ]; then
    echo "🔐 Provisioning secrets to Fly.io..."
    $FLY_CMD secrets set "${SECRETS_TO_SET[@]}" --app "$APP_NAME"
    echo "✅ Secrets configured."
else
    echo "ℹ️ No extra secrets provided in env, setting default OPENCLAW_GATEWAY_TOKEN..."
    $FLY_CMD secrets set OPENCLAW_GATEWAY_TOKEN="openclaw-secret-key" --app "$APP_NAME"
fi

# 6. Trigger Build and Deployment
echo "=========================================================="
echo "📦 Step 5/5: Launching 'fly deploy' build & container rollout..."
echo "=========================================================="

$FLY_CMD deploy --app "$APP_NAME" --remote-only

echo ""
echo "=========================================================="
echo "🎉 Stack Deployment Complete!"
echo "🌐 Live Application URL: https://$APP_NAME.fly.dev"
echo "=========================================================="
