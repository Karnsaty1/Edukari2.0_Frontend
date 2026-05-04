import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import VerifiedIcon from '@mui/icons-material/Verified';
import LanguageIcon from '@mui/icons-material/Language';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageHero from '../components/PageHero';
import { getBooks } from '../modules/books';

const Resources = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getBooks({ page: 1, pageSize: 6 });
        if (!active) return;
        setFeaturedBooks(response.items || []);
      } catch {
        if (!active) return;
        setFeaturedBooks([]);
        setError('Resource cards will appear once the books backend is available.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const resourceBlocks = [
    {
      title: 'Trusted Book Platforms',
      text: 'Use the official site link on each book to reach verified sellers and publishers.',
      icon: <VerifiedIcon className="text-indigo-600" fontSize="large" />,
    },
    {
      title: 'Reference Collections',
      text: 'Group reading material by subject, category, or skill level for quicker discovery.',
      icon: <LibraryBooksIcon className="text-blue-600" fontSize="large" />,
    },
    {
      title: 'External Learning Links',
      text: 'Every book card opens to a dedicated page where buyers and learners can continue safely.',
      icon: <LanguageIcon className="text-emerald-600" fontSize="large" />,
    },
    {
      title: 'Student Resource Checklists',
      text: 'Keep a short list of what to read first, what to buy, and what to explore next.',
      icon: <ChecklistIcon className="text-amber-600" fontSize="large" />,
    },
  ];

  const categoryHighlights = useMemo(() => {
    return [...new Set(featuredBooks.map((book) => book.category).filter(Boolean))].slice(0, 4);
  }, [featuredBooks]);

  return (
    <div className="min-h-screen bg-blue-50">
      <PageHero
        kicker="Resources"
        title="Books and reading resources tied to the same live catalog"
        description="Use the books API to surface trusted reading material, then point users straight to the official site or the book detail page."
        primaryAction={{ label: 'Open Library', to: '/library' }}
        secondaryAction={{ label: 'Browse Courses', to: '/courses' }}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {resourceBlocks.map((item) => (
            <article key={item.title} className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 shadow-sm">
                {item.icon}
              </div>
              <h2 className="text-2xl font-semibold text-blue-900">{item.title}</h2>
              <p className="mt-3 text-blue-700">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">Featured Reading</h2>
            <Link to="/library" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View Library <ArrowForwardIcon fontSize="small" />
            </Link>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-blue-100 bg-white p-8 text-blue-700 shadow-sm">Loading featured books...</div>
          ) : error ? (
            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 text-blue-900 shadow-sm">{error}</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid md:grid-cols-2 gap-6">
                {featuredBooks.map((book) => {
                  const bookKey = book.id || book._id || book.slug;
                  return (
                    <article key={bookKey} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-blue-950">{book.title}</h3>
                          <p className="mt-2 text-sm text-blue-700">{book.author}</p>
                        </div>
                        <LibraryBooksIcon className="text-amber-500" />
                      </div>
                      <p className="mt-4 text-sm text-blue-700">{book.description}</p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          to={`/library/${bookKey}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
                        >
                          View Book
                          <ArrowForwardIcon style={{ fontSize: 16 }} />
                        </Link>
                        {book.officialSite ? (
                          <a
                            href={book.officialSite}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                          >
                            Official Site
                            <ArrowForwardIcon style={{ fontSize: 16 }} />
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-blue-900">Popular Categories</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {categoryHighlights.map((category) => (
                    <Link
                      key={category}
                      to={`/library?category=${encodeURIComponent(category)}`}
                      className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
                <p className="mt-6 text-blue-700">
                  These are pulled from the same books collection, so the resource hub stays consistent with the library.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Resources;
