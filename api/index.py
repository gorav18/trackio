from fastapi import FastAPI
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

@app.get("/api/config")
def get_config():
    return {
        "supabaseUrl": os.getenv("SUPABASE_URL", ""),
        "supabaseAnonKey": os.getenv("SUPABASE_ANON_KEY", "")
    }

@app.get("/")
def read_root():
    return FileResponse("index.html")

@app.get("/{catchall:path}")
def read_index(catchall: str):
    # Serve the file if it exists, otherwise fallback to index.html (SPA routing)
    if os.path.isfile(catchall):
        return FileResponse(catchall)
    return FileResponse("index.html")
