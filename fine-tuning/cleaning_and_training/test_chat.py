import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

base_model = "mistralai/Mistral-7B-v0.1"
lora_path = "output"   # your folder

tokenizer = AutoTokenizer.from_pretrained(base_model)

model = AutoModelForCausalLM.from_pretrained(
    base_model,
    dtype=torch.float16,
    device_map="auto",
)

model = PeftModel.from_pretrained(model, lora_path)

prompt = "hey what are you up to tonight?"
inputs = tokenizer(prompt, return_tensors="pt").to("cuda")

with torch.no_grad():
    out = model.generate(**inputs, max_new_tokens=80)

print(tokenizer.decode(out[0], skip_special_tokens=True))
