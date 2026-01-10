import { apiFetch, apiUploadFile, getAuthToken } from './api';

export interface ATSAnalysisRequest {
  text?: string;
  resume_file?: File;
}

export interface ATSAnalysisResult {
  success: boolean;
  analysis?: {
    summary: {
      quality_score: number;
      grade: string;
      grade_color: string;
      ats_compatible: boolean;
      ats_confidence: number;
      overall_feedback: string;
      score_explanation: string;
    };
    detailed_analysis: {
      strengths: string[];
      weaknesses: string[];
      ats_issues: string[];
      missing_sections: string[];
      statistics: {
        word_count: number;
        section_count: number;
        bullet_points: number;
        tech_keywords: number;
        action_verbs: number;
        has_email: boolean;
        has_phone: boolean;
      };
    };
    improvement_suggestions: Array<{
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      action: string;
    }>;
    quick_wins: string[];
    recommended_actions: string[];
  };
  file_metadata?: {
    filename: string;
    file_type: string;
    word_count: number;
    char_count: number;
    file_size_kb: number;
  };
  error?: string;
}

export const resumeApi = {
  // Analyze resume text
  analyzeText: async (text: string): Promise<ATSAnalysisResult> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    return apiFetch('ats-analyze/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }, token);
  },

  // Analyze resume file
  analyzeFile: async (file: File): Promise<ATSAnalysisResult> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('resume_file', file);

    return apiUploadFile('/ats-analyze/', formData, token);
  },

  // Analyze resume from URL
  analyzeFromUrl: async (resumeUrl: string): Promise<ATSAnalysisResult> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    // First download the file
    const response = await fetch(resumeUrl);
    if (!response.ok) throw new Error('Failed to fetch resume');
    
    const blob = await response.blob();
    const filename = resumeUrl.split('/').pop() || 'resume.pdf';
    const file = new File([blob], filename, { type: blob.type });

    return resumeApi.analyzeFile(file);
  },

  // Get resume analysis history (if you implement it)
  getAnalysisHistory: async (): Promise<any[]> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    return apiFetch('ats-analysis/history/', {}, token);
  },

  // Save analysis results (if you implement it)
  saveAnalysis: async (analysisId: string, notes: string): Promise<any> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    return apiFetch(`ats-analysis/${analysisId}/save/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }, token);
  },
};