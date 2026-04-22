import api from '../Service/api';

/**
 * GET /wallets
 * Response: { data: Wallet[] }
 */
export const getAll = () =>
    api.get('/wallets').then((res) => res.data);

/**
 * GET /wallets/:id
 * Response: { data: Wallet }
 */
export const getById = (id) =>
    api.get(`/wallets/${id}`).then((res) => res.data);

/**
 * POST /wallets
 * Body:     { name, type, balance, currency }
 * Response: { message, data: Wallet }
 */
export const create = (payload) =>
    api.post('/wallets', payload).then((res) => res.data);

/**
 * PUT /wallets/:id
 * Body:     { name?, type?, balance?, currency?, is_default? }
 * Response: { message, data: Wallet }
 */
export const update = (id, payload) =>
    api.put(`/wallets/${id}`, payload).then((res) => res.data);

/**
 * DELETE /wallets/:id
 * Response: { message }
 */
export const remove = (id) =>
    api.delete(`/wallets/${id}`).then((res) => res.data);