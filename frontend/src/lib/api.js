const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function parseError(response, fallback) {
  try {
    const error = await response.json();
    return error.detail || fallback;
  } catch {
    return fallback;
  }
}

export const api = {
  async translate(text) {
    const response = await fetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Có lỗi xảy ra'));
    }

    return response.json();
  },

  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Login failed'));
    }

    return response.json();
  },

  async verifyLogin(challengeId, code) {
    const response = await fetch(`${API_BASE_URL}/api/admin/login/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challenge_id: challengeId,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Mã xác thực chưa đúng'));
    }

    return response.json();
  },

  async getSettings(token) {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to fetch settings'));
    }

    return response.json();
  },

  async updateSetting(token, key, value) {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to update setting'));
    }

    return response.json();
  },

  async changePassword(token, currentPassword, newPassword) {
    const response = await fetch(`${API_BASE_URL}/api/admin/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Đổi mật khẩu chưa được'));
    }

    return response.json();
  },

  async getLogs(token, page = 1, limit = 50, filters = {}) {
    const params = new URLSearchParams({ page, limit });
    if (filters.success !== undefined && filters.success !== null) {
      params.append('success', filters.success);
    }
    if (filters.search) params.append('search', filters.search);
    if (filters.model) params.append('model', filters.model);

    const response = await fetch(
      `${API_BASE_URL}/api/admin/logs?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to fetch logs'));
    }

    return response.json();
  },

  async getLogsStats(token) {
    const response = await fetch(`${API_BASE_URL}/api/admin/logs/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to fetch stats'));
    }

    return response.json();
  },

  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  },
};
