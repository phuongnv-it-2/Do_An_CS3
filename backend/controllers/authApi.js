import api from "../Service/api";

/**
 * GET /auth/profile
 * Response: { user: { id, email, full_name, role, balance } }
 */
export const getProfile = () =>
  api.get("/auth/profile").then((res) => res.data);
