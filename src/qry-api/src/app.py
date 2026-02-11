import logging
from json import dumps as json_dumps

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from lxi_framework import RootQry
from core import process_qry
from endpoints import healthz


logging.basicConfig(level=logging.INFO)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(healthz.router)


@app.post("/qry")
async def handle_qry(qry: RootQry):
    logging.info(f"{handle_qry.__name__} START.")
    output = await process_qry(qry)
    logging.info(f"{handle_qry.__name__} END.")
    resp = json_dumps({"output": output})
    return Response(content=resp, status_code=status.HTTP_200_OK)
