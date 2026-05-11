import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getCourses, getMyProgress } from '../modules/courses';
import { useAuth } from '../modules/auth';

const Dashboard = () => {
  const { isAuthed } = useAuth();
  const [courses, setCourses] = useState([]);
  const [progressItems, setProgressItems] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [courseLoadError, setCourseLoadError] = useState('');
  const [progressLoadError, setProgressLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      setLoadingCourses(true);
      setCourseLoadError('');
      try {
        const response = await getCourses({ page: 1, pageSize: 4 });
        if (!active) return;
        setCourses(response.items || []);
      } catch {
        if (!active) return;
        setCourses([]);
        setCourseLoadError('No courses available right now. Please check back later.');
      } finally {
        if (active) setLoadingCourses(false);
      }
    };

    loadCourses();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setProgressItems([]);
      setLoadingProgress(false);
      setProgressLoadError('');
      return;
    }

    let active = true;

    const loadProgress = async () => {
      setLoadingProgress(true);
      setProgressLoadError('');
      try {
        const response = await getMyProgress();
        if (!active) return;
        setProgressItems(response.items || []);
      } catch {
        if (!active) return;
        setProgressItems([]);
        setProgressLoadError('Your progress will appear here once you start a course.');
      } finally {
        if (active) setLoadingProgress(false);
      }
    };

    loadProgress();
    return () => {
      active = false;
    };
  }, [isAuthed]);

  const cardTones = ['bg-sky-500', 'bg-blue-500', 'bg-cyan-500', 'bg-indigo-500'];
  const progressByCourse = progressItems.reduce((acc, item) => {
    const key = item.courseId || item.course?.courseId || item.course?.id || item.course?._id || item.courseSlug || item.slug;
    if (key) {
      acc[String(key)] = item;
    }
    return acc;
  }, {});

  const resolveCourseProgress = (course) => {
    const courseKey = course.courseId || course.id || course._id || course.slug;
    const progress = progressByCourse[String(courseKey)] || progressByCourse[String(course.slug)] || null;
    const value = progress?.progressPercent ?? progress?.progress ?? 0;
    return Math.max(0, Math.min(100, Number(value) || 0));
  };

  const highlights = [
    {
      title: 'Expert Instructors',
      description: 'Learn from industry professionals with years of experience.',
      icon: <SchoolIcon className="text-blue-600" fontSize="large" />,
      tone: 'bg-blue-100',
    },
    {
      title: 'Track Progress',
      description: 'Monitor your learning journey with clear milestones and weekly momentum.',
      icon: <TrendingUpIcon className="text-emerald-600" fontSize="large" />,
      tone: 'bg-emerald-100',
    },
    {
      title: 'Earn Certificates',
      description: 'Turn learning streaks into credentials you can showcase with confidence.',
      icon: <EmojiEventsIcon className="text-amber-600" fontSize="large" />,
      tone: 'bg-amber-100',
    },
  ];

  return (
    <div className="min-h-screen bg-blue-50">
      <section className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white py-[3.6rem] sm:py-[4.5rem] lg:py-[5.4rem] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Orbs */}
          <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full bg-blue-400/20 blur-3xl animate-orb-1 pointer-events-none" />
          <div className="absolute bottom-[-40px] left-[-40px] w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl animate-orb-2 pointer-events-none" />
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Learn Without Limits
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 mb-8">
                Access structured courses, discover new resources, and move through your education journey from one clean learning dashboard.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/courses"
                  className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Explore Courses
                </Link>
                <Link
                  to="/library"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  Visit Library
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/10 rounded-xl p-6">
                    <SchoolIcon className="text-yellow-300 mb-2" fontSize="large" />
                    <div className="text-3xl font-bold">{courses.length}+</div>
                    <div className="text-blue-100">Courses</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-6">
                    <TrendingUpIcon className="text-yellow-300 mb-2" fontSize="large" />
                    <div className="text-3xl font-bold">{progressItems.length}</div>
                    <div className="text-blue-100">In Progress</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-6">
                    <EmojiEventsIcon className="text-yellow-300 mb-2" fontSize="large" />
                    <div className="text-3xl font-bold">{courses.length > 0 ? '100%' : '0%'}</div>
                    <div className="text-blue-100">Access</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-6">
                    <div className="text-3xl font-bold mb-2">★</div>
                    <div className="text-3xl font-bold">Free</div>
                    <div className="text-blue-100">For All</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lg:hidden bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{courses.length}+</div>
            <div className="text-sm text-blue-700">Courses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{progressItems.length}</div>
            <div className="text-sm text-blue-700">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{courses.length > 0 ? '100%' : '0%'}</div>
            <div className="text-sm text-blue-700">Access</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">Free</div>
            <div className="text-sm text-blue-700">For All</div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">Continue Learning</h2>
          <Link to="/courses" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All <ArrowForwardIcon fontSize="small" />
          </Link>
        </div>

        {loadingCourses || (isAuthed && loadingProgress) ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 text-blue-700 shadow-sm">Loading learning cards...</div>
        ) : courseLoadError ? (
          <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 text-blue-900 shadow-sm">{courseLoadError}</div>
        ) : progressLoadError && isAuthed && !progressItems.length ? (
          <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 text-blue-900 shadow-sm">{progressLoadError}</div>
        ) : courses.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => {
              const courseKey = course.courseId || course.id || course._id || course.slug;
              const tone = cardTones[index % cardTones.length];
              const progressPercent = resolveCourseProgress(course);

              return (
                  <Link
                    key={courseKey}
                    to={`/courses/${courseKey}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-blue-100 shimmer-card animate-fade-in-up"
                  >
                  <div className={`${tone} h-32 flex items-center justify-center`}>
                    <SchoolIcon style={{ fontSize: 60 }} className="text-white" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-4 text-blue-900 group-hover:text-blue-700 transition-colors">
                        {course.title}
                      </h3>
                      <div className="mb-2 flex items-center justify-between text-sm text-blue-700">
                        <span>Progress</span>
                        <span className="font-semibold text-blue-900">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
        ) : (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 text-blue-700 shadow-sm">
            No course cards are available yet.
          </div>
        )}
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-blue-900">Why Edukari Works</h2>
            <p className="text-blue-700 text-lg">
              The dashboard is designed as the platform entry point, helping students move quickly between courses, books, and learning resources.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-3xl border border-blue-100 bg-blue-50 p-8">
                <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${item.tone}`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">{item.title}</h3>
                <p className="text-blue-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
