import { del, get, getCached, post, put } from '../http';
import { buildPaginationParams, normalizePaginated } from '../../lib/pagination';

const courseIdOf = (courseId) => encodeURIComponent(String(courseId));

export const getCourses = async ({ page = 1, pageSize = 12, ...filters } = {}) => {
  const params = {
    ...buildPaginationParams({ page, pageSize }),
    ...filters,
  };

  const data = await getCached('/courses', { params }, { ttlMs: 30_000 });
  return normalizePaginated(data);
};

export const getCourse = async (courseId) => {
  return getCached(`/courses/${courseIdOf(courseId)}`, undefined, { ttlMs: 30_000 });
};

export const getCourseBySlug = async (slug) => {
  return getCached(`/courses/slug/${encodeURIComponent(String(slug))}`, undefined, { ttlMs: 30_000 });
};

export const getCourseQuiz = async (courseId) => {
  return get(`/courses/${courseIdOf(courseId)}/quiz`);
};

export const createCourse = async (course) => {
  return post('/courses', course);
};

export const updateCourse = async (courseId, course) => {
  return put(`/courses/${courseIdOf(courseId)}`, course);
};

export const deleteCourse = async (courseId) => {
  return del(`/courses/${courseIdOf(courseId)}`);
};

export const getMyProgress = async () => {
  return get('/progress/me');
};

export const getMyProgressForCourse = async (courseId) => {
  return get(`/progress/me/${courseIdOf(courseId)}`);
};

export const getMyCourseProgress = async (courseId) => {
  return get(`/progress/me/course/${courseIdOf(courseId)}`);
};

export const attemptMyProgress = async (courseId, payload) => {
  return post(`/progress/me/${courseIdOf(courseId)}/attempt`, payload);
};

export const updateMyProgress = async (courseId, payload) => {
  return put(`/progress/me/${courseIdOf(courseId)}`, payload);
};

