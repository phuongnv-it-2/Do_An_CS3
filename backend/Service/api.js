import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
    baseURL: 'https://enlisted-coke-guide.ngrok-free.dev',
    timeout: 10000, // 👈 tránh treo request
});

// 🔐 Gắn token tự động
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            console.log("📤 Request:", config.url);
            return config;
        } catch (err) {
            console.log("❌ Lỗi lấy token:", err);
            return config;
        }
    },
    (error) => Promise.reject(error)
);

// 📥 Log response + bắt lỗi
api.interceptors.response.use(
    (response) => {
        console.log("📥 Response:", response.data);
        return response;
    },
    async (error) => {
        console.log("❌ API ERROR:", error.response?.data || error.message);

        // 👉 Nếu sau này có auth middleware
        if (error.response?.status === 401) {
            console.log("🔒 Token hết hạn / không hợp lệ");
            await SecureStore.deleteItemAsync('userToken');
        }

        return Promise.reject(error);
    }
);

export default api;