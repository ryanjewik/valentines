import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from transformers.modeling_utils import unwrap_model

BASE = "mistralai/Mistral-7B-v0.1"
ADAPTER_DIR = "/work/ryan-lora/checkpoint-17856"
OUT_DIR = "/work/merged-mistral-hf"
OFFLOAD_DIR = "/work/offload"

os.makedirs(OFFLOAD_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

tokenizer = AutoTokenizer.from_pretrained(BASE, use_fast=True)

base = AutoModelForCausalLM.from_pretrained(
    BASE,
    torch_dtype=torch.float16,
    device_map="auto",
    low_cpu_mem_usage=True,
    offload_folder=OFFLOAD_DIR,
    offload_state_dict=True,
)

model = PeftModel.from_pretrained(base, ADAPTER_DIR, is_trainable=False, offload_folder=OFFLOAD_DIR)
model = model.merge_and_unload()

# 🔥 Force materialize all weights to real CPU tensors (no meta)
model = unwrap_model(model)
sd = model.state_dict()
sd = {k: v.to("cpu") for k, v in sd.items()}

# 🔥 Save as SAFETENSORS shards (converter reads these reliably)
model.save_pretrained(
    OUT_DIR,
    state_dict=sd,
    safe_serialization=True,
    max_shard_size="2GB",
)
tokenizer.save_pretrained(OUT_DIR)

print("✅ Saved merged safetensors model to", OUT_DIR)
