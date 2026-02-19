import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE = "mistralai/Mistral-7B-Instruct-v0.2"
ADAPTER_DIR = "/work/ryan-lora/checkpoint-1875"
OUT_DIR = "/work/merged-mistral-hf-gpu"

os.makedirs(OUT_DIR, exist_ok=True)

tokenizer = AutoTokenizer.from_pretrained(BASE, use_fast=True)

# IMPORTANT: no bitsandbytes / no 4-bit
# Use device_map="auto" and constrain GPU memory so it offloads the rest to CPU
model = AutoModelForCausalLM.from_pretrained(
    BASE,
    torch_dtype=torch.float16,
    device_map="auto",
    low_cpu_mem_usage=True,
    max_memory={0: "7GiB", "cpu": "30GiB"},  # tweak if needed
)

model = PeftModel.from_pretrained(model, ADAPTER_DIR, is_trainable=False)
model = model.merge_and_unload()

# Move everything to CPU before saving (real tensors)
model = model.to("cpu")
torch.cuda.empty_cache()

model.save_pretrained(OUT_DIR, safe_serialization=True, max_shard_size="2GB")
tokenizer.save_pretrained(OUT_DIR)

print("✅ Saved merged (fp16) model to", OUT_DIR)
