from pathlib import Path
from typing import Dict, Any
import logging
from src.services.parsers.document_parser import DocumentParser
from src.services.parsers.spreadsheet_parser import SpreadsheetParser

logger = logging.getLogger(__name__)

IGNORAR = {".ds_store", "thumbs.db", "desktop.ini"}
EXTENSOES_TEXTO = {".md", ".txt", ".json"}
EXTENSOES_PLANILHA = {".xlsx", ".xls"}
# Limite por ficheiro para não estourar o contexto do LLM com um anexo gigante
MAX_CHARS_POR_ARQUIVO = 60_000


class DossierAssembler:
    """Mapeia e consolida todos os ficheiros de uma pasta de projeto num único contexto de dados."""

    def __init__(self):
        self.doc_parser = DocumentParser()
        self.sheet_parser = SpreadsheetParser()

    def _ler_arquivo(self, caminho: Path) -> Any:
        ext = caminho.suffix.lower()
        if ext == ".pdf":
            return self.doc_parser.extract_text(caminho)[:MAX_CHARS_POR_ARQUIVO]
        if ext == ".csv":
            return self.sheet_parser.read_csv(caminho)
        if ext in EXTENSOES_PLANILHA:
            # atividades.xlsx tem o cabeçalho na linha 5; as restantes planilhas usam a primeira linha
            header = 4 if caminho.stem.lower() == "atividades" else 0
            return self.sheet_parser.read_excel(caminho, header=header)
        if ext in EXTENSOES_TEXTO:
            return caminho.read_text(encoding="utf-8", errors="replace")[:MAX_CHARS_POR_ARQUIVO]
        return None

    def assemble_from_folder(self, folder_path: Path, project_id: str) -> Dict[str, Any]:
        logger.info(f"Iniciando montagem do dossiê para: {project_id}")

        arquivos: Dict[str, Any] = {}
        falhas: Dict[str, str] = {}

        for caminho in sorted(folder_path.rglob("*")):
            if not caminho.is_file() or caminho.name.lower() in IGNORAR:
                continue
            relativo = caminho.relative_to(folder_path).as_posix()
            try:
                conteudo = self._ler_arquivo(caminho)
            except Exception as e:
                # Um ficheiro corrompido não deve derrubar a análise do projeto inteiro
                logger.warning(f"{project_id}: falha ao ler {relativo}: {e}")
                falhas[relativo] = str(e)
                continue
            if conteudo is None:
                falhas[relativo] = "formato não suportado"
            elif conteudo != "" and conteudo != []:
                arquivos[relativo] = conteudo

        return {
            "project_id": project_id,
            # Chave = caminho relativo, exatamente como deve ser citado em 'fonte'
            "arquivos": arquivos,
            "arquivos_nao_lidos": falhas,
        }
