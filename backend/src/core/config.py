from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Decision Support Engine - Lei do Bem"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Configurações do LLM (A serem preenchidas no ambiente real)
    GEMINI_API_KEY: str = "sua_chave_api_aqui"
    GEMINI_MODEL: str = "gemini-3.8-flash"
    # Endpoint compatível com OpenAI do Gemini
    LLM_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    
    # Tolerâncias e timeouts do motor
    BATCH_PROCESS_TIMEOUT_SECONDS: int = 300

    # NOVA ABORDAGEM PYDANTIC V2+ (Substitui a antiga 'class Config:')
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()