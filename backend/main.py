
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.books.router import router as books_router
from app.database import create_db_and_tables

app = FastAPI(
    title="LibraryNest API",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_db_and_tables()
app.include_router(books_router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/hello")
def hello():
    return {"message": "Hello from LibraryNest!"}
