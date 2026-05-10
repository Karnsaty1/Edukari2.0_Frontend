import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PageHero from '../components/PageHero';
import { attemptMyProgress, getCourse, getCourseQuiz } from '../modules/courses';
import { useAuth } from '../modules/auth';

const CourseQuiz = () => {
  const { courseId } = useParams();
  const { isAuthed } = useAuth();
  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
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
    return () => { active = false; };
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
    if (!isAuthed) return;
    setSubmitting(true);
    setError('');
    try {
      const progressPercent = scorePercent >= passScorePercent
        ? 100
        : Math.max(0, Math.floor(scorePercent / 2));
      await attemptMyProgress(courseId, { quizScorePercent: scorePercent, progressPercent, attempts: 1 });
      setSubmittedScore(scorePercent);
    } catch {
      setError('Could not save your progress. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmittedScore(null);
    setError('');
  };

  const passed = submittedScore !== null && submittedScore >= passScorePercent;
  const correctCount = questions.filter((q, i) => answers[i] === q.correctOptionIndex).length;

  // ── Result screen ───────────────────────────────────────────────────────────────────
  if (submittedScore !== null) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-blue-100 shadow-lg w-full max-w-md p-8 text-center">
          {/* Icon */}
          <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed
              ? <EmojiEventsIcon style={{ fontSize: 44 }} className="text-green-500" />
              : <CancelIcon style={{ fontSize: 44 }} className="text-red-400" />}
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-bold ${ passed ? 'text-green-700' : 'text-red-600' }`}>
            {passed ? 'Congratulations!' : 'Not quite there yet'}
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            {passed
              ? 'You passed the quiz and your progress has been saved.'
              : `You need ${passScorePercent}% to pass. Keep practicing!`}
          </p>

          {/* Score ring */}
          <div className={`mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-full border-8 ${
            passed ? 'border-green-400' : 'border-red-300'
          }`}>
            <div>
              <div className={`text-3xl font-bold ${ passed ? 'text-green-600' : 'text-red-500' }`}>
                {submittedScore}%
              </div>
              <div className="text-xs text-gray-400">Your score</div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-gray-50 p-3">
              <div className="text-lg font-bold text-gray-800">{correctCount}</div>
              <div className="text-xs text-gray-400">Correct</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-3">
              <div className="text-lg font-bold text-gray-800">{questions.length - correctCount}</div>
              <div className="text-xs text-gray-400">Wrong</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-3">
              <div className="text-lg font-bold text-gray-800">{questions.length}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3">
            {!passed && (
              <button
                onClick={handleRetake}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                <ReplayIcon fontSize="small" /> Retake Quiz
              </button>
            )}
            <Link
              to={`/courses/${courseId}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-blue-100 bg-white hover:bg-blue-50 text-blue-900 font-semibold transition-colors"
            >
              {passed ? <CheckCircleIcon fontSize="small" className="text-green-500" /> : null}
              {passed ? 'Back to Course' : 'Back to Course'}
            </Link>
            <Link
              to="/courses"
              className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
            >
              Browse more courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-blue-50">
      <PageHero
        kicker="Course Quiz"
        title={course?.title || 'Quiz'}
        description={`Answer all questions and score ${passScorePercent}% or higher to pass.`}
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

              {error && <p className="text-sm text-red-600">{error}</p>}

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

              {!isAuthed && <p className="text-sm text-blue-700">Please log in to save your progress.</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CourseQuiz;