import random
import torch

from datasets import load_dataset, Dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig


# ========= Config =========
# Use an INSTRUCT base so instruction-following is strong before style adaption.
model_name = "mistralai/Mistral-7B-Instruct-v0.2"

sms_path = "train_instructions.jsonl"
oasst_name = "OpenAssistant/oasst1"

seed = 42
lang = "en"

# Balance: "weighted" keeps ~20% SMS and ~80% instruction data so the model
# retains strong instruction-following while absorbing SMS *style*.
# Previous "equal" mode (50/50) destroyed instruction-following.
mix_mode = "weighted"

# Ratio: fraction of SMS data relative to instruction data.
# 0.25 means 1 SMS example for every 4 OASST examples.
sms_ratio = 0.25

# Caps: RTX 2080 (8GB) can handle ~10-15K examples in an hour.
# Set lower for faster iteration; None for unlimited.
max_sms = 3000
max_oasst = 12000

# ========= 4-bit loading =========
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
)

tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    device_map="auto",
    quantization_config=bnb_config,
    dtype=torch.float16,
)
model.config.use_cache = False
print(f"Model loaded — GPU mem: {torch.cuda.memory_allocated()/1024**3:.1f} GB", flush=True)


# ========= Load SMS dataset =========
def load_sms_dataset(path: str):
    print(f"Loading SMS data from {path}...", flush=True)
    ds = load_dataset("json", data_files=path)["train"]
    print(f"  -> {len(ds)} SMS examples loaded", flush=True)
    return ds


# ========= Build OASST prompter->assistant pairs =========
def load_oasst_pairs(dataset_name: str, only_lang: str = "en"):
    """
    OASST1 is a flat message table. We form pairs by:
      - selecting assistant messages
      - joining them with their parent prompter message using parent_id -> message_id
    Source: HF dataset docs describe reconstructing trees via parent_id/message_id.
    """
    print(f"Loading {dataset_name}...", flush=True)
    ds = load_dataset(dataset_name)

    # Use train split only for training (you can add validation later)
    train = ds["train"]
    print(f"  -> {len(train)} total rows, filtering to lang={only_lang}...", flush=True)

    # Keep only roles + language we care about (reduces join size)
    # OASST roles are typically "assistant" and "prompter".
    keep = train.filter(lambda x: x.get("lang") == only_lang and x.get("role") in ("assistant", "prompter"))
    print(f"  -> {len(keep)} rows after lang/role filter", flush=True)

    # Build lookup from message_id -> (role, text)
    print("  -> Building message lookup...", flush=True)
    msg_by_id = {}
    for row in keep:
        mid = row.get("message_id")
        if mid is None:
            continue
        msg_by_id[mid] = (row.get("role"), row.get("text", ""))

    # Build prompt/response pairs from assistant rows
    print("  -> Building prompt/response pairs...", flush=True)
    pairs = []
    for row in keep:
        if row.get("role") != "assistant":
            continue

        parent_id = row.get("parent_id")
        if parent_id is None:
            continue

        parent = msg_by_id.get(parent_id)
        if not parent:
            continue

        parent_role, parent_text = parent
        if parent_role != "prompter":
            continue

        prompt = (parent_text or "").strip()
        response = (row.get("text") or "").strip()
        if not prompt or not response:
            continue

        pairs.append({
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": response},
            ]
        })

    print(f"  -> {len(pairs)} pairs built", flush=True)
    return Dataset.from_list(pairs)


def balance_and_mix(sms_ds: Dataset, inst_ds: Dataset, mode: str = "weighted"):
    sms_list = list(sms_ds)
    inst_list = list(inst_ds)

    random.seed(seed)
    random.shuffle(sms_list)
    random.shuffle(inst_list)

    if max_sms is not None:
        sms_list = sms_list[:max_sms]
    if max_oasst is not None:
        inst_list = inst_list[:max_oasst]

    if mode == "weighted":
        # Keep all instruction data, take only sms_ratio fraction of SMS
        n_sms = int(len(inst_list) * sms_ratio)
        sms_list = sms_list[:n_sms]
        print(f"Weighted mix: {n_sms} SMS + {len(inst_list)} OASST "
              f"({n_sms/(n_sms+len(inst_list))*100:.0f}% SMS)")
    elif mode == "equal":
        n = min(len(sms_list), len(inst_list))
        sms_list = sms_list[:n]
        inst_list = inst_list[:n]
    else:
        raise ValueError("mix_mode must be 'equal' or 'weighted'")

    mixed = sms_list + inst_list
    random.shuffle(mixed)
    return Dataset.from_list(mixed)


def format_example(example):
    # Use the model's chat template (critical for instruction-following)
    return tokenizer.apply_chat_template(example["messages"], tokenize=False)


# ========= Load + mix =========
def main():
    # Load + mix datasets
    sms_ds = load_sms_dataset(sms_path)
    oasst_ds = load_oasst_pairs(oasst_name, only_lang=lang)
    mixed_ds = balance_and_mix(sms_ds, oasst_ds, mode=mix_mode)

    print(f"SMS examples: {len(sms_ds)}")
    print(f"OASST pairs (lang={lang}): {len(oasst_ds)}")
    print(f"Mixed examples: {len(mixed_ds)}")

    # ========= LoRA config =========
    peft_config = LoraConfig(
        r=16,                # higher rank = more capacity for style without forgetting
        lora_alpha=32,       # keep alpha = 2*r (standard scaling)
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],  # all attention heads
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )

    training_args = SFTConfig(
        output_dir="./ryan-lora",
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        num_train_epochs=1,               # 1 epoch — less overfitting on SMS junk
        logging_steps=25,
        save_strategy="epoch",
        logging_first_step=True,
        learning_rate=2e-5,               # lower LR preserves instruction-following
        fp16=False,
        bf16=False,
        optim="paged_adamw_8bit",
        gradient_checkpointing=True,
        torch_compile=False,
        report_to="none",
        max_length=512,                  # cap sequence length to save VRAM
    )

    print("Creating trainer (formatting + tokenizing dataset)...", flush=True)
    trainer = SFTTrainer(
        model=model,
        train_dataset=mixed_ds,
        peft_config=peft_config,
        args=training_args,
        formatting_func=format_example,
    )
    print("Trainer ready!", flush=True)

    print(f"Starting training — this will take a while...", flush=True)
    print(f"  Effective batch size: {training_args.per_device_train_batch_size * training_args.gradient_accumulation_steps}", flush=True)
    est_steps = len(mixed_ds) // (training_args.per_device_train_batch_size * training_args.gradient_accumulation_steps)
    print(f"  Est. {est_steps} steps @ ~1s/step ≈ {est_steps//60}min", flush=True)
    trainer.train()

    model.save_pretrained("./ryan-lora")
    tokenizer.save_pretrained("./ryan-lora")
    print("Training complete and model saved to ./ryan-lora")


if __name__ == "__main__":
    main()
