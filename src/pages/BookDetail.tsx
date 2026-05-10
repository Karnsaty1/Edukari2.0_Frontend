import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PageHero from '../components/PageHero';
import { getBook, getBookBySlug } from '../modules/books';

const BookDetail = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getBook(bookId).catch(() => getBookBySlug(bookId));
        if (!active) return;
        setBook(data);
      } catch {
        if (!active) return;
        setError('Unable to load this book right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [bookId]);

  return (
    <div className="min-h-screen bg-blue-50">
      <PageHero
        kicker="Book Detail"
        title={book?.title || 'Loading book...'}
        description={book?.description || 'We are loading the book details.'}
        primaryAction={{ label: 'Back to Library', to: '/library' }}
        secondaryAction={{ label: 'Browse Courses', to: '/courses' }}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm text-blue-700">Loading book details...</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">{error}</div>
        ) : book ? (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <article className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {book.category ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">{book.category}</span> : null}
                {book.level ? <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-blue-900">{book.level}</span> : null}
              </div>
              <div className="mt-4 flex items-start gap-4">
                <AutoStoriesIcon className="text-amber-500" style={{ fontSize: 44 }} />
                <div>
                  <h2 className="text-3xl font-bold text-blue-950">{book.title}</h2>
                  <p className="mt-2 text-blue-700">By {book.author}</p>
                </div>
              </div>
              <p className="mt-6 text-blue-700 leading-7">{book.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {book.officialSite ? (
                  <a
                    href={book.officialSite}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                  >
                    Official Site
                    <ArrowForwardIcon style={{ fontSize: 16 }} />
                  </a>
                ) : null}
                <Link
                  to="/library"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
                >
                  Back to Library
                </Link>
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-blue-900">Book Info</div>
                <div className="mt-4 space-y-2 text-sm text-blue-700">
                  {book.author && <p><span className="font-semibold text-blue-900">Author:</span> {book.author}</p>}
                  {book.category && <p><span className="font-semibold text-blue-900">Category:</span> {book.category}</p>}
                  {book.level && <p><span className="font-semibold text-blue-900">Level:</span> {book.level}</p>}
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default BookDetail;
