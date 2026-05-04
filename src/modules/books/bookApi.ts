import { post } from '../http';
import { buildPaginationParams, normalizePaginated } from '../../lib/pagination';

export const getBooks = async ({ page = 1, pageSize = 8, category, level, author, q, search } = {}) => {
  const body = {
    ...buildPaginationParams({ page, pageSize }),
    ...(category ? { category } : {}),
    ...(level ? { level } : {}),
    ...(author ? { author } : {}),
    ...(q ? { q } : {}),
    ...(search ? { q: search } : {}),
  };

  const data = await post('/books', body);
  return normalizePaginated(data);
};

export const getBook = async (bookId) => {
  return post('/books/detail', { bookId: String(bookId) });
};

export const getBookBySlug = async (slug) => {
  return post('/books/slug', { slug: String(slug) });
};

export const getBooksByCategory = async (category, options = {}) => {
  return getBooks({ ...options, category });
};

export const getBooksByAuthor = async (author, options = {}) => {
  return getBooks({ ...options, author });
};
