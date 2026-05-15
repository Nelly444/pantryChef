import sys
import os
import traceback

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

try:
    from main import app
except Exception as _e:
    from fastapi import FastAPI
    app = FastAPI()
    _tb = traceback.format_exc()

    @app.get("/{path:path}")
    @app.post("/{path:path}")
    @app.delete("/{path:path}")
    def _import_error(path: str = ""):
        return {"import_error": str(_e), "traceback": _tb}
