#!/usr/bin/env bash
set -euo pipefail

pip install -U pip
pip uninstall -y peft transformers tokenizers || true

pip install -U torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers==4.48.0 peft==0.18.1 accelerate safetensors huggingface_hub sentencepiece

python -c "import transformers, peft; print('transformers', transformers.__version__, 'peft', peft.__version__)"

python /work/merge_lora.py
