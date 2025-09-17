# check_models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure the API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

print("Available models that support 'generateContent':")

# List all available models
for m in genai.list_models():
  # Check if the 'generateContent' method is supported by the model
  if 'generateContent' in m.supported_generation_methods:
    print(m.name)