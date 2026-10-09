import uuid
import shutil
import asyncio
import logging
import tempfile
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, BackgroundTasks, HTTPException, status, File, Form, UploadFile
from src.models.schemas import BatchProcessRequest, JobStatusResponse, BatchAnalysisResult
from src.services.analyzer import FrascatiEngine

logger = logging.getLogger(__name__)
router = APIRouter()

# Simulação de um banco de dados em memória para rastrear os Jobs (Em produção: Redis/PostgreSQL)
JOBS_DB: Dict[str, Dict[str, Any]] = {}

async def process_batch_background(job_id: str, folder_path: Path, engine: FrascatiEngine, cleanup: bool = False):
    """Executa a análise de vários projetos de forma concorrente em background."""
    try:
        # Identifica todas as pastas de projetos (ex: PRJ21, PRJ22)
        project_folders = [d for d in folder_path.iterdir() if d.is_dir() and d.name.startswith("PRJ")]
        
        JOBS_DB[job_id]["total_projects"] = len(project_folders)
        JOBS_DB[job_id]["status"] = "PROCESSING"
        
        results = []
        batch_size = 5 # Processa 5 projetos ao mesmo tempo na IA
        
        for i in range(0, len(project_folders), batch_size):
            batch = project_folders[i:i+batch_size]
            
            # Cria as tarefas assíncronas para o lote atual
            tasks = [engine.analyze_project_async(proj_dir, proj_dir.name) for proj_dir in batch]
            
            # asyncio.gather dispara todos os 5 ao mesmo tempo e aguarda
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for proj_dir, res in zip(batch, batch_results):
                if isinstance(res, Exception):
                    detalhe = getattr(res, "detail", None) or str(res)
                    logger.error(f"Erro no projeto {proj_dir.name}: {detalhe}")
                    # Adiciona um registo de falha estruturado para não quebrar o lote inteiro
                    results.append({"projeto_id": proj_dir.name, "erro": detalhe})
                else:
                    results.append(res.model_dump())
                    
            JOBS_DB[job_id]["processed_count"] += len(batch)
            logger.info(f"Job {job_id}: {JOBS_DB[job_id]['processed_count']}/{len(project_folders)} concluídos.")
            
        JOBS_DB[job_id]["status"] = "COMPLETED"
        JOBS_DB[job_id]["results"] = results
        JOBS_DB[job_id]["message"] = "Processamento em lote finalizado com sucesso."
        
    except Exception as e:
        logger.error(f"Erro catastrófico no Job {job_id}: {str(e)}")
        JOBS_DB[job_id]["status"] = "FAILED"
        JOBS_DB[job_id]["message"] = f"Erro fatal: {str(e)}"
    finally:
        if cleanup:
            # Pastas temporárias de upload não são mais necessárias depois da análise
            shutil.rmtree(folder_path, ignore_errors=True)


@router.post("/jobs/analyze-batch", status_code=status.HTTP_202_ACCEPTED)
async def start_batch_analysis(request: BatchProcessRequest, background_tasks: BackgroundTasks):
    """Inicia o processamento pesado e devolve imediatamente um Job ID."""
    folder_path = Path(request.folder_path)
    
    if not folder_path.exists() or not folder_path.is_dir():
        raise HTTPException(status_code=404, detail="O diretório especificado não foi encontrado.")
        
    job_id = str(uuid.uuid4())
    JOBS_DB[job_id] = {
        "job_id": job_id,
        "status": "PENDING",
        "processed_count": 0,
        "total_projects": 0,
        "results": [],
        "message": "Aguardando início do processamento..."
    }
    
    engine = FrascatiEngine()
    background_tasks.add_task(process_batch_background, job_id, folder_path, engine)
    
    return {"job_id": job_id, "message": "Job iniciado com sucesso. Consulte o status."}

@router.post("/jobs/analyze-upload", status_code=status.HTTP_202_ACCEPTED)
async def start_upload_analysis(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    paths: List[str] = Form(...),
):
    """Recebe as pastas arrastadas no frontend, grava numa pasta temporária e inicia o Job."""
    if len(files) != len(paths):
        raise HTTPException(status_code=400, detail="Quantidade de arquivos e caminhos não confere.")

    base = Path(tempfile.mkdtemp(prefix="lei_do_bem_")).resolve()
    for upload, rel in zip(files, paths):
        destino = (base / rel).resolve()
        # Impede caminhos como ../../ que escapariam da pasta temporária
        if base not in destino.parents:
            raise HTTPException(status_code=400, detail=f"Caminho inválido: {rel}")
        destino.parent.mkdir(parents=True, exist_ok=True)
        with destino.open("wb") as saida:
            shutil.copyfileobj(upload.file, saida)

    job_id = str(uuid.uuid4())
    JOBS_DB[job_id] = {
        "job_id": job_id,
        "status": "PENDING",
        "processed_count": 0,
        "total_projects": 0,
        "results": [],
        "message": "Arquivos recebidos. Aguardando início do processamento..."
    }

    background_tasks.add_task(process_batch_background, job_id, base, FrascatiEngine(), True)
    return {"job_id": job_id, "message": "Job iniciado com sucesso. Consulte o status."}

@router.get("/jobs/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    """Permite ao Frontend verificar a barra de progresso."""
    if job_id not in JOBS_DB:
        raise HTTPException(status_code=404, detail="Job ID não encontrado.")
        
    job = JOBS_DB[job_id]
    return JobStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        processed_count=job["processed_count"],
        total_projects=job["total_projects"],
        message=job["message"]
    )

@router.get("/jobs/{job_id}/results")
def get_job_results(job_id: str):
    """Retorna os JSONs finais completos (Gabarito) quando o Job estiver COMPLETED."""
    if job_id not in JOBS_DB:
        raise HTTPException(status_code=404, detail="Job ID não encontrado.")
    
    if JOBS_DB[job_id]["status"] != "COMPLETED":
        raise HTTPException(status_code=400, detail="Os resultados ainda não estão prontos.")
        
    return {"job_id": job_id, "results": JOBS_DB[job_id]["results"]}