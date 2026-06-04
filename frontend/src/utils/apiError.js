export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail;
  const status = error?.response?.status;

  if (typeof detail === "string") {
    return status ? `Backend returned ${status}: ${detail}` : detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.msg && Array.isArray(item?.loc)) {
          return `${item.loc.join(".")}: ${item.msg}`;
        }
        if (item?.msg) return item.msg;
        return null;
      })
      .filter(Boolean)
      .join(" ");
  }

  if (detail && typeof detail === "object") {
    const message = detail.msg || JSON.stringify(detail);
    return status ? `Backend returned ${status}: ${message}` : message;
  }

  if (error?.request && !error?.response) {
    const baseUrl = error?.config?.baseURL ?? "";
    const path = error?.config?.url ?? "";
    return `Cannot reach the backend at ${baseUrl}${path}. Make sure FastAPI is running and VITE_API_BASE_URL points to the active backend. Original error: ${error?.message ?? "network request failed"}.`;
  }

  return status ? `Backend returned ${status}: ${error?.message || fallback}` : error?.message || fallback;
}
