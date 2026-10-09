import json
import logging
from pathlib import Path
from fastapi import HTTPException
from pydantic import ValidationError
from src.services.parsers.dossier_assembler import DossierAssembler
from src.services.llm_client import LLMClient
from src.models.schemas import AnalysisResult
from src.core.exceptions import EngineProcessingError, LLMValidationError

logger = logging.getLogger(__name__)

class FrascatiEngine:
    """
    O Motor Principal do Sistema.
    Orquestra a extração (ETL), a análise semântica (LLM) e a validação de Governança (Pydantic).
    """

    def __init__(self):
        self.assembler = DossierAssembler()
        self.llm_client = LLMClient()

    def _build_system_prompt(self) -> str:
        """Gera as regras estritas que a IA deve seguir. É o 'Cão de Guarda'."""
        schema = AnalysisResult.model_json_schema()
        return f"""
        Você é um auditor técnico especializado no Manual de Frascati e na Lei do Bem (Lei nº 11.196/2005).
        Sua função é apoiar a decisão humana. A análise deve se basear estritamente nos dados fornecidos.

        ENTRADA:
        Um JSON com "arquivos": um mapa cujas chaves são os caminhos relativos dos ficheiros do projeto
        (ex: "dossie_projeto.pdf", "evidencias/medicoes.csv") e cujos valores são o texto ou as linhas extraídas.
        "arquivos_nao_lidos" lista ficheiros que existem mas não puderam ser lidos.

        REGRAS DE GOVERNANÇA CRÍTICAS:
        1. A classificação deve ser APENAS uma de: "Elegível", "Com ressalvas", "Não elegível", "Evidência insuficiente".
        2. A lógica é relacional. Cruze as afirmações (dossiê, entrevista, registros) com as provas nos dados
           (medições, resultados, cronologia, revisão). Alegação sem prova documental não sustenta um critério.
        3. Nunca invente dados. Toda 'fonte' e 'referencia' deve usar uma chave existente de "arquivos",
           seguida de '#' e do identificador da linha/trecho quando houver (ex: evidencias/medicoes.csv#PRJ21-S01).
        4. O 'limite' é obrigatório se a classificação for 'Com ressalvas'.
        5. Se o depoimento da entrevista contradiz o registro documental, descreva em 'divergencia_depoimento'.
        6. Preencha 'evidencias' (o que sustenta), 'evidencias_contrarias' (o que enfraquece), 'lacunas' (elos ausentes)
           e 'evidencias_a_solicitar' (documentos concretos a pedir). Para "Evidência insuficiente", lacunas e
           evidencias_a_solicitar não podem ficar vazias.
        7. Extraia o 'titulo' real do projeto a partir do dossiê.
        8. Escreva todos os textos em português do Brasil, de forma objetiva.

        FORMATO DE SAÍDA EXIGIDO:
        Devolva APENAS um objeto JSON rigorosamente aderente a este schema (sem markdown):
        {json.dumps(schema, ensure_ascii=False)}
        """

    async def analyze_project_async(self, folder_path: Path, project_id: str) -> AnalysisResult:
        """Processa um único projeto de ponta a ponta de forma assíncrona."""
        try:
            # 1. ETL: Extração e Montagem do Dossiê Relacional
            context_data = self.assembler.assemble_from_folder(folder_path, project_id)

            if not context_data["arquivos"]:
                raise EngineProcessingError(f"O projeto {project_id} não possui ficheiros válidos para análise.")

            # default=str cobre datas e outros tipos que vêm das planilhas
            data_context = json.dumps(context_data, ensure_ascii=False, default=str)
            system_prompt = self._build_system_prompt()

            # 2. IA: Avaliação Semântica
            llm_response_dict = await self.llm_client.analyze_with_governance(system_prompt, data_context)
            # O ID vem da pasta, não da IA, para o resultado nunca ficar trocado
            llm_response_dict["projeto_id"] = project_id

            # 3. Governança: Validação do Contrato Pydantic
            try:
                validated_result = AnalysisResult(**llm_response_dict)
                logger.info(f"Projeto {project_id} processado e validado com sucesso!")
                return validated_result
            except ValidationError as ve:
                logger.error(f"Erro de Governança! IA desrespeitou o contrato no projeto {project_id}: {ve.errors()}")
                raise LLMValidationError(f"IA falhou no esquema de validação: {str(ve)}")

        except HTTPException:
            # Já é um erro do domínio com mensagem própria: não embrulhar de novo
            raise
        except Exception as e:
            logger.error(f"Falha terminal no processamento do projeto {project_id}: {str(e)}")
            raise EngineProcessingError(str(e))
