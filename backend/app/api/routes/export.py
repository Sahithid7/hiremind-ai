import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response, status

from app.schemas.export import PdfExportRequest

router = APIRouter(prefix="/export", tags=["Export"])


EDGE_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]


@router.post("/pdf")
def export_pdf(payload: PdfExportRequest) -> Response:
    browser_path = find_browser()
    if browser_path is None:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="No local Chromium or Edge browser was found for PDF export.",
        )

    with tempfile.TemporaryDirectory(prefix="hiremind_pdf_") as temp_dir:
        temp_path = Path(temp_dir)
        html_path = temp_path / "document.html"
        pdf_path = temp_path / "document.pdf"
        user_data_dir = temp_path / "browser-profile"
        html_path.write_text(build_print_document(payload), encoding="utf-8")

        command = [
            browser_path,
            "--headless",
            "--disable-gpu",
            "--disable-extensions",
            f"--user-data-dir={user_data_dir}",
            "--print-to-pdf-no-header",
            f"--print-to-pdf={pdf_path}",
            html_path.as_uri(),
        ]

        result = subprocess.run(command, capture_output=True, text=True, timeout=30, check=False)
        if result.returncode != 0 or not pdf_path.exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF export failed. Try again or use the browser print fallback.",
            )

        return Response(
            content=pdf_path.read_bytes(),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_filename(payload.title)}.pdf"'},
        )


def find_browser() -> str | None:
    for candidate in EDGE_CANDIDATES:
        if Path(candidate).exists():
            return candidate
    return shutil.which("msedge") or shutil.which("chrome") or shutil.which("chromium")


def build_print_document(payload: PdfExportRequest) -> str:
    return f"""<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>{escape_title(payload.title)}</title>
    <style>
      @page {{ size: Letter; margin: 0; }}
      * {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      html, body {{ margin: 0; padding: 0; background: white; }}
      body {{ width: 8.5in; min-height: 11in; overflow: hidden; }}
      .page {{ width: 8.5in; min-height: 11in; margin: 0; padding: 0; background: white; overflow: hidden; }}
    </style>
  </head>
  <body>
    <main class="page">{payload.html}</main>
  </body>
</html>"""


def safe_filename(value: str) -> str:
    cleaned = "".join(char if char.isalnum() or char in (" ", "-", "_") else "" for char in value).strip()
    return (cleaned or "HireMind Resume").replace(" ", "_")[:80]


def escape_title(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
