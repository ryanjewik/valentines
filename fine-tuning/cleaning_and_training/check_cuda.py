import sys
import traceback

try:
    import torch
    print("TORCH", torch.__version__)
    try:
        cuda_ok = torch.cuda.is_available()
        print("CUDA_AVAILABLE", cuda_ok)
        print("CUDA_COUNT", torch.cuda.device_count())
        if cuda_ok:
            print("DEVICE_NAME", torch.cuda.get_device_name(0))
    except Exception as e:
        print("TORCH_CUDA_CHECK_ERROR", e)
except Exception as e:
    print("TORCH_IMPORT_ERROR", e)
    traceback.print_exc()

try:
    import bitsandbytes as bnb
    print("BNB", getattr(bnb, '__version__', 'unknown'))
except Exception as e:
    print("BNB_IMPORT_ERROR", e)

try:
    import accelerate
    print("ACCELERATE", getattr(accelerate, '__version__', 'unknown'))
except Exception as e:
    print("ACCELERATE_IMPORT_ERROR", e)

try:
    import transformers
    print("TRANSFORMERS", getattr(transformers, '__version__', 'unknown'))
except Exception as e:
    print("TRANSFORMERS_IMPORT_ERROR", e)

print('PYTHON', sys.version.replace('\n',' '))
