from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.database import engine, Base
from .api.routes import router

# Initialize SQLite database schemas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FRAUDGUARD AI - Real-Time Payment Fraud Detection System",
    description="Production-grade financial transaction risk engine powered by Scikit-Learn GBDT & Isolation Forest",
    version="2.4.1",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(router)  # root mounting for convenience

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
