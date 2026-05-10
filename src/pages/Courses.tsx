import SchoolIcon from '@mui/icons-material/School';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { getCourses } from '../modules/courses';

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const pageSize = 8;
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getCourses({ page, pageSize });
        if (!active) return;
        setItems(response.items || []);
        setMeta(response.meta || { page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
      } catch {
        if (!active) return;
        setItems([]);
        setMeta({ page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
        setError('No courses available right now. Please check back later.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [page, pageSize]);

  const goToPage = (nextPage) => {
    setSearchParams({ page: String(nextPage) });
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <PageHero
        kicker="Courses"
        title="Structured learning paths for every learner stage"
        description="Browse tracks, see what is next, and keep progress moving without leaving the dashboard experience."
        primaryAction={{ label: 'Explore Tracks', href: '#tracks' }}
        secondaryAction={{ label: 'Visit Library', to: '/library' }}
      />

      <section id="tracks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm text-blue-700">Loading courses...</div>
        ) : error ? (
          <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 text-blue-900">{error}</div>
        ) : (
          <>
            {items.length ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                {items.map((track) => {
                  const courseKey = track.courseId || track.id || track._id || track.slug;
                  return (
                    <article key={courseKey} className="overflow-hidden rounded-3xl bg-white border border-blue-100 shadow-sm">
                      <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-6 text-white">
                        <SchoolIcon style={{ fontSize: 42 }} />
                        <h2 className="mt-8 text-2xl font-bold">{track.title}</h2>
                        <p className="mt-2 text-sm text-white/90">{track.level || 'Course'}</p>
                      </div>
                      <div className="p-6">
                        <p className="text-sm text-blue-700">{track.description}</p>
                        <div className="mt-4 space-y-3 text-sm text-blue-700">
                          <div className="flex items-center gap-3">
                            <PlayCircleOutlineIcon fontSize="small" />
                            <span>{track.category || 'General'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <SignalCellularAltIcon fontSize="small" />
                            <span>{track.level || 'All levels'}</span>
                          </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <Link
                            to={`/courses/${courseKey}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                          >
                            View Course
                            <ArrowForwardIcon style={{ fontSize: 16 }} />
                          </Link>
                          <Link
                            to={`/courses/${courseKey}/quiz`}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
                          >
                            Start Quiz
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm text-blue-700">
                No courses are available yet.
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="text-sm text-blue-700">
                Page {meta.page || page} of {meta.totalPages || 1} | {meta.total || 0} courses
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!meta.hasPrev}
                  onClick={() => goToPage(Math.max(1, (meta.page || page) - 1))}
                  className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-900 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={!meta.hasNext}
                  onClick={() => goToPage((meta.page || page) + 1)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Courses;
