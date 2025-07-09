import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, MapPin, Camera, Clock, FileText, Eye, Loader2, AlertCircle, CheckCircle, Sparkles, TrendingUp, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumeAnalysis {
  id: string;
  user_id: string;
  compatibility_score: number;
  keyword_matches: string[];
  experience_gaps: string[];
  tailored_resume?: string;
  cover_letter?: string;
  analysis_details?: any;
  created_at: string;
}

const Account: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resumeHistory, setResumeHistory] = useState<ResumeAnalysis[]>([]);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    address: '',
    profile_picture_url: ''
  });
  
  const { user, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        address: userProfile.address || '',
        profile_picture_url: userProfile.profile_picture_url || ''
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchResumeHistory();
    }
  }, [activeTab]);

  const fetchResumeHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('id, user_id, compatibility_score, keyword_matches, experience_gaps, tailored_resume, cover_letter, analysis_details, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumeHistory(data || []);
    } catch (err) {
      setError('Failed to load resume history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name || null,
          address: profileData.address || null,
          profile_picture_url: profileData.profile_picture_url || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserProfile();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewResume = (analysis: ResumeAnalysis) => {
    if (analysis.tailored_resume && analysis.tailored_resume.trim()) {
      navigate('/success', {
        state: {
          tailoredResume: analysis.tailored_resume,
          improvements: ['Previously generated resume from your history'],
          coverLetter: analysis.cover_letter,
          coverLetterKeyPoints: analysis.cover_letter ? ['Previously generated cover letter from your history'] : null,
          reference: `history-${analysis.id}`
        }
      });
    } else if (analysis.analysis_details) {
      navigate('/dashboard', {
        state: {
          initialAnalysisResult: analysis.analysis_details,
          fromHistory: true
        }
      });
    } else {
      navigate('/dashboard', {
        state: {
          initialAnalysisResult: {
            match_summary: "This is a historical analysis from your account.",
            match_score: `${analysis.compatibility_score}/100`,
            job_keywords_detected: analysis.keyword_matches.map(keyword => ({
              keyword,
              status: 'Present' as const
            })),
            gaps_and_suggestions: analysis.experience_gaps || []
          },
          fromHistory: true
        }
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (dateString: string) => {
    const createdDate = new Date(dateString);
    const expiryDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 leading-tight">
            Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Settings</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Manage your profile and view your resume history</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-10 sm:mb-12 bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex justify-center">
          <nav className="flex space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Resume History
            </button>
          </nav>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-5 shadow-md animate-fade-in">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="ml-4">
                <h4 className="font-semibold text-red-800 text-lg mb-1">Error:</h4>
                <p className="text-base text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-5 shadow-md animate-fade-in">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div className="ml-4">
                <h4 className="font-semibold text-green-800 text-lg mb-1">Success:</h4>
                <p className="text-base text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Profile Information</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      disabled
                      className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-500 text-base cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Email cannot be changed</p>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-base font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    rows={4}
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile_picture_url" className="block text-base font-medium text-gray-700 mb-2">
                  Profile Picture URL
                </label>
                <div className="relative">
                  <Camera className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    id="profile_picture_url"
                    value={profileData.profile_picture_url}
                    onChange={(e) => setProfileData({ ...profileData, profile_picture_url: e.target.value })}
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="https://example.com/your-photo.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.005] flex items-center space-x-2 text-base"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Resume History</h2>
              <div className="text-sm sm:text-base text-gray-500 flex items-center space-x-2">
                <History className="h-5 w-5 text-gray-400" />
                <span>Resumes are saved for 30 days</span>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-6" />
                <p className="text-lg text-gray-600">Loading your resume history...</p>
              </div>
            ) : resumeHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Resume History</h3>
                <p className="text-base text-gray-600 mb-6">
                  You haven't generated any tailored resumes yet. Start your first analysis today!
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.005]"
                >
                  Analyze Your First Resume
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {resumeHistory.map((analysis) => {
                  const daysRemaining = getDaysRemaining(analysis.created_at);
                  const isExpired = daysRemaining === 0;
                  const hasContent = analysis.tailored_resume || analysis.analysis_details;
                  
                  return (
                    <div
                      key={analysis.id}
                      onClick={() => hasContent && !isExpired && handleViewResume(analysis)}
                      className={`border rounded-xl p-5 sm:p-6 transition-all duration-300 ease-in-out transform ${
                        isExpired 
                          ? 'border-red-300 bg-red-50 shadow-md opacity-70 cursor-not-allowed' 
                          : hasContent 
                            ? 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg cursor-pointer' 
                            : 'border-gray-200 bg-white shadow-md'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Sparkles className="h-6 w-6 text-blue-600" />
                            <span className="text-lg font-bold text-gray-900">
                              AI Resume Analysis
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm sm:text-base">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{formatDate(analysis.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">Score: <span className="font-semibold text-gray-900">{analysis.compatibility_score}/100</span></span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">Keywords: <span className="font-semibold text-gray-900">{analysis.keyword_matches.length}</span></span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-3 sm:space-y-0 sm:space-x-4">
                          <span className={`px-4 py-2 rounded-full text-xs font-semibold ${
                            isExpired ? 'bg-red-100 text-red-800' : daysRemaining <= 7 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {isExpired ? 'Expired' : `Expires in ${daysRemaining} days`}
                          </span>
                          {hasContent && !isExpired ? (
                            <button
                              onClick={() => handleViewResume(analysis)}
                              className="bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300 shadow-md flex items-center space-x-2 text-sm"
                            >
                              <Eye className="h-4 w-4" />
                              <span>
                                {analysis.tailored_resume ? 'View Tailored Resume' : 'View Analysis Details'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500 px-5 py-2.5">
                              {isExpired ? 'Content Unavailable' : 'No Viewable Content'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;