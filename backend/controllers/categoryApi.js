import api from '../Service/api';

/**
 * GET /categories?type=income|expense
 * Trả về danh mục hệ thống + danh mục riêng của user
 * Response: { data: Category[] }
 */
export const getVisible = (type = null) =>
    api.get('/categories', { params: type ? { type } : {} }).then((res) => res.data);

/**
 * POST /categories
 * Body:     { name, type, icon, color }
 * Response: { message, data: Category }
 */
export const create = (payload) =>
    api.post('/categories', payload).then((res) => res.data);

/**
 * DELETE /categories/:id
 * Chỉ xoá được danh mục riêng (isDefault = false)
 * Response: { message }
 */
export const remove = (id) =>
    api.delete(`/categories/${id}`).then((res) => res.data);