import os
from dotenv import load_dotenv

# Nạp file .env từ thư mục backend hoặc root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH, override=True)
else:
    load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = "HARNESS AI AGENTIC"
    VERSION: str = "1.0.0"
    
    # Model 1 & 2: DeepSeek V4 Flash / V4 Pro
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
    DEEPSEEK_MODEL_PRO: str = os.getenv("DEEPSEEK_MODEL_PRO", "deepseek-v4-pro")
    DEFAULT_DIRECTOR_PROVIDER: str = os.getenv("DEFAULT_DIRECTOR_PROVIDER", "deepseek")
    
    # Model 3: OpenRouter Qwen 3 Image Pro
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    QWEN_API_KEY: str = os.getenv("QWEN_API_KEY", "")
    QWEN_MODEL: str = os.getenv("QWEN_MODEL", "qwen/qwen-3-image-pro")

settings = Settings()
