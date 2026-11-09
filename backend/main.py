
import ipaddress
import socket
from urllib.parse import urlparse

import httpx

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .database.database import engine, Base
from .api.routes import router


# Initialize database schemas
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="FRAUDGUARD AI - Real-Time Payment Fraud Detection System",
    description=(
        "Production-grade financial transaction risk engine "
        "powered by Scikit-Learn GBDT & Isolation Forest"
    ),
    version="2.4.2",
    docs_url="/docs",
    redoc_url="/redoc"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# REMOTE DATASET FETCH PROXY
# GET /api/fetch-dataset?url=https://example.com/data.csv
# --------------------------------------------------

MAX_DATASET_SIZE = 20 * 1024 * 1024  # 20 MB
DOWNLOAD_TIMEOUT = 45.0


def validate_public_url(url: str):
    """Reject invalid URLs and private/internal destinations."""

    try:
        parsed = urlparse(url)

        if parsed.scheme not in ("http", "https"):
            raise HTTPException(
                status_code=400,
                detail="Only HTTP and HTTPS dataset URLs are supported."
            )

        if not parsed.hostname:
            raise HTTPException(
                status_code=400,
                detail="Invalid dataset URL."
            )

        if parsed.username or parsed.password:
            raise HTTPException(
                status_code=400,
                detail="URLs containing credentials are not allowed."
            )

        hostname = parsed.hostname.lower()

        if hostname in ("localhost", "localhost.localdomain"):
            raise HTTPException(
                status_code=400,
                detail="Localhost URLs are not allowed."
            )

        try:
            addresses = socket.getaddrinfo(
                hostname,
                parsed.port or (443 if parsed.scheme == "https" else 80),
                type=socket.SOCK_STREAM
            )

            for address in addresses:
                ip = ipaddress.ip_address(address[4][0])

                if not ip.is_global:
                    raise HTTPException(
                        status_code=400,
                        detail="Private or internal network URLs are not allowed."
                    )

        except socket.gaierror:
            raise HTTPException(
                status_code=400,
                detail="Could not resolve the dataset hostname."
            )

        return parsed

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid dataset URL."
        )


@app.get("/api/fetch-dataset")
async def fetch_dataset(url: str = Query(...)):
    """
    Fetch a public CSV or JSON dataset and return its contents.
    The frontend handles CSV/JSON parsing and fraud dataset ingestion.
    """

    parsed = validate_public_url(url)

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(DOWNLOAD_TIMEOUT),
            follow_redirects=False,
            trust_env=False
        ) as client:

            current_url = url

            # Validate each redirect destination.
            for _ in range(6):

                current_parsed = validate_public_url(current_url)

                async with client.stream(
                    "GET",
                    current_url,
                    headers={
                        "User-Agent": "FraudGuard-Dataset-Ingestion/1.0",
                        "Accept": "text/csv, application/json, text/plain, */*"
                    }
                ) as response:

                    if response.status_code in (301, 302, 303, 307, 308):
                        location = response.headers.get("location")

                        if not location:
                            raise HTTPException(
                                status_code=502,
                                detail="Dataset server returned an invalid redirect."
                            )

                        from urllib.parse import urljoin
                        current_url = urljoin(current_url, location)
                        validate_public_url(current_url)
                        continue

                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=502,
                            detail=(
                                f"Dataset server returned HTTP "
                                f"{response.status_code}."
                            )
                        )

                    content_length = response.headers.get("content-length")

                    if content_length and int(content_length) > MAX_DATASET_SIZE:
                        raise HTTPException(
                            status_code=413,
                            detail="Dataset exceeds the 20 MB download limit."
                        )

                    chunks = []
                    total_size = 0

                    async for chunk in response.aiter_bytes():
                        total_size += len(chunk)

                        if total_size > MAX_DATASET_SIZE:
                            raise HTTPException(
                                status_code=413,
                                detail="Dataset exceeds the 20 MB download limit."
                            )

                        chunks.append(chunk)

                    content = b"".join(chunks)

                    if not content.strip():
                        raise HTTPException(
                            status_code=422,
                            detail="The remote dataset is empty."
                        )

                    # Accept UTF-8 CSV/JSON data only.
                    try:
                        text_content = content.decode("utf-8-sig")
                    except UnicodeDecodeError:
                        raise HTTPException(
                            status_code=415,
                            detail="Dataset must be a UTF-8 encoded CSV or JSON file."
                        )

                    if text_content.lstrip().lower().startswith(
                        ("<!doctype html", "<html")
                    ):
                        raise HTTPException(
                            status_code=422,
                            detail=(
                                "The URL returned an HTML webpage, not a CSV or JSON file. "
                                "Use a direct download URL."
                            )
                        )

                    return Response(
                        content=text_content,
                        media_type="text/plain; charset=utf-8",
                        headers={
                            "Cache-Control": "no-store",
                            "X-Dataset-Size": str(total_size)
                        }
                    )

            raise HTTPException(
                status_code=502,
                detail="Too many redirects while downloading the dataset."
            )

    except HTTPException:
        raise

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Dataset download timed out. Try a smaller dataset."
        )

    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to connect to the dataset server: {str(exc)}"
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Dataset proxy error: {str(exc)}"
        )


# --------------------------------------------------
# EXISTING FRAUDGUARD API ROUTES
# --------------------------------------------------

# Keep the existing versioned API routes.
app.include_router(router, prefix="/api/v1")

# Preserve the existing root-mounted API routes.
app.include_router(router)


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FraudGuard API",
        "version": "2.4.2"
    }


# Local development
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
