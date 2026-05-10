export type JobType = 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance' | 'training';
export type JobLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'manager' | 'executive' | 'internship' | 'unknown';
export type JobLocationType = 'remote' | 'hybrid' | 'onsite';

export interface Job {
  id: string;
  title: string;
  designation: string;
  level: JobLevel;
  type: JobType;
  locationType: JobLocationType;
  location: { city: string; region: string; country: string; display: string };
  company: { name: string; logoUrl: string };
  salary: { min: number; max: number; currency: string; display: string };
  description: string;
  tags: string[];
  applyUrl: string;
  postedAt: string;
  source: 'adzuna';
}

export interface JobSearchParams {
  q?: string;
  location?: string;
  country?: string;
  type?: JobType;
  level?: JobLevel;
  locationType?: JobLocationType;
  salaryMin?: number;
  salaryMax?: number;
  company?: string;
  tags?: string[];
  postedWithinDays?: number;
  page?: number;
  pageSize?: number;
}

export interface JobSearchResponse {
  items: Job[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    country: string;
    location: string;
    type: string;
    level: string;
    locationType: string;
  };
}
