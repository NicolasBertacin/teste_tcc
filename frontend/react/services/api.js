/**
 * TrendCommerce AI - React API Service
 * Centraliza requisições HTTP para a API REST FastAPI (/api/v1).
 */

const API_BASE_URL = (window.location.port === '8000' || window.location.port === '5500')
    ? `${window.location.origin}/api/v1`
    : 'http://localhost:8000/api/v1';

class ApiService {
    constructor() {
        this.tokenKey = 'trendecommerce_token';
        this.userKey = 'trendecommerce_user';
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setSession(token, user) {
        localStorage.setItem(this.tokenKey, token);
        if (user) {
            localStorage.setItem(this.userKey, JSON.stringify(user));
        }
    }

    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    getUser() {
        const stored = localStorage.getItem(this.userKey);
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401 && !endpoint.includes('/auth/login')) {
                this.clearSession();
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMsg = data.detail || (Array.isArray(data.detail) ? data.detail[0].msg : 'Erro na requisição.');
                throw new Error(errorMsg);
            }

            return data;
        } catch (error) {
            console.error(`[API Error] ${endpoint}:`, error.message);
            throw error;
        }
    }

    // ==========================================
    // Autenticação
    // ==========================================
    auth = {
        login: async (email, password) => {
            const data = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            if (data.access_token) {
                this.setSession(data.access_token, data.user);
            }
            return data;
        },

        register: async (email, password, name) => {
            return await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, name })
            });
        },

        getMe: async () => {
            return await this.request('/auth/me');
        },

        forgotPassword: async (email) => {
            return await this.request('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        },

        resetPassword: async (email, code, new_password) => {
            return await this.request('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email, code, new_password })
            });
        },

        logout: () => {
            this.clearSession();
        }
    };

    // ==========================================
    // Produtos & Histórico
    // ==========================================
    products = {
        list: async (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            return await this.request(`/products${qs ? `?${qs}` : ''}`);
        },

        getCategories: async () => {
            return await this.request('/products/categories');
        },

        getTopSales: async (limit = 10, category = null) => {
            let endpoint = `/products/top-sales?limit=${limit}`;
            if (category) endpoint += `&category=${encodeURIComponent(category)}`;
            return await this.request(endpoint);
        },

        getById: async (id) => {
            return await this.request(`/products/${id}`);
        },

        getHistory: async (id, days = 30) => {
            return await this.request(`/products/${id}/history?days=${days}`);
        }
    };

    // ==========================================
    // Previsão de Demanda & IA (XGBoost)
    // ==========================================
    forecast = {
        predict: async (productId, horizonDays = 7) => {
            return await this.request('/forecast/predict', {
                method: 'POST',
                body: JSON.stringify({ product_id: parseInt(productId), horizon_days: parseInt(horizonDays) })
            });
        },

        summary: async (horizonDays = 7) => {
            return await this.request(`/forecast/summary?horizon_days=${horizonDays}`);
        },

        ranking: async (horizonDays = 30) => {
            return await this.request(`/forecast/ranking?horizon_days=${horizonDays}`);
        }
    };

    // ==========================================
    // Tendências
    // ==========================================
    trends = {
        search: async (keyword = '') => {
            return await this.request(`/trends/search?keyword=${encodeURIComponent(keyword)}`);
        }
    };
}

window.apiService = new ApiService();
