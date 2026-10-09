from pydantic import BaseModel, Field
from typing import List, Optional
from src.models.enums import ProjectClassification, CriteriaState

# --- 1. Schemas de Ingestão (O que o Frontend envia) ---

class BatchProcessRequest(BaseModel):
    folder_path: str = Field(..., description="Caminho absoluto ou relativo da pasta contendo os projetos.")

class JobStatusResponse(BaseModel):
    job_id: str
    status: str = Field(..., description="PENDING, PROCESSING, COMPLETED, FAILED")
    processed_count: int
    total_projects: int
    message: str

# --- 2. Schemas de Saída (O Gabarito do Hackathon) ---

class CriteriaEvaluation(BaseModel):
    estado: CriteriaState = Field(..., description="O estado formal de validação do critério.")
    justificativa: str = Field(..., description="O texto que fundamenta o estado.")
    fonte: str = Field(..., description="A referência exata (ex: evidencias/metodo.md#1).")

class Evidence(BaseModel):
    referencia: str = Field(..., description="Caminho do ficheiro + âncora (ex: evidencias/medicoes.csv#PRJ21-S02).")
    criterio: str = Field(..., description="Critério de Frascati que a evidência afeta (ex: Incerteza).")
    forca: str = Field(..., description="'forte' ou 'fraca'.")
    justificativa: str = Field(..., description="O que a evidência mostra, numa frase.")

class AnalysisResult(BaseModel):
    projeto_id: str = Field(..., description="O identificador do projeto (ex: PRJ21)")
    titulo: str = Field(default="Título a extrair", description="Nome descritivo do projeto")
    classificacao: ProjectClassification
    justificativa: str = Field(..., description="Fundamentação geral da conclusão.")
    limite: Optional[str] = Field(None, description="Recorte e condições da conclusão. Obrigatório para 'Com ressalvas'.")
    fontes_decisivas: str = Field(..., description="Arquivos separados por | que sustentam a conclusão.")
    divergencia_depoimento: Optional[str] = Field(None, description="Regista quando o registo documental contraria a entrevista.")
    
    # Os Cinco Critérios de Frascati
    criterio_novidade: CriteriaEvaluation
    criterio_criatividade: CriteriaEvaluation
    criterio_incerteza: CriteriaEvaluation
    criterio_sistematicidade: CriteriaEvaluation
    criterio_transferibilidade: CriteriaEvaluation

    # Rastreabilidade (exibidos pelo frontend)
    evidencias: List[Evidence] = Field(default_factory=list, description="Evidências que sustentam a conclusão.")
    evidencias_contrarias: List[Evidence] = Field(default_factory=list, description="Evidências que enfraquecem ou contrariam a conclusão.")
    lacunas: List[str] = Field(default_factory=list, description="Elos de prova ausentes.")
    evidencias_a_solicitar: List[str] = Field(default_factory=list, description="Documentos concretos a pedir à empresa para fechar as lacunas.")

class BatchAnalysisResult(BaseModel):
    job_id: str
    results: List[AnalysisResult]