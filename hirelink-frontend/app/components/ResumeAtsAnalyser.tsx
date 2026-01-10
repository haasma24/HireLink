'use client';

import { useState, useEffect } from 'react';
import { apiFetch, getAuthToken, apiUploadFile } from '@/lib/api';

interface ATSAnalysisResult {
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

interface ResumeATSAnalyzerProps {
  resumeUrl: string | null;
  onClose: () => void;
  isOpen: boolean;
}

export default function ResumeATSAnalyzer({ resumeUrl, onClose, isOpen }: ResumeATSAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ATSAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'suggestions'>('summary');

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const analyzeResume = async () => {
    if (!resumeUrl) {
      setError('No resume URL found');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const accessToken = getAuthToken();
      if (!accessToken) throw new Error('Not authenticated');

      // First download the resume file
      const response = await fetch(resumeUrl);
      if (!response.ok) throw new Error('Failed to fetch resume');
      
      const blob = await response.blob();
      const filename = resumeUrl.split('/').pop() || 'resume.pdf';
      
      // Create FormData
      const formData = new FormData();
      formData.append('resume_file', blob, filename);

      // Send to ATS analyzer
      const result = await apiUploadFile('/ats-analyze/', formData, accessToken);
      
      if (result.success) {
        setAnalysis(result);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume');
      console.error('Resume analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFromText = async (resumeText: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const accessToken = getAuthToken();
      if (!accessToken) throw new Error('Not authenticated');

      const result = await apiFetch('ats-analyze/', {
        method: 'POST',
        body: JSON.stringify({ text: resumeText }),
      }, accessToken);

      if (result.success) {
        setAnalysis(result);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume');
      console.error('Resume analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalysis = () => {
    const resumeText = prompt('Paste your resume text here for analysis:');
    if (resumeText && resumeText.length >= 50) {
      analyzeFromText(resumeText);
    } else if (resumeText) {
      setError('Resume text must be at least 50 characters');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  📊 Resume ATS Analyzer
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Check ATS compatibility and get improvement suggestions
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
            {!analysis && !loading && !error && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  Analyze Your Resume
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  Get your resume scored for ATS compatibility and receive personalized improvement suggestions.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {resumeUrl && (
                    <button
                      onClick={analyzeResume}
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      🚀 Analyze Uploaded Resume
                    </button>
                  )}
                  
                  <button
                    onClick={handleTextAnalysis}
                    disabled={loading}
                    className="px-8 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    📝 Paste Resume Text
                  </button>
                </div>
                
                {resumeUrl && (
                  <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-slate-900 dark:text-white">
                          Resume Found
                        </span>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {resumeUrl.split('/').pop()}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 mb-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">1-5</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Quality Score</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Get a score from 1-5 with detailed feedback
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 mb-3 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">ATS Check</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Verify if your resume passes Applicant Tracking Systems
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 mb-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">💡</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Improvements</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Get actionable suggestions to improve your resume
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  Analyzing Your Resume...
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  This may take a few seconds
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  Analysis Failed
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setError(null);
                      if (resumeUrl) analyzeResume();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleTextAnalysis}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
                  >
                    Use Text Instead
                  </button>
                </div>
              </div>
            )}

            {/* Results Display */}
            {analysis && analysis.analysis && !loading && (
              <div>
                {/* File Info */}
                {analysis.file_metadata && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {analysis.file_metadata.filename}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {analysis.file_metadata.word_count} words • {analysis.file_metadata.file_size_kb.toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                )}

                {/* Score Card */}
                <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Score Circle */}
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex flex-col items-center justify-center text-white">
                        <span className="text-4xl font-bold">
                          {analysis.analysis.summary.quality_score}
                        </span>
                        <span className="text-lg opacity-90">/5.0</span>
                      </div>
                      <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-sm font-bold ${
                        analysis.analysis.summary.grade_color === 'green' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : analysis.analysis.summary.grade_color === 'red'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {analysis.analysis.summary.grade}
                      </div>
                    </div>

                    {/* Score Details */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {analysis.analysis.summary.overall_feedback}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        {analysis.analysis.summary.score_explanation}
                      </p>
                      
                      <div className="flex flex-wrap gap-4">
                        <div className={`px-4 py-2 rounded-lg flex items-center ${
                          analysis.analysis.summary.ats_compatible
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {analysis.analysis.summary.ats_compatible ? (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              ATS Compatible
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Not ATS Compatible
                            </>
                          )}
                        </div>
                        <div className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg">
                          Confidence: {(analysis.analysis.summary.ats_confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6 border-b border-slate-200 dark:border-slate-800">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'summary'
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                      }`}
                    >
                      📊 Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'details'
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                      }`}
                    >
                      🔍 Detailed Analysis
                    </button>
                    <button
                      onClick={() => setActiveTab('suggestions')}
                      className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'suggestions'
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                      }`}
                    >
                      💡 Improvement Suggestions
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                  {/* Summary Tab */}
                  {activeTab === 'summary' && (
                    <div className="space-y-6">
                      {/* Statistics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                            {analysis.analysis.detailed_analysis.statistics.word_count}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Words</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                            {analysis.analysis.detailed_analysis.statistics.section_count}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Sections</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                            {analysis.analysis.detailed_analysis.statistics.tech_keywords}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Tech Keywords</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                            {analysis.analysis.detailed_analysis.statistics.bullet_points}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Bullet Points</div>
                        </div>
                      </div>

                      {/* Contact Status */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Contact Information</h4>
                        <div className="flex flex-wrap gap-4">
                          <div className={`flex items-center ${analysis.analysis.detailed_analysis.statistics.has_email ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {analysis.analysis.detailed_analysis.statistics.has_email ? 'Email ✓' : 'Email ✗'}
                          </div>
                          <div className={`flex items-center ${analysis.analysis.detailed_analysis.statistics.has_phone ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {analysis.analysis.detailed_analysis.statistics.has_phone ? 'Phone ✓' : 'Phone ✗'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed Analysis Tab */}
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      {/* Strengths */}
                      {analysis.analysis.detailed_analysis.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <span className="text-green-600 dark:text-green-400 mr-2">✅</span>
                            Strengths ({analysis.analysis.detailed_analysis.strengths.length})
                          </h4>
                          <div className="space-y-2">
                            {analysis.analysis.detailed_analysis.strengths.map((strength, index) => (
                              <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-start">
                                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-slate-700 dark:text-slate-300">{strength}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {analysis.analysis.detailed_analysis.weaknesses.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <span className="text-red-600 dark:text-red-400 mr-2">❌</span>
                            Areas for Improvement ({analysis.analysis.detailed_analysis.weaknesses.length})
                          </h4>
                          <div className="space-y-2">
                            {analysis.analysis.detailed_analysis.weaknesses.map((weakness, index) => (
                              <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-start">
                                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <span className="text-slate-700 dark:text-slate-300">{weakness}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestions Tab */}
                  {activeTab === 'suggestions' && (
                    <div className="space-y-6">
                      {/* Priority Suggestions */}
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Priority Improvements</h4>
                        <div className="space-y-4">
                          {analysis.analysis.improvement_suggestions
                            .filter(s => s.priority === 'high')
                            .map((suggestion, index) => (
                              <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-bold rounded mr-3">
                                      HIGH PRIORITY
                                    </span>
                                    <h5 className="font-semibold text-slate-900 dark:text-white">{suggestion.title}</h5>
                                  </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mb-3">{suggestion.description}</p>
                                <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Action:</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{suggestion.action}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* All Suggestions */}
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">All Suggestions</h4>
                        <div className="space-y-3">
                          {analysis.analysis.improvement_suggestions
                            .filter(s => s.priority !== 'high')
                            .map((suggestion, index) => (
                              <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className={`px-2 py-1 text-xs font-bold rounded mr-3 ${
                                      suggestion.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    }`}>
                                      {suggestion.priority.toUpperCase()}
                                    </span>
                                    <h5 className="font-medium text-slate-900 dark:text-white">{suggestion.title}</h5>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{suggestion.description}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-500">💡 {suggestion.action}</p>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Quick Wins */}
                      {analysis.analysis.quick_wins.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <span className="text-blue-600 dark:text-blue-400 mr-2">⚡</span>
                            Quick Wins
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {analysis.analysis.quick_wins.map((win, index) => (
                              <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{win}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {analysis 
                  ? `Analysis completed at ${new Date().toLocaleTimeString()}`
                  : 'Powered by AI Resume Analyzer'}
              </div>
              <div className="flex gap-3">
                {analysis && (
                  <button
                    onClick={() => {
                      setAnalysis(null);
                      setError(null);
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
                  >
                    New Analysis
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  {analysis ? 'Close' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}