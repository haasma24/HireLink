// app/dashboard/profile/page.tsx - FIXED WITH PROPER API ENDPOINTS
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getAuthToken, apiUploadFile } from '@/src/lib/api'; // Changed to apiUploadFile
import ResumeATSAnalyzer from '@/app/components/ResumeAtsAnalyser';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'candidate' | 'recruiter' | string;
  full_name?: string;
  headline?: string;
  location?: string;
  phone?: string;
  website?: string;
  bio?: string;
  profile_picture?: string;
  cover_photo?: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
  languages: LanguageItem[];
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
};

type ExperienceItem = {
  id?: number;
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  currently_working: boolean;
  description?: string;
};

type EducationItem = {
  id?: number;
  degree: string;
  institution: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  currently_studying: boolean;
  grade?: string;
  description?: string;
};

type CertificationItem = {
  id?: number;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
};

type ProjectItem = {
  id?: number;
  title: string;
  description: string;
  technologies: string[];
  project_url?: string;
  start_date: string;
  end_date?: string;
};

type LanguageItem = {
  id?: number;
  language: string;
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showATSAnalyzer, setShowATSAnalyzer] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const access = getAuthToken();
    if (!access) {
      router.replace('/login');
      return;
    }
    loadProfile();
  }, [router]);

  // FIXED: Use correct endpoint from old working code
  const loadProfile = async () => {
    try {
      // FIX: Use '/users/profile/' instead of '/api/users/profile/'
      const data = await apiFetch('/users/profile/', { method: 'GET' }, getAuthToken()!);
      
      console.log('Profile API response:', data);
      
      // Handle skills - convert string to array if needed
      let skillsArray: string[] = [];
      if (data.skills) {
        if (Array.isArray(data.skills)) {
          skillsArray = data.skills;
        } else if (typeof data.skills === 'string') {
          // Split by comma and clean up
          skillsArray = data.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        }
      }
      
      const enhancedData: UserProfile = {
        ...data,
        full_name: data.full_name || data.username,
        headline: data.headline || 'Looking for new opportunities',
        bio: data.bio || '',
        skills: skillsArray,
        experience: data.experience || [],
        education: data.education || [],
        certifications: data.certifications || [],
        projects: data.projects || [],
        languages: data.languages || [],
        resume_url: data.resume_url || null,
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        twitter_url: data.twitter_url || '',
        phone: data.phone || '',
        website: data.website || '',
        location: data.location || '',
      };
      
      console.log('Enhanced profile data:', enhancedData);
      
      setUser(enhancedData);
      setFormData(enhancedData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // FIXED: Use direct apiFetch instead of applicationApi.updateProfile
  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const access = getAuthToken();
      if (!access) throw new Error('Not authenticated');

      // Prepare data to send - ensure no null values
      const dataToSend: any = {
        full_name: formData.full_name || '',
        headline: formData.headline || '',
        location: formData.location || '',
        phone: formData.phone || '',
        website: formData.website || '',
        bio: formData.bio || '',
        github_url: formData.github_url || '',
        linkedin_url: formData.linkedin_url || '',
        twitter_url: formData.twitter_url || '',
        // Send skills as comma-separated string
        skills: Array.isArray(formData.skills) ? formData.skills.join(', ') : (formData.skills || '')
      };

      console.log('Saving profile data:', dataToSend);
      
      // FIX: Use direct apiFetch with PATCH method
      await apiFetch('/users/profile/', {
        method: 'PATCH',
        body: JSON.stringify(dataToSend),
      }, access);

      // Refresh profile data
      await loadProfile();
      
      setEditingSection(null);
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(`Failed to save profile: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Use direct apiFetch for skills
  const handleSaveSkills = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const access = getAuthToken();
      if (!access) throw new Error('Not authenticated');

      const dataToSend = {
        // Send skills as comma-separated string
        skills: Array.isArray(formData.skills) ? formData.skills.join(', ') : (formData.skills || '')
      };

      console.log('Saving skills:', dataToSend);
      
      // FIX: Use direct apiFetch
      await apiFetch('/users/profile/', {
        method: 'PATCH',
        body: JSON.stringify(dataToSend),
      }, access);
      
      // Refresh profile data
      await loadProfile();
      
      setEditingSection(null);
      setNewSkill('');
      alert('Skills updated successfully!');
    } catch (error: any) {
      console.error('Error saving skills:', error);
      alert(`Failed to save skills: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Use apiUploadFile instead of applicationApi.uploadResume
  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    
    setUploading(true);
    try {
      const access = getAuthToken();
      if (!access) throw new Error('Not authenticated');

      const formDataToSend = new FormData();
      formDataToSend.append('resume', resumeFile);

      console.log('Uploading resume:', resumeFile.name);
      
      // FIX: Use apiUploadFile directly
      await apiUploadFile('/users/upload-resume/', formDataToSend, access);
      
      // Refresh the profile data after upload
      await loadProfile();
      
      setResumeFile(null);
      alert('Resume uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      alert(`Failed to upload resume: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAddSkill = () => {
    if (newSkill.trim() === '') return;
    
    const currentSkills = formData.skills || [];
    if (!currentSkills.includes(newSkill.trim())) {
      const updatedSkills = [...currentSkills, newSkill.trim()];
      handleInputChange('skills', updatedSkills);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (index: number) => {
    const currentSkills = [...(formData.skills || [])];
    currentSkills.splice(index, 1);
    handleInputChange('skills', currentSkills);
  };

  // Add experience edit handlers from old code if needed
  const handleArrayChange = (section: string, index: number, field: string, value: any) => {
    const currentArray = [...(formData[section as keyof UserProfile] as any[]) || []];
    currentArray[index] = { ...currentArray[index], [field]: value };
    setFormData(prev => ({ ...prev, [section]: currentArray }));
  };

  const addArrayItem = (section: string, template: any) => {
    const currentArray = [...(formData[section as keyof UserProfile] as any[]) || []];
    currentArray.push(template);
    setFormData(prev => ({ ...prev, [section]: currentArray }));
  };

  const removeArrayItem = (section: string, index: number) => {
    const currentArray = [...(formData[section as keyof UserProfile] as any[]) || []];
    currentArray.splice(index, 1);
    setFormData(prev => ({ ...prev, [section]: currentArray }));
  };

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Header Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-800 dark:to-blue-900 mb-8">
        <div className="h-48 md:h-64 relative">
          {user.cover_photo ? (
            <img 
              src={user.cover_photo} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-800 dark:to-blue-900"></div>
          )}
          <button className="absolute top-4 right-4 px-4 py-2 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm">
            Edit Cover Photo
          </button>
        </div>
        
        <div className="relative px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-24">
            <div className="relative mb-4 md:mb-0 md:mr-8">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                {user.profile_picture ? (
                  <img 
                    src={user.profile_picture} 
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                    <span className="text-4xl font-bold text-blue-600 dark:text-blue-300">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Add profile picture upload button from old code */}
              <button className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold mb-2">{user.full_name}</h1>
              <p className="text-xl mb-4">{user.headline}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {user.location || 'Location not specified'}
                </span>
                {user.email && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user.email}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              <button 
                onClick={() => {
                  setEditingSection('basic');
                  // Pre-fill formData with current user data
                  setFormData({
                    ...formData,
                    full_name: user.full_name,
                    headline: user.headline,
                    location: user.location,
                    phone: user.phone,
                    website: user.website,
                    bio: user.bio,
                    github_url: user.github_url,
                    linkedin_url: user.linkedin_url,
                    twitter_url: user.twitter_url,
                    skills: user.skills,
                  });
                }}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio Section */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">About</h2>
              <button 
                onClick={() => {
                  if (editingSection === 'bio') {
                    setEditingSection(null);
                  } else {
                    setEditingSection('bio');
                    setFormData(prev => ({ ...prev, bio: user.bio }));
                  }
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
              >
                {editingSection === 'bio' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {editingSection === 'bio' ? (
              <div>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white mb-4"
                  placeholder="Tell us about yourself..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleSave();
                      setEditingSection(null);
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {user.bio || 'No bio added yet. Click edit to add one.'}
              </p>
            )}
          </section>

          {/* Skills Section - IMPROVED */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Skills</h2>
              <button 
                onClick={() => {
                  if (editingSection === 'skills') {
                    setEditingSection(null);
                    setNewSkill('');
                  } else {
                    setEditingSection('skills');
                    setFormData(prev => ({ ...prev, skills: user.skills }));
                  }
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
              >
                {editingSection === 'skills' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {editingSection === 'skills' ? (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Add a skill
                  </label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                      placeholder="Enter a skill"
                    />
                    <button
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Your Skills ({formData.skills?.length || 0})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills && formData.skills.length > 0 ? (
                        formData.skills.map((skill, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium">
                              {skill}
                            </span>
                            <button
                              onClick={() => handleRemoveSkill(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic">No skills added yet</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingSection(null);
                      setNewSkill('');
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSkills}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.skills.length > 0 ? (
                  user.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">No skills added yet.</p>
                )}
              </div>
            )}
          </section>

          {/* Experience Section - Keeping new UI but adding old functionality */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Experience</h2>
              <button 
                onClick={() => {
                  if (!editingSection) {
                    addArrayItem('experience', {
                      title: '',
                      company: '',
                      location: '',
                      start_date: '',
                      end_date: '',
                      currently_working: false,
                      description: ''
                    });
                  }
                  setEditingSection(editingSection === 'experience' ? null : 'experience')
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
              >
                {editingSection === 'experience' ? 'Cancel' : '+ Add'}
              </button>
            </div>
            
            {editingSection === 'experience' ? (
              <div className="space-y-4">
                {(formData.experience || []).map((exp, index) => (
                  <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => handleArrayChange('experience', index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                          placeholder="Software Engineer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                          placeholder="Tech Company Inc."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={exp.start_date}
                            onChange={(e) => handleArrayChange('experience', index, 'start_date', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                          <input
                            type="date"
                            value={exp.end_date || ''}
                            onChange={(e) => handleArrayChange('experience', index, 'end_date', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                            disabled={exp.currently_working}
                          />
                          <label className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              checked={exp.currently_working}
                              onChange={(e) => handleArrayChange('experience', index, 'currently_working', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Currently working here</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea
                          rows={3}
                          value={exp.description || ''}
                          onChange={(e) => handleArrayChange('experience', index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                          placeholder="Describe your responsibilities and achievements..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => removeArrayItem('experience', index)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save experience section
                      handleSave();
                      setEditingSection(null);
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Experience'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {user.experience.length > 0 ? (
                  user.experience.map((exp, index) => (
                    <div key={index} className="pb-4 border-b dark:border-slate-700 last:border-0 last:pb-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{exp.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300">{exp.company} • {exp.location}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {exp.start_date} - {exp.currently_working ? 'Present' : exp.end_date}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-slate-600 dark:text-slate-300">{exp.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">No experience added yet.</p>
                )}
              </div>
            )}
          </section>

          {/* Education Section - Similar to Experience */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Education</h2>
              <button 
                onClick={() => {
                  if (!editingSection) {
                    addArrayItem('education', {
                      degree: '',
                      institution: '',
                      field_of_study: '',
                      start_date: '',
                      end_date: '',
                      currently_studying: false,
                      grade: ''
                    });
                  }
                  setEditingSection(editingSection === 'education' ? null : 'education')
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
              >
                {editingSection === 'education' ? 'Cancel' : '+ Add'}
              </button>
            </div>
            
            {/* Similar structure as Experience section */}
            {editingSection === 'education' ? (
              <div className="space-y-4">
                {(formData.education || []).map((edu, index) => (
                  <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                          placeholder="Bachelor of Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleArrayChange('education', index, 'institution', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                          placeholder="University Name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={edu.start_date}
                            onChange={(e) => handleArrayChange('education', index, 'start_date', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                          <input
                            type="date"
                            value={edu.end_date || ''}
                            onChange={(e) => handleArrayChange('education', index, 'end_date', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                            disabled={edu.currently_studying}
                          />
                          <label className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              checked={edu.currently_studying}
                              onChange={(e) => handleArrayChange('education', index, 'currently_studying', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Currently studying here</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => removeArrayItem('education', index)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save education section
                      handleSave();
                      setEditingSection(null);
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Education'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {user.education.length > 0 ? (
                  user.education.map((edu, index) => (
                    <div key={index} className="pb-4 border-b dark:border-slate-700 last:border-0 last:pb-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{edu.degree}</h3>
                      <p className="text-slate-600 dark:text-slate-300">{edu.institution}</p>
                      {edu.field_of_study && (
                        <p className="text-slate-600 dark:text-slate-300">{edu.field_of_study}</p>
                      )}
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {edu.start_date} - {edu.currently_studying ? 'Present' : edu.end_date}
                      </p>
                      {edu.grade && (
                        <p className="mt-1 text-slate-600 dark:text-slate-300">Grade: {edu.grade}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">No education added yet.</p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Resume Section */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resume</h2>
              {user.resume_url && (
                <button 
                  onClick={() => setShowATSAnalyzer(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ATS Check
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {user.resume_url ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-green-800 dark:text-green-300">Resume Uploaded</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a 
                      href={user.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      View Resume
                    </a>
                    <button
                      onClick={() => setShowATSAnalyzer(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium"
                    >
                      🚀 ATS Analysis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-medium text-amber-800 dark:text-amber-300">No Resume Uploaded</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                    Upload your resume to check ATS compatibility
                  </p>
                </div>
              )}
              
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                
                {resumeFile ? (
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 mb-3">
                      Selected: <span className="font-medium">{resumeFile.name}</span>
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setResumeFile(null)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResumeUpload}
                        disabled={uploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Upload your resume (PDF, DOC, DOCX, TXT)
                    </p>
                    <button
                      onClick={triggerFileInput}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
          
          <ResumeATSAnalyzer
            resumeUrl={user?.resume_url || null}
            isOpen={showATSAnalyzer}
            onClose={() => setShowATSAnalyzer(false)}
          />

          {/* Basic Info Edit Section */}
          {editingSection === 'basic' && (
            <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Basic Information</h2>
                <button 
                  onClick={() => setEditingSection(null)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                >
                  Cancel
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Headline</label>
                  <input
                    type="text"
                    value={formData.headline || ''}
                    onChange={(e) => handleInputChange('headline', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.linkedin_url || ''}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.github_url || ''}
                    onChange={(e) => handleInputChange('github_url', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Twitter URL</label>
                  <input
                    type="url"
                    value={formData.twitter_url || ''}
                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleSave();
                      setEditingSection(null);
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Social Links Section from old code */}
          {!editingSection && (
            <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Social Links</h2>
              </div>
              
              <div className="space-y-3">
                {user.linkedin_url && (
                  <a 
                    href={user.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                
                {user.github_url && (
                  <a 
                    href={user.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-slate-700 dark:text-slate-300 hover:underline"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
                
                {!user.linkedin_url && !user.github_url && (
                  <p className="text-slate-500 dark:text-slate-400 italic">No social links added yet.</p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}