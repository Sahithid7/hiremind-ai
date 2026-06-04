import { api } from "./api";

export async function fetchApplications() {
  const { data } = await api.get("/applications");
  return data;
}

export async function fetchApplicationAnalytics() {
  const { data } = await api.get("/applications/analytics");
  return data;
}

export async function createApplication(payload) {
  const { data } = await api.post("/applications", payload);
  return data;
}

export async function updateApplication(id, payload) {
  const { data } = await api.put(`/applications/${id}`, payload);
  return data;
}

export async function deleteApplication(id) {
  await api.delete(`/applications/${id}`);
}
