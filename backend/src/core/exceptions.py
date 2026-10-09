from fastapi import HTTPException, status

class EngineProcessingError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha na esteira de processamento: {detail}"
        )

class DataIngestionError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erro ao extrair dados dos ficheiros CSV/PDF: {detail}"
        )

class LLMValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"O LLM retornou um formato fora do padrão de governança: {detail}"
        )