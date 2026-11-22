
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models so SQLModel registers their database tables.
from app.auth.router import router as auth_router
from app.books.router import router as books_router
from app.database import create_db_and_tables
from app.groups import models as group_models  # noqa: F401
from app.groups.router import router as groups_router
from app.loans.router import router as loans_router
from app.users.router import router as users_router

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

# Create database tables.
create_db_and_tables()

# Register API routers.
app.include_router(auth_router)
app.include_router(books_router)
app.include_router(loans_router)
app.include_router(users_router)
app.include_router(groups_router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/hello")
def hello():
    return {"message": "Hello from LibraryNest!"}
