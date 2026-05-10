import axios from 'axios';
import type { JobSearchParams, JobSearchResponse } from '../../types/job';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

const jobsClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export const searchJobs = async (params: JobSearchParams = {}): Promise<JobSearchResponse> => {
  const res = await jobsClient.post('/jobs/search', params);
  return res.data;
};
