#!/bin/sh
set -eu

MODEL_NAME="${OLLAMA_MODEL_NAME:-ryan-mistral-gpu}"
MODELFILE="${OLLAMA_MODELFILE:-/work/Modelfile.gpu.gguf}"

echo "[init] starting ollama server..."
ollama serve &
SERVER_PID="$!"

echo "[init] waiting for ollama to become ready..."
# ollama CLI talks to the local server; loop until it responds
i=0
until ollama list >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge 60 ]; then
    echo "[init] ERROR: ollama did not become ready in time"
    kill "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

echo "[init] ollama ready."

# Create model only if it doesn't already exist in the ollama_data volume
if ollama list | awk '{print $1}' | grep -qx "$MODEL_NAME"; then
  echo "[init] model '$MODEL_NAME' already exists; skipping create."
else
  if [ ! -f "$MODELFILE" ]; then
    echo "[init] ERROR: Modelfile not found at $MODELFILE"
    echo "[init] Make sure /work/Modelfile.gpu.gguf exists and is mounted."
    kill "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi

  echo "[init] creating model '$MODEL_NAME' from $MODELFILE ..."
  ollama create "$MODEL_NAME" -f "$MODELFILE"
  echo "[init] model '$MODEL_NAME' created."
fi

# Keep the container alive with the server process
wait "$SERVER_PID"
