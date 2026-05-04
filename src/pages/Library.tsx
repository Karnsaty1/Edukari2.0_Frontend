import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageHero from '../components/PageHero';
import { getBooks } from '../modules/books';

const Library = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const pageSize = 8;
  const category = searchParams.get('category') || '';
  const level = searchParams.get('level') || '';
  const author = searchParams.get('author') || '';
  const q = searchParams.get('q') || '';
  const [books, setBooks] = useState([]);
  const [meta, setMeta] = useState({ page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadBooks = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getBooks({ page, pageSize, category, level, author, q });
        if (!active) return;
        setBooks(response.items || []);
        setMeta(response.meta || { page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
      } catch {
        if (!active) return;
        setBooks([]);
        setMeta({ page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
        setError('Books are not available yet. The library is ready for the backend contract.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBooks();
    return () => {
      active = false;
    };
  }, [page, pageSize, category, level, author, q]);

  const summaries = useMemo(() => {
    const uniqueCategories = [...new Set(books.map((book) => book.category).filter(Boolean))];
    return uniqueCategories.slice(0, 3);
  }, [books]);

  const goToPage = (nextPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(nextPage));
    setSearchParams(nextParams);
  };

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen bg-blue-50 text-blue-900">
      <PageHero
        kicker={
          <span className="inline-flex items-center gap-2">
            <MenuBookIcon fontSize="small" />
            Library
          </span>
        }
        title="Books, references, and direct purchase links"
        description="Browse the live books collection, filter by author or category, and open the official site for each item."
        primaryAction={{ label: 'Browse Books', href: '#books' }}
        secondaryAction={{ label: 'Browse Courses', to: '/courses' }}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          <button
            type="button"
            onClick={() => updateFilter('category', '')}
            className={`rounded-3xl border p-6 text-left shadow-sm transition-colors ${!category ? 'border-blue-200 bg-white' : 'border-blue-100 bg-blue-50'}`}
          >
            <div className="text-sm font-semibold text-blue-700">All Categories</div>
            <p className="mt-2 text-sm text-blue-700">Show every available book in the catalog.</p>
          </button>
          {summaries.map((summary) => (
            <button
              key={summary}
              type="button"
              onClick={() => updateFilter('category', summary)}
              className={`rounded-3xl border p-6 text-left shadow-sm transition-colors ${category === summary ? 'border-blue-300 bg-white' : 'border-blue-100 bg-white'}`}
            >
              <div className="text-sm font-semibold text-blue-900">{summary}</div>
              <p className="mt-2 text-sm text-blue-700">Use this as a quick filter for the collection.</p>
            </button>
          ))}
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={q}
            onChange={(event) => updateFilter('q', event.target.value)}
            placeholder="Search books"
            className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-900 outline-none focus:border-blue-300"
          />
          <input
            value={category}
            onChange={(event) => updateFilter('category', event.target.value)}
            placeholder="Filter by category"
            className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-900 outline-none focus:border-blue-300"
          />
          <input
            value={level}
            onChange={(event) => updateFilter('level', event.target.value)}
            placeholder="Filter by level"
            className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-900 outline-none focus:border-blue-300"
          />
          <input
            value={author}
            onChange={(event) => updateFilter('author', event.target.value)}
            placeholder="Filter by author"
            className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-900 outline-none focus:border-blue-300"
          />
        </div>

        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm text-blue-700">Loading books...</div>
        ) : error ? (
          <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 text-blue-900 shadow-sm">{error}</div>
        ) : books.length ? (
          <>
            <div id="books" className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {books.map((book) => {
                const bookKey = book.id || book._id || book.slug;
                return (
                  <article key={bookKey} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-blue-950">{book.title}</h2>
                        <p className="mt-2 text-blue-700">{book.author}</p>
                      </div>
                      <AutoStoriesIcon className="text-amber-500" style={{ fontSize: 36 }} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {book.category ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">{book.category}</span> : null}
                      {book.level ? <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-blue-900">{book.level}</span> : null}
                    </div>
                    <p className="mt-5 text-sm text-blue-700">{book.description}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        to={`/library/${bookKey}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                      >
                        View Book
                        <ArrowForwardIcon style={{ fontSize: 16 }} />
                      </Link>
                      {book.officialSite ? (
                        <a
                          href={book.officialSite}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
                        >
                          Official Site
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="text-sm text-blue-700">
                Page {meta.page || page} of {meta.totalPages || 1} | {meta.total || 0} books
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
        ) : (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 text-blue-700 shadow-sm">No books are available yet.</div>
        )}
      </section>
    </div>
  );
};

export default Library;
