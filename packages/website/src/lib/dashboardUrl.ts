const DEFAULT_DASHBOARD_URL = 'http://localhost:5174';

export const dashboardUrl =
  (import.meta.env.VITE_DASHBOARD_URL as string | undefined)?.replace(/\/$/, '') ||
  DEFAULT_DASHBOARD_URL;

export const dashboardLoginUrl = `${dashboardUrl}/login`;
export const dashboardSignupUrl = `${dashboardUrl}/signup`;
export const dashboardStudentHubUrl = `${dashboardUrl}/student-hub`;
