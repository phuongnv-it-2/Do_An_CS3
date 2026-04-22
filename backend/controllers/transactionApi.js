import api from '../Service/api';

/**
 * GET /transactions
 * @param {{ walletId?, type?, startDate?, endDate?, page?, limit? }} params
 * Response: { data: Transaction[] }
 */
export const getAll = (params = {}) =>
    api.get('/transactions', { params }).then((res) => res.data);

/**
 * GET /transactions/summary
 * Tổng thu/chi theo tháng hiện tại (hoặc theo filter)
 * @param {{ walletId?, startDate?, endDate? }} params
 * Response: { data: { totalIncome, totalExpense } }
 */
export const getSummary = (params = {}) =>
    api.get('/transactions/summary', { params }).then((res) => res.data);

/**
 * POST /transactions
 * Body:     { amount, type, date, note, location, walletId, categoryId }
 * Response: { message, data: Transaction }
 */
export const create = (payload) =>
    api.post('/transactions', payload).then((res) => res.data);

/**
 * PUT /transactions/:id
 * Body:     { amount?, type?, date?, note?, location?, walletId?, categoryId? }
 * Response: { message, data: Transaction }
 */
export const update = (id, payload) =>
    api.put(`/transactions/${id}`, payload).then((res) => res.data);

/**
 * DELETE /transactions/:id
 * Response: { message }
 */
export const remove = (id) =>
    api.delete(`/transactions/${id}`).then((res) => res.data);