import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { attemptMyProgress, getCourse, getCourseQuiz, updateMyProgress } from '../modules/courses';
import { useAuth } from '../modules/auth';

const CourseQuiz = () => {
  const { courseId } = useParams();
  const { profile, isAuthed } = useAuth();
  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [courseData, quizData] = await Promise.all([getCourse(courseId), getCourseQuiz(courseId)]);
        if (!active) return;
        setCourse(courseData);
        setQuiz(quizData);
      } catch {
        if (!active) return;
        setError('Unable to load the quiz right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId]);

  const questions = useMemo(() => quiz?.questions || [], [quiz?.questions]);
  const passScorePercent = quiz?.passScorePercent ?? 90;

  const scorePercent = useMemo(() => {
    if (!questions.length) return 0;
    const correct = questions.reduce((count, question, index) => {
      return count + (answers[index] === question.correctOptionIndex ? 1 : 0);
    }, 0);
    return Math.round((correct / questions.length) * 100);
  }, [answers, questions]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const userId = profile?.userId || profile?.id || '';
      if (!userId) {
        throw new Error('Missing user id');
      }

      const payload = {
        userId,
        courseId,
        quizScorePercent: scorePercent,
        progressPercent: scorePercent >= passScorePercent ? 100 : Math.max(0, Math.floor(scorePercent / 2)),
        attempts: 1,
      };

      await attemptMyProgress(courseId, payload);
      await updateMyProgress(courseId, payload);
      setSubmittedScore(scorePercent);
    } catch {
      setError('Could not save your progress yet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <PageHero
        kicker="Course Quiz"
        title={course?.title || 'Quiz'}
        description={`Pass rule: ${passScorePercent}% or higher.`}
        primaryAction={{ label: 'Back to Course', to: `/courses/${courseId}` }}
        secondaryAction={{ label: 'Back to Courses', to: '/courses' }}
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm text-blue-700">Loading quiz...</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">{error}</div>
        ) : (
          <div className="space-y-6">
            {submittedScore !== null ? (
              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <div className="text-2xl font-bold text-blue-950">Submitted</div>
                <p className="mt-2 text-blue-700">
                  You scored {submittedScore}%. {submittedScore >= passScorePercent ? 'Pass!' : 'Keep practicing and try again.'}
                </p>
              </div>
            ) : null}

            <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm space-y-6">
              {questions.map((question, index) => (
                <div key={question.id || index} className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <div className="font-semibold text-blue-950">
                    {index + 1}. {question.prompt}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
                        className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                          answers[index] === optionIndex
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-blue-100 bg-white text-blue-900 hover:bg-blue-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {question.explanation ? <p className="mt-3 text-sm text-blue-700">{question.explanation}</p> : null}
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!isAuthed || submitting || !questions.length}
                  onClick={handleSubmit}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
                <Link to={`/courses/${courseId}`} className="rounded-xl border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors">
                  Back to Course
                </Link>
              </div>

              {!isAuthed ? <p className="text-sm text-blue-700">Please login to save your progress.</p> : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CourseQuiz;
