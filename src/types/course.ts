/**
 * @typedef {Object} QuizQuestion
 * @property {string=} id
 * @property {string} prompt
 * @property {string[]} options
 * @property {number} correctOptionIndex
 * @property {string=} explanation
 * @property {"easy"|"medium"|"hard"} difficulty
 */

/**
 * @typedef {Object} QuizDto
 * @property {number} passScorePercent
 * @property {QuizQuestion[]} questions
 */

/**
 * @typedef {Object} CourseDto
 * @property {string} title
 * @property {string} slug
 * @property {string} description
 * @property {string} officialSite
 * @property {string=} category
 * @property {string=} level
 * @property {QuizDto} quiz
 */

/**
 * @typedef {Object} CourseSummaryDto
 * @property {string=} id
 * @property {string=} courseId
 * @property {string=} slug
 * @property {string} title
 * @property {string} description
 * @property {string} officialSite
 * @property {string=} category
 * @property {string=} level
 */

/**
 * @typedef {Object} CourseProgressUpdateDto
 * @property {string} userId
 * @property {string} courseId
 * @property {number} quizScorePercent
 * @property {number} progressPercent
 * @property {number=} attempts
 */

