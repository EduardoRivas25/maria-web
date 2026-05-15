// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Google Classroom API Service
// Direct REST API calls using access token from GIS
// ═══════════════════════════════════════════════════════════════

import { googleFetch } from '../google-auth';

const BASE = 'https://classroom.googleapis.com/v1';

export const classroomApi = {
  /**
   * Get enrolled courses.
   */
  async getCourses() {
    const data = await googleFetch(`${BASE}/courses?studentId=me&courseStates=ACTIVE&pageSize=20`);
    return data.courses || [];
  },

  /**
   * Get coursework (assignments) for a course.
   * @param {string} courseId
   */
  async getCoursework(courseId) {
    const data = await googleFetch(`${BASE}/courses/${courseId}/courseWork?orderBy=dueDate%20desc&pageSize=50`);
    return data.courseWork || [];
  },

  /**
   * Get announcements for a course.
   */
  async getAnnouncements(courseId) {
    const data = await googleFetch(`${BASE}/courses/${courseId}/announcements?orderBy=updateTime%20desc&pageSize=20`);
    return data.announcements || [];
  },

  /**
   * Get student submissions for a coursework item.
   */
  async getSubmissions(courseId, courseworkId) {
    const data = await googleFetch(`${BASE}/courses/${courseId}/courseWork/${courseworkId}/studentSubmissions?userId=me`);
    return data.studentSubmissions || [];
  },

  /**
   * Get all coursework across all courses (for dashboard).
   */
  async getAllCoursework() {
    const courses = await this.getCourses();
    const allWork = [];

    for (const course of courses) {
      try {
        const coursework = await this.getCoursework(course.id);
        coursework.forEach(cw => {
          allWork.push({ ...cw, courseName: course.name, courseId: course.id });
        });
      } catch {
        // Skip courses with no access
      }
    }

    return allWork.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day) : new Date(9999, 0);
      const dateB = b.dueDate ? new Date(b.dueDate.year, b.dueDate.month - 1, b.dueDate.day) : new Date(9999, 0);
      return dateA - dateB;
    });
  },
};

export default classroomApi;
