import api from '../Service/api';

/**
 * GET /budgets?period=month|year
 * Trả về danh sách ngân sách của user kèm tổng đã chi
 * Response: { success, overview, data: Budget[] }
 */
export const getAll = (period = null, userId = null) =>
    api.get('/budgets', {
        params: {
            ...(period ? { period } : {}),
            ...(userId ? { userId } : {})
        }
    }).then((res) => res.data);
/**
 * GET /budgets/:id
 * Trả về chi tiết 1 ngân sách kèm spent, remaining, percent
 * Response: { success, data: Budget }
 */
export const getById = (id) =>
    api.get(`/budgets/${id}`).then((res) => res.data);

/**
 * POST /budgets
 * Body:     { name, category_id, limit_amount, period, start_date, end_date }
 * Response: { success, message, data: Budget }
 */
export const create = (payload) =>
    api.post('/budgets', payload).then((res) => res.data);

/**
 * PUT /budgets/:id
 * Body:     { name?, category_id?, limit_amount?, period?, start_date?, end_date? }
 * Response: { success, message, data: Budget }
 */
export const update = (id, payload) =>
    api.put(`/budgets/${id}`, payload).then((res) => res.data);

/**
 * DELETE /budgets/:id
 * Chỉ xoá được ngân sách của chính user đang đăng nhập
 * Response: { success, message }
 */
export const remove = (id) =>
    api.delete(`/budgets/${id}`).then((res) => res.data);