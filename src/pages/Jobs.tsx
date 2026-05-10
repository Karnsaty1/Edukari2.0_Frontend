import { useEffect, useState, useCallback } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { searchJobs } from '../modules/jobs';
import type { Job, JobType, JobLevel, JobLocationType, JobSearchParams } from '../types/job';

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'training', label: 'Training' },
];

const JOB_LEVELS: { value: JobLevel; label: string }[] = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
  { value: 'executive', label: 'Executive' },
  { value: 'internship', label: 'Internship' },
];

const LOCATION_TYPES: { value: JobLocationType; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

const POSTED_WITHIN = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
];

const levelColors: Record<string, string> = {
  entry: 'bg-green-100 text-green-700',
  mid: 'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
  lead: 'bg-orange-100 text-orange-700',
  manager: 'bg-red-100 text-red-700',
  executive: 'bg-gray-100 text-gray-700',
  internship: 'bg-yellow-100 text-yellow-700',
  unknown: 'bg-gray-100 text-gray-500',
};

const locationTypeColors: Record<string, string> = {
  remote: 'bg-teal-100 text-teal-700',
  hybrid: 'bg-indigo-100 text-indigo-700',
  onsite: 'bg-gray-100 text-gray-600',
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const JobCard = ({ job, onClick, selected }: { job: Job; onClick: () => void; selected: boolean }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md shimmer-card animate-fade-in-up min-h-[192px] flex flex-col justify-between ${
      selected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200'
    }`}
  >
    <div className="flex items-start gap-3">
      {job.company.logoUrl ? (
        <img src={job.company.logoUrl} alt={job.company.name} className="h-10 w-10 rounded-lg object-contain border border-gray-100 flex-shrink-0" />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <BusinessIcon style={{ fontSize: 20 }} className="text-blue-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{job.designation || job.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{job.company.name}</p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(job.postedAt)}</span>
    </div>

    <div className="flex flex-wrap gap-1.5 mt-3">
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${levelColors[job.level] ?? 'bg-gray-100 text-gray-500'}`}>
        {job.level}
      </span>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${locationTypeColors[job.locationType] ?? 'bg-gray-100 text-gray-500'}`}>
        {job.locationType}
      </span>
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
        {job.type}
      </span>
    </div>

    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
      <span className="flex items-center gap-1">
        <LocationOnIcon style={{ fontSize: 13 }} />
        {job.location.display || job.location.city || 'N/A'}
      </span>
      {job.salary?.display && (
        <span className="flex items-center gap-1">
          <AttachMoneyIcon style={{ fontSize: 13 }} />
          {job.salary.display}
        </span>
      )}
    </div>

    {job.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {job.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
        {job.tags.length > 4 && (
          <span className="text-[10px] text-gray-400">+{job.tags.length - 4}</span>
        )}
      </div>
    )}
  </div>
);

const JobDetail = ({ job }: { job: Job }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 h-full overflow-y-auto">
    <div className="flex items-start gap-4 mb-5">
      {job.company.logoUrl ? (
        <img src={job.company.logoUrl} alt={job.company.name} className="h-14 w-14 rounded-xl object-contain border border-gray-100" />
      ) : (
        <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center">
          <BusinessIcon style={{ fontSize: 28 }} className="text-blue-400" />
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-900">{job.designation || job.title}</h2>
        <p className="text-gray-500 mt-0.5">{job.company.name}</p>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
          <LocationOnIcon style={{ fontSize: 15 }} />
          {job.location.display}
          <span>·</span>
          <AccessTimeIcon style={{ fontSize: 15 }} />
          {timeAgo(job.postedAt)}
        </div>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-5">
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${levelColors[job.level]}`}>{job.level}</span>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${locationTypeColors[job.locationType]}`}>{job.locationType}</span>
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">{job.type}</span>
    </div>

    {job.salary?.display && (
      <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 mb-5">
        <p className="text-xs text-green-600 font-medium">Salary</p>
        <p className="text-green-800 font-semibold">{job.salary.display}</p>
      </div>
    )}

    {job.tags.length > 0 && (
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((tag) => (
            <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>
    )}

    <div className="mb-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
    </div>

    <a
      href={job.applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
    >
      Apply Now <OpenInNewIcon style={{ fontSize: 16 }} />
    </a>
  </div>
);

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, hasNext: false, hasPrev: false, total: 0 });

  const [params, setParams] = useState<JobSearchParams>({
    q: '',
    location: '',
    country: 'in',
    page: 1,
    pageSize: 10,
  });

  const load = useCallback(async (p: JobSearchParams) => {
    setLoading(true);
    try {
      const res = await searchJobs({
        ...p,
        q: p.q || undefined,
        location: p.location || undefined,
        country: p.country || 'in',
      });
      setJobs(res.items);
      setMeta(res.meta);
      setSelectedJob(res.items[0] ?? null);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(params);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { ...params, page: 1 };
    setParams(next);
    load(next);
  };

  const setFilter = (key: keyof JobSearchParams, value: any) => {
    setParams((p) => ({ ...p, [key]: value, page: 1 }));
  };

  const applyFilters = () => {
    const next = { ...params, page: 1 };
    load(next);
    setShowFilters(false);
  };

  const goToPage = (page: number) => {
    const next = { ...params, page };
    setParams(next);
    load(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Portal</h1>
        <p className="text-gray-500 text-sm mt-1">Find jobs, internships and opportunities</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fontSize="small" />
          <input
            value={params.q ?? ''}
            onChange={(e) => setParams((p) => ({ ...p, q: e.target.value }))}
            placeholder="Job title, skill, company..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
          />
        </div>
        <div className="relative">
          <LocationOnIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fontSize="small" />
          <input
            value={params.location ?? ''}
            onChange={(e) => setParams((p) => ({ ...p, location: e.target.value }))}
            placeholder="Location"
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white w-40"
          />
        </div>
        <select
          value={params.country ?? 'in'}
          onChange={(e) => setParams((p) => ({ ...p, country: e.target.value }))}
          className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 outline-none focus:border-blue-400 bg-white text-gray-700"
        >
          <option value="in">🇮🇳 India</option>
          <option value="us">🇺🇸 USA</option>
          <option value="gb">🇬🇧 UK</option>
          <option value="au">🇦🇺 Australia</option>
        </select>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            showFilters ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FilterListIcon fontSize="small" /> Filters
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Job Type</label>
            <select
              value={params.type ?? ''}
              onChange={(e) => setFilter('type', e.target.value || undefined)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="">Any</option>
              {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Level</label>
            <select
              value={params.level ?? ''}
              onChange={(e) => setFilter('level', e.target.value || undefined)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="">Any</option>
              {JOB_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Work Mode</label>
            <select
              value={params.locationType ?? ''}
              onChange={(e) => setFilter('locationType', e.target.value || undefined)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="">Any</option>
              {LOCATION_TYPES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Posted Within</label>
            <select
              value={params.postedWithinDays ?? ''}
              onChange={(e) => setFilter('postedWithinDays', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="">Any time</option>
              {POSTED_WITHIN.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-3">
          {meta.total.toLocaleString()} jobs found
          {params.q && <> for <span className="font-medium text-gray-600">"{params.q}"</span></>}
        </p>
      )}

      {/* Main layout */}
      <div className="flex gap-4 h-[calc(100vh-280px)]">
        {/* Job list */}
        <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <div className="h-5 w-16 bg-gray-200 rounded-full" />
                  <div className="h-5 w-16 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <WorkIcon style={{ fontSize: 40 }} className="mb-2 text-gray-300" />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm mt-1">Try different keywords or filters</p>
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  selected={selectedJob?.id === job.id}
                  onClick={() => setSelectedJob(job)}
                />
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2 pb-1">
                <button
                  onClick={() => goToPage(meta.page - 1)}
                  disabled={!meta.hasPrev}
                  className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-400">Page {meta.page} of {meta.totalPages}</span>
                <button
                  onClick={() => goToPage(meta.page + 1)}
                  disabled={!meta.hasNext}
                  className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Job detail */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          {selectedJob ? (
            <JobDetail job={selectedJob} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200">
              <div className="text-center text-gray-400">
                <WorkIcon style={{ fontSize: 48 }} className="mb-3 text-gray-300" />
                <p className="font-medium">Select a job to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
