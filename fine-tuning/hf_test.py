from datasets import load_dataset

dataset = load_dataset("OpenAssistant/oasst1")

print(dataset)
print(dataset["train"][0])