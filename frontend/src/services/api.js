const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Utility to make API requests with consistent error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  /**
   * Fetch historical lifestyle metrics for a user
   * GET /api/lifestyle/:userId
   */
  getLifestyleData: (userId) => request(`/lifestyle/${userId}`),

  /**
   * Analyze lifestyle patterns and correlations
   * POST /api/analyze
   */
  analyzePatterns: (userId) =>
    request('/analyze', {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId) }),
    }),

  /**
   * Run a What-If simulation based on historical patterns
   * POST /api/simulate
   */
  runSimulation: (userId, field, delta) =>
    request('/simulate', {
      method: 'POST',
      body: JSON.stringify({
        userId: Number(userId),
        field,
        delta: Number(delta),
      }),
    }),

  /**
   * Start a new 7-day personal experiment
   * POST /api/experiments
   */
  startExperiment: (userId, goalField, targetChange) =>
    request('/experiments', {
      method: 'POST',
      body: JSON.stringify({
        userId: Number(userId),
        goalField,
        targetChange: Number(targetChange),
      }),
    }),

  /**
   * Get all active and completed experiments for a user
   * GET /api/experiments/:userId
   */
  getExperiments: (userId) => request(`/experiments/${userId}`),

  /**
   * Compare metrics before vs during a 7-day experiment
   * GET /api/compare/:experimentId
   */
  compareExperiment: (experimentId) => request(`/compare/${experimentId}`),
};
