import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageHero from '../components/PageHero';
import { getCourse, getMyCourseProgress } from '../modules/courses';
import { useAuth } from '../modules/auth';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const resourceLinks = [
    ...(Array.isArray(course?.resources)
      ? course.resources.map((resource, index) => ({
          label: resource.label || resource.title || `Resource ${index + 1}`,
          url: resource.url || resource.href || '',
        }))
      : []),
    ...(Array.isArray(course?.links)
      ? course.links.map((resource, index) => ({
          label: resource.label || resource.title || `Link ${index + 1}`,
          url: resource.url || resource.href || '',
        }))
      : []),
  ].filter((resource) => resource && resource.url);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [courseData, progressData] = await Promise.all([
          getCourse(courseId),
          isAuthed ? getMyCourseProgress(courseId).catch(() => null) : Promise.resolve(null),
        ]);

        if (!active) return;
        setCourse(courseData);
        setProgress(progressData);
      } catch {
        if (!active) return;
        setError('Unable to load this course right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId, isAuthed]);

  return (
    <div className="min-h-screen bg-blue-50">
      <PageHero
        kicker="Course Detail"
        title={course?.title || 'Loading course...'}
        description={course?.description || 'We are loading the course details.'}
        primaryAction={{ label: 'Start Quiz', to: `/courses/${courseId}/quiz` }}
        secondaryAction={{ label: 'Back to Courses', to: '/courses' }}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm text-blue-700">Loading course details...</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">{error}</div>
        ) : course ? (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <article className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {course.category ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">{course.category}</span> : null}
                {course.level ? <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-blue-900">{course.level}</span> : null}
              </div>
              <h2 className="mt-4 text-3xl font-bold text-blue-950">{course.title}</h2>
              <p className="mt-4 text-blue-700 leading-7">{course.description}</p>
              {progress ? (
                <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-4">
                  <div className="text-sm font-semibold text-blue-900">Your Progress</div>
                  <div className="mt-1 text-sm text-blue-700">
                    {progress.progressPercent ?? 0}% complete, quiz score {progress.quizScorePercent ?? 0}%
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.max(0, Math.min(100, progress.progressPercent ?? 0))}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/courses/${courseId}/quiz`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  Start Quiz
                  <ArrowForwardIcon style={{ fontSize: 16 }} />
                </button>
                <a
                  href={course.officialSite}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
                >
                  Official Site
                </a>
              </div>

              {resourceLinks.length ? (
                <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <div className="text-sm font-semibold text-blue-900">Resources</div>
                  <div className="mt-4 grid gap-3">
                    {resourceLinks.map((resource) => (
                      <a
                        key={`${resource.label}-${resource.url}`}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-blue-900 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-semibold">{resource.label}</div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-blue-900">Course Info</div>
                <div className="mt-4 space-y-2 text-sm text-blue-700">
                  {course.category && <p><span className="font-semibold text-blue-900">Category:</span> {course.category}</p>}
                  {course.level && <p><span className="font-semibold text-blue-900">Level:</span> {course.level}</p>}
                </div>
              </div>
              <Link
                to="/courses"
                className="block rounded-3xl border border-blue-100 bg-white p-6 shadow-sm text-blue-900 hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold">Browse more courses</div>
                <div className="mt-2 text-sm text-blue-700">Explore other courses in our catalog.</div>
              </Link>
            </aside>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default CourseDetail;
