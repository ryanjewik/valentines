from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments
from peft import LoraConfig
from trl import SFTTrainer

model_name = "mistralai/Mistral-7B-v0.1"

dataset = load_dataset("json", data_files="train_instructions.json")

tokenizer = AutoTokenizer.from_pretrained(model_name)

def format_example(example):
    return f"### Instruction:\n{example['instruction']}\n### Response:\n{example['response']}"

from transformers import BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype="float16",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

import torch

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    device_map="auto",
    quantization_config=bnb_config,
    dtype=torch.float16,   # ← THE FIX
)



peft_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj","v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

training_args = TrainingArguments(
    output_dir="./ryan-lora",
    per_device_train_batch_size=2,
    num_train_epochs=3,
    logging_steps=10,
    save_strategy="epoch",
    learning_rate=2e-4,
    fp16=False,
    bf16=False,
    optim="paged_adamw_8bit",
    gradient_checkpointing=True,
    torch_compile=False,   # important
)

model.config.use_cache = False


trainer = SFTTrainer(
    model=model,
    train_dataset=dataset["train"],
    peft_config=peft_config,
    args=training_args,
    formatting_func=format_example
)

trainer.train()
model.save_pretrained("./ryan-lora")

tokenizer.save_pretrained("./ryan-lora")
print("Training complete and model saved to ./ryan-lora")
