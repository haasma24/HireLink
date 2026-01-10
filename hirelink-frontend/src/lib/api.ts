// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/';

// File upload helper for applications
export async function apiUploadFile(
  path: string,
  formData: FormData,
  accessToken: string
) {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${accessToken}`,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text;
  }
}

// Application-specific API helpers
export const applicationApi = {
  // Jobs
  getJobs: (token: string, filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.job_type) params.append('job_type', filters.job_type);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/jobs/${query}`, {}, token);
  },

  getJob: (id: number, token: string) => {
    return apiFetch(`/jobs/${id}/`, {}, token);
  },

  // Applications
  getApplications: (token: string, filters?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/applications/${query}`, {}, token);
  },

  getApplication: (id: number, token: string) => {
    return apiFetch(`/applications/${id}/`, {}, token);
  },

  createApplication: (token: string, data: { job: number; cover_letter: string; resume: File }) => {
    const formData = new FormData();
    formData.append('job', data.job.toString());
    formData.append('cover_letter', data.cover_letter);
    formData.append('resume', data.resume);
    
    return apiUploadFile('/applications/', formData, token);
  },

  deleteApplication: (id: number, token: string) => {
    return apiFetch(`/applications/${id}/`, { method: 'DELETE' }, token);
  },

  // Interviews
  getInterviews: (token: string) => {
    return apiFetch('/interviews/', {}, token);
  },

  // Notifications
  getNotifications: (token: string) => {
    return apiFetch('/notifications/', {}, token);
  },

  markAllNotificationsRead: (token: string) => {
    return apiFetch('/notifications/mark_all_read/', { method: 'POST' }, token);
  },

  // Stats
  getApplicationStats: (token: string) => {
    return apiFetch('/stats/applications/', {}, token);
  },
// Profile
  updateProfile: (token: string, data: any) => {
    return apiFetch('/users/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  },

  uploadResume: (token: string, formData: FormData) => {
    return apiUploadFile('/users/upload-resume/', formData, token);
  },
  
};

// Helper to get token
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

// Helper function to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Helper function to logout
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }
}

// STATUS CONSTANTS (for frontend usage)
export const APPLICATION_STATUS = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  shortlisted: { label: 'Shortlisted', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  interviewed: { label: 'Interviewed', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  offer_sent: { label: 'Offer Sent', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  hired: { label: 'Hired', color: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100' },
};

export const JOB_TYPES = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  remote: 'Remote',
};