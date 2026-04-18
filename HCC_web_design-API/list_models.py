
import google.generativeai as genai
import os

def load_keys(filepath='api_keys.txt'):
    keys = {}
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                if '=' in line:
                    k, v = line.strip().split('=', 1)
                    keys[k] = v
    return keys

keys = load_keys()
api_key = keys.get('GEMINI_API_KEY')

if not api_key:
    print("API Key not found")
else:
    genai.configure(api_key=api_key)
    print("Listing models:")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
    except Exception as e:
        print(f"Error: {e}")
