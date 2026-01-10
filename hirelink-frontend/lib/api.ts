// lib/api.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// File upload helper for applications
export async function apiUploadFile(
  path: string,
  formData: FormData,
  accessToken: string
) {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  let baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash

  const res = await fetch(`${baseUrl}${path}`, {
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
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string | null
): Promise<any> {
  let baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  baseUrl = baseUrl.replace(/\/$/, '');

  const url = `${baseUrl}${endpoint}`;
  console.log(
    'API Request URL:',
    url,
    options.method,
    accessToken ? 'with token' : 'no token'
  );

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('API Response Status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData: any;
      const responseText = await response.text();
      console.log('Raw error response:', responseText);

      try {
        errorData = responseText ? JSON.parse(responseText) : {};
      } catch {
        errorData = {
          detail: `HTTP ${response.status}: ${response.statusText}`,
          raw: responseText,
        };
      }

      if (process.env.NODE_ENV !== 'production') {
        console.error('API Error:', errorData);
      }

      const error: any = new Error(
        errorData.detail || `HTTP ${response.status}`
      );
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const responseText = await response.text();
    console.log('Raw success response:', responseText);

    try {
      const data = responseText ? JSON.parse(responseText) : {};
      console.log('API Success:', data);
      return data;
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}

// === AI EMAIL API ===
export const aiEmailApi = {
  generateEmail: (
    token: string,
    payload: {
      candidate_name: string;
      candidate_email: string;
      job_title: string;
      company_name: string;
      application_date: string;
      interview_date?: string | null;
      email_type: 'refus' | 'relance' | 'invitation';
      language?: string;
      tone?: string;
    }
  ) => {
    return apiFetch(
      '/ai/email/generate/',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    );
  },

  sendEmail: (
    token: string,
    payload: { to: string; subject: string; body: string }
  ) => {
    return apiFetch(
      '/ai/email/send/',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    );
  },
};

// Recruiter-specific API helpers
export const recruiterApi = {
  getRecruiterStats: (token: string) => {
    return apiFetch('/jobs/recruiter/stats/', {}, token);
  },

  getRecruiterJobs: (token: string) => {
    return apiFetch('/jobs/recruiter/jobs/', {}, token);
  },

  createJob: (token: string, data: any) => {
    return apiFetch(
      '/jobs/create/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    );
  },

  updateJob: (token: string, jobId: number, data: any) => {
    return apiFetch(
      `/jobs/${jobId}/update/`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      token
    );
  },

  deleteJob: (token: string, jobId: number) => {
    return apiFetch(
      `/jobs/${jobId}/delete/`,
      {
        method: 'DELETE',
      },
      token
    );
  },

  getJob: (token: string, jobId: number) => {
    return apiFetch(`/jobs/${jobId}/`, {}, token);
  },

  // Legacy
  getJobApplicationsLegacy: (token: string, jobId: number) => {
    return apiFetch(`/jobs/recruiter/applications/${jobId}/`, {}, token);
  },

  getAllApplicationsLegacy: (token: string) => {
    return apiFetch('/jobs/recruiter/applications/', {}, token);
  },

  // New recruiter application endpoints
  getAllApplications: (token: string, status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/recruiter/applications/${query}`, {}, token);
  },

  getJobApplications: (token: string, jobId: number, status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(
      `/recruiter/applications/job/${jobId}/${query}`,
      {},
      token
    );
  },

  getApplication: (token: string, id: number) => {
    return apiFetch(`/recruiter/applications/${id}/`, {}, token);
  },

  updateApplicationStatus: (
    token: string,
    id: number,
    status: string,
    reason?: string
  ) => {
    return apiFetch(
      `/recruiter/applications/${id}/status/`,
      {
        method: 'POST',
        body: JSON.stringify({ status, reason }),
      },
      token
    );
  },
};

// Application-specific API helpers
export const applicationApi = {
  getJobs: (token: string, filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.job_type) params.append('job_type', filters.job_type);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/jobs/${query}`, {}, token);
  },

  updateProfile: (token: string, data: any) => {
    return apiFetch(
      '/users/profile/',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      token
    );
  },

  uploadResume: (token: string, formData: FormData) => {
    return apiUploadFile('/users/upload-resume/', formData, token);
  },

  getJob: (id: number, token: string) => {
    return apiFetch(`/jobs/${id}/`, {}, token);
  },

  getApplications: (token: string, filters?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/applications/${query}`, {}, token);
  },

  getApplication: (id: number, token: string) => {
    return apiFetch(`/applications/${id}/`, {}, token);
  },

  createApplication: (
    token: string,
    data: { job: number; cover_letter: string; resume: File }
  ) => {
    const formData = new FormData();
    formData.append('job', data.job.toString());
    formData.append('cover_letter', data.cover_letter);
    formData.append('resume', data.resume);

    return apiUploadFile('/applications/', formData, token);
  },

  deleteApplication: (id: number, token: string) => {
    return apiFetch(`/applications/${id}/`, { method: 'DELETE' }, token);
  },

  getAIRecommendations: (token: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/jobs/ai/recommendations/${query}`, {}, token);
  },

  getInterviews: (token: string) => {
    return apiFetch('/interviews/', {}, token);
  },

  getNotifications: (token: string) => {
    return apiFetch('/notifications/', {}, token);
  },

  markAllNotificationsRead: (token: string) => {
    return apiFetch(
      '/notifications/mark_all_read/',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      token
    );
  },

  getApplicationStats: (token: string) => {
    return apiFetch('/stats/applications/', {}, token);
  },

  saveJob: (token: string, jobId: number) => {
    return apiFetch(`/jobs/${jobId}/save/`, { method: 'POST' }, token);
  },

  applyJob: (token: string, jobId: number, data: any) => {
    return apiFetch(
      `/jobs/${jobId}/apply/`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    );
  },

  getSavedJobs: (token: string) => {
    return apiFetch('/candidate/saved-jobs/', {}, token);
  },

  getCandidateApplications: (token: string) => {
    return apiFetch('/candidate/applications/', {}, token);
  },
};

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }
}

export const APPLICATION_STATUS = {
  applied: {
    label: 'Applied',
    color:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  under_review: {
    label: 'Under Review',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  shortlisted: {
    label: 'Shortlisted',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    color:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  },
  interviewed: {
    label: 'Interviewed',
    color:
      'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  },
  rejected: {
    label: 'Rejected',
    color:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  accepted: {
    label: 'Accepted',
    color:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  offer_sent: {
    label: 'Offer Sent',
    color:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  hired: {
    label: 'Hired',
    color:
      'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
  },
};

export const JOB_TYPES = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  remote: 'Remote',
};
