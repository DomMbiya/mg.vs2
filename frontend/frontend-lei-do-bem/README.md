# Frontend · Motor de Governança (Lei do Bem)

React 18 + Vite + Tailwind CSS 4 + framer-motion.

## Rodar

```bash
npm install
cp .env.example .env   # ajuste VITE_API_URL se o backend não estiver em localhost:8000
npm run dev
```

## Modos

- **API real**: envia as pastas arrastadas para `POST /api/v1/jobs/analyze-upload` e acompanha
  `/jobs/{id}/status` até buscar `/jobs/{id}/results`. A opção "Analisar uma pasta que já está no
  servidor" usa o endpoint que já existe, `POST /api/v1/jobs/analyze-batch`.
- **Demonstração**: mesmo fluxo, com resultados simulados e sem chamar a IA. Serve para ensaiar.

## Rota de upload no backend

O navegador não envia o caminho da pasta, só os arquivos. Para o arrastar e soltar funcionar com a
API real, adicione esta rota em `src/api/routes.py` e `python-multipart` no `requirements.txt`:

```python
import shutil, tempfile
from typing import List
from fastapi import File, Form, UploadFile

@router.post("/jobs/analyze-upload", status_code=status.HTTP_202_ACCEPTED)
async def start_upload_analysis(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    paths: List[str] = Form(...),
):
    if len(files) != len(paths):
        raise HTTPException(status_code=400, detail="Quantidade de arquivos e caminhos não confere.")
    base = Path(tempfile.mkdtemp(prefix="lei_do_bem_")).resolve()
    for upload, rel in zip(files, paths):
        destino = (base / rel).resolve()
        if base not in destino.parents:
            raise HTTPException(status_code=400, detail=f"Caminho inválido: {rel}")
        destino.parent.mkdir(parents=True, exist_ok=True)
        with destino.open("wb") as saida:
            shutil.copyfileobj(upload.file, saida)

    job_id = str(uuid.uuid4())
    JOBS_DB[job_id] = {"job_id": job_id, "status": "PENDING", "processed_count": 0,
                       "total_projects": 0, "results": [], "message": "Arquivos recebidos."}
    background_tasks.add_task(process_batch_background, job_id, base, FrascatiEngine())
    return {"job_id": job_id, "message": "Job iniciado com sucesso. Consulte o status."}
```

## Campos que a tela usa

A tela aceita o schema atual (`classificacao`, `fontes_decisivas`, `criterio_*`) e também os campos
novos, se forem adicionados ao backend: `classificacao_recomendada`, `evidencias`
(`id`, `referencia`, `criterio`, `forca`, `justificativa`), `evidencias_contrarias`, `lacunas` e
`evidencias_a_solicitar`. Qualquer chave que comece com `criterio_` vira uma linha de critério.
