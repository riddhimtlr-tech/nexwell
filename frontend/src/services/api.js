const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = localStorage.getItem('nexwell_token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export const api = {
  signup: (name, email, password) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    }),

  getLifestyleData: (userId) =>
    request(`/lifestyle/${userId}`),

  analyzePatterns: (_userId) =>
    request('/analyze', {
      method: 'POST',
    }),

  runSimulation: (_userId, field, delta) =>
    request('/simulate', {
      method: 'POST',
      body: JSON.stringify({
        field,
        delta: Number(delta),
      }),
    }),

  startExperiment: (
    _userId,
    goalField,
    targetChange
  ) =>
    request('/experiments', {
      method: 'POST',
      body: JSON.stringify({
        goalField,
        targetChange: Number(targetChange),
      }),
    }),

  getExperiments: (userId) =>
    request(`/experiments/${userId}`),

  compareExperiment: (experimentId) =>
    request(`/compare/${experimentId}`),
};
