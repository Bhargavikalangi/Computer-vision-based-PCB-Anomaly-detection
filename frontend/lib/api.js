import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export async function analyzeImage(files, settings, onProgress) {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Stage: upload
    onProgress({ stage: 'upload', percent: (i / files.length) * 20 });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', settings.model);
    formData.append('confidence', settings.confidence);
    formData.append('annotate', settings.annotate);

    onProgress({ stage: 'preprocess', percent: 20 + (i / files.length) * 20 });
    onProgress({ stage: 'inference', percent: 40 + (i / files.length) * 40 });

    const res = await api.post('/api/v1/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        const pct = 40 + ((e.loaded / e.total) * 40 * (1 / files.length) * (i + 1));
        onProgress({ stage: 'inference', percent: pct });
      },
    });

    onProgress({ stage: 'postprocess', percent: 80 + (i / files.length) * 15 });
    results.push(res.data);
  }

  onProgress({ stage: 'save', percent: 95 });
  await new Promise(r => setTimeout(r, 500));
  onProgress({ stage: 'save', percent: 100 });

  return results;
}

export async function getResults(params = {}) {
  const res = await api.get('/api/v1/results', { params });
  return res.data;
}

export async function getResultById(id) {
  const res = await api.get(`/api/v1/results/${id}`);
  return res.data;
}

export async function getDashboardStats() {
  const res = await api.get('/api/v1/stats/dashboard');
  return res.data;
}

export async function getSystemStatus() {
  const res = await api.get('/api/v1/status');
  return res.data;
}

export async function generateReport(type, params = {}) {
  const res = await api.post('/api/v1/reports/generate', { type, ...params }, { responseType: 'blob' });
  return res.data;
}
