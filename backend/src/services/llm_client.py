import json
import asyncio
import httpx
import logging
from typing import Dict, Any
from src.core.config import settings
from src.core.exceptions import LLMValidationError, EngineProcessingError

logger = logging.getLogger(__name__)

MAX_RETRIES = 4  # esperas de 2s, 4s, 8s entre as tentativas
RETRYABLE_STATUS = {429, 500, 502, 503, 504}

class LLMClient:
    """Cliente assíncrono para comunicação com a API do Modelo de Linguagem."""
    
    def __init__(self):
        # Gemini via endpoint compatível com OpenAI, ajustável via env vars
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = settings.LLM_BASE_URL

    async def analyze_with_governance(self, system_prompt: str, data_context: str) -> Dict[str, Any]:
        """Envia o contexto para o LLM e força uma saída JSON rigorosa."""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": data_context}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.0 # Temperatura ZERO para máxima consistência determinística (zero criatividade)
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                for attempt in range(1, MAX_RETRIES + 1):
                    logger.info(f"Enviando dados para o modelo {self.model} (tentativa {attempt}/{MAX_RETRIES})...")
                    try:
                        response = await client.post(self.base_url, headers=headers, json=payload)
                    except httpx.RequestError as e:
                        if attempt == MAX_RETRIES:
                            raise
                        logger.warning(f"Erro de rede ({e}), nova tentativa em {2 ** attempt}s...")
                        await asyncio.sleep(2 ** attempt)
                        continue

                    # 429 (limite de taxa) e 5xx (sobrecarga) são temporários: espera e tenta de novo
                    if response.status_code in RETRYABLE_STATUS and attempt < MAX_RETRIES:
                        logger.warning(f"LLM respondeu {response.status_code}, nova tentativa em {2 ** attempt}s...")
                        await asyncio.sleep(2 ** attempt)
                        continue
                    break

                if response.status_code != 200:
                    error_detail = response.text
                    logger.error(f"Erro na API do LLM: {error_detail}")
                    raise EngineProcessingError(f"O provedor de IA falhou com status {response.status_code}")
                
                result_data = response.json()
                raw_json_content = result_data["choices"][0]["message"]["content"]
                
                # Transforma a string JSON de volta num dicionário Python
                return json.loads(raw_json_content)
                
        except json.JSONDecodeError as e:
            logger.error(f"LLM devolveu um JSON inválido: {str(e)}")
            raise LLMValidationError("A resposta da IA não é um JSON válido.")
        except httpx.RequestError as e:
            logger.error(f"Erro de rede ao contactar LLM: {str(e)}")
            raise EngineProcessingError("Falha de rede ao contactar a API de IA.")