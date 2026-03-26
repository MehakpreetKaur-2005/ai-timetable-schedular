"""
Configuration Management
Loads environment variables and application settings
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Groq API Configuration
    groq_api_key: Optional[str] = None
    ai_model: str = "llama-3.3-70b-versatile"
    ai_temperature: float = 0.7
    ai_max_tokens: int = 2000

    # Supabase Configuration
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    
    # Application Settings
    app_env: str = "development"
    log_level: str = "INFO"
    
    # GA Default Settings
    default_population_size: int = 100
    default_generations: int = 100
    default_mutation_rate: float = 0.1
    default_crossover_rate: float = 0.8
    
    class Config:
        env_file = str(Path(__file__).resolve().parent.parent / ".env")
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    s = Settings()
    # Explicit fallbacks for GROQ
    if not s.groq_api_key:
         s.groq_api_key = os.environ.get("GROQ_API_KEY")
    
    # Explicit fallbacks for Supabase (mapping from VITE_ names)
    if not s.supabase_url:
        s.supabase_url = os.environ.get("VITE_SUPABASE_URL")
    if not s.supabase_key:
        # Use service role key if available (admin access), otherwise fallback to anon key
        s.supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
         
    return s


# Validate on import
try:
    settings = get_settings()
    if not settings.groq_api_key or settings.groq_api_key == "your_groq_api_key_here":
        print("\n" + "="*70)
        print("⚠️  WARNING: GROQ_API_KEY not set properly!")
        print("="*70)
        print("Please follow these steps:")
        print("1. Go to https://console.groq.com/keys")
        print("2. Sign up/Login (free)")
        print("3. Create a new API key")
        print("4. Copy the key to your .env file:")
        print("   GROQ_API_KEY=gsk_your_actual_key_here")
        print("="*70 + "\n")
except Exception as e:
    print(f"\n⚠️  Configuration Error: {e}")
    print("Please create a .env file with GROQ_API_KEY\n")