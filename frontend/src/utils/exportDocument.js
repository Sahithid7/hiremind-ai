import { api } from "../services/api";

export async function exportElementAsPdf(title, html) {
  try {
    const { data } = await api.post("/export/pdf", { title, html }, { responseType: "blob", timeout: 60000 });
    downloadBlob(data, `${safeFilename(title)}.pdf`);
    return { ok: true, method: "backend" };
  } catch (error) {
    openPrintFallback(title, html);
    return { ok: false, method: "print", error };
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openPrintFallback(title, html) {
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) return;

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: Letter; margin: 0; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
          body { margin: 0; background: #f4f7fb; color: #101828; font-family: Inter, Arial, sans-serif; }
          .page { width: 8.5in; min-height: 11in; margin: 24px auto; background: white; padding: 0; box-shadow: 0 20px 70px rgba(16,24,40,0.12); overflow: visible; word-break: break-word; overflow-wrap: break-word; }
          h1, h2, h3, p { margin-top: 0; }
          @media print {
            body { background: white; }
            .page { margin: 0; box-shadow: none; width: 8.5in; min-height: 11in; }
          }
        </style>
      </head>
      <body>
        <main class="page">${html}</main>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  popup.document.close();
}

function safeFilename(value) {
  return String(value || "HireMind Resume")
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80) || "HireMind_Resume";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
