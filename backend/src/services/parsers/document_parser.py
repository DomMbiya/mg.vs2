import pdfplumber
from pathlib import Path
import logging
from src.core.exceptions import DataIngestionError

logger = logging.getLogger(__name__)

class DocumentParser:
    """Responsável por extrair texto bruto de ficheiros PDF de forma determinística."""
    
    @staticmethod
    def extract_text(file_path: Path) -> str:
        if not file_path.exists() or file_path.suffix.lower() != '.pdf':
            logger.warning(f"Ficheiro PDF ignorado ou não encontrado: {file_path}")
            return ""
            
        text_blocks = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_blocks.append(text)
            return "\n".join(text_blocks)
        except Exception as e:
            logger.error(f"Erro ao extrair PDF {file_path}: {str(e)}")
            raise DataIngestionError(f"Falha na extração de texto do ficheiro {file_path.name}: {str(e)}")