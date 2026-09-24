import api from "./api";

export async function getUsers() {
  const response = await api.get("/admin/users");
  return response.data;
}

export async function getUser(userId) {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
}

export async function createUser(userData) {
  const response = await api.post("/admin/users", userData);
  return response.data;
}

export async function updateUser(userId, userData) {
  const response = await api.patch(
    `/admin/users/${userId}`,
    userData
  );

  return response.data;
}

export async function deleteUser(userId) {
  const response = await api.delete(
    `/admin/users/${userId}`
  );

  return response.data;
}