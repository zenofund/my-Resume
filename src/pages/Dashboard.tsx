import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyzeResume, AnalysisResult } from '../lib/openai';
import { extractTextFromFile, generateSHA256Hash, toSentenceCase } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Upload, FileText, Brain, AlertCircle, CheckCircle, ArrowRight, TrendingUp, Loader2, X, Lock, Info, Sparkles, Zap, Target } from 'lucide-react';

const STORAGE_KEY = 'zolla_dashboard_state';

interface DashboardState {
  currentStep: number;
  resumeText: string;
  jobDescription: string;
  selectedAnalysisTypes: string[];
  fileName: string | null;
  analysisResult: AnalysisResult | null;
  usedCachedResult: boolean;
}

const Dashboard: React.FC = () => {
  const getInitialState = (): DashboardState => ({
    currentStep: 1,
    resumeText: '',
    jobDescription: '',
    selectedAnalysisTypes: ['job_match_analysis'],
    fileName: null,
    analysisResult: null,
    usedCachedResult: false,
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const loadState = (): DashboardState => {
    if (location.state?.initialAnalysisResult) {
      const initialState = getInitialState();
      return {
        ...initialState,
        currentStep: 4,
        analysisResult: location.state.initialAnalysisResult,
        usedCachedResult: true
      };
    }
    
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState && typeof parsedState === 'object') {
          return {
            ...getInitialState(),
            ...parsedState,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load dashboard state from sessionStorage:', error);
    }
    return getInitialState();
  };

  const [dashboardState, setDashboardState] = useState<DashboardState>(loadState);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.initialAnalysisResult) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dashboardState));
    } catch (error) {
      console.warn('Failed to save dashboard state to sessionStorage:', error);
    }
  }, [dashboardState]);

  const updateState = (updates: Partial<DashboardState>) => {
    setDashboardState(prev => ({ ...prev, ...updates }));
  };

  const handleResetAnalysis = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear dashboard state from sessionStorage:', error);
    }
    setDashboardState(getInitialState());
    setError(null);
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const analysisOptions = [
    {
      id: 'job_match_analysis',
      label: 'Job Match Analysis',
      description: 'Core compatibility scoring and keyword matching',
      isPremium: false,
      isCore: true
    },
    {
      id: 'ats_compatibility',
      label: 'ATS Compatibility Check',
      description: 'Check if your resume passes automated screening',
      isPremium: false,
      isCore: false
    },
    {
      id: 'impact_statement_review',
      label: 'Impact Statement Review',
      description: 'Identify weak accomplishments and achievements',
      isPremium: false,
      isCore: false
    },
    {
      id: 'skills_gap_assessment',
      label: 'Skills Gap Assessment',
      description: 'Compare your skills to job requirements',
      isPremium: true,
      isCore: false
    },
    {
      id: 'format_optimization',
      label: 'Format Optimization',
      description: 'Review resume formatting and structure',
      isPremium: true,
      isCore: false
    },
    {
      id: 'career_story_flow',
      label: 'Career Story Flow Analysis',
      description: 'Analyze career progression narrative',
      isPremium: true,
      isCore: false
    }
  ];

  const handleAnalysisTypeChange = (analysisType: string) => {
    updateState({
      selectedAnalysisTypes: dashboardState.selectedAnalysisTypes.includes(analysisType)
        ? dashboardState.selectedAnalysisTypes.filter(type => type !== analysisType)
        : [...dashboardState.selectedAnalysisTypes, analysisType]
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    updateState({ fileName: file.name });

    try {
      const extractedText = await extractTextFromFile(file);
      updateState({ resumeText: extractedText });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      updateState({ fileName: null });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    updateState({ fileName: null, resumeText: '' });
    setError(null);
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!dashboardState.resumeText.trim()) {
      setError('Please provide your resume text.');
      return;
    }

    const needsJobDescription = dashboardState.selectedAnalysisTypes.includes('job_match_analysis');
    if (needsJobDescription && !dashboardState.jobDescription.trim()) {
      setError('Please provide the job description for job match analysis.');
      return;
    }

    if (!user) {
      setError('Please sign in to analyze your resume.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    updateState({ usedCachedResult: false });

    try {
      let resumeHash = '';
      let jobDescriptionHash = '';
      
      if (needsJobDescription) {
        resumeHash = await generateSHA256Hash(dashboardState.resumeText);
        jobDescriptionHash = await generateSHA256Hash(dashboardState.jobDescription);

        const { data: existingAnalysis, error: queryError } = await supabase
          .from('resume_analyses')
          .select('compatibility_score, keyword_matches, experience_gaps, skill_gaps, analysis_details')
          .eq('user_id', user.id)
          .eq('resume_hash', resumeHash)
          .eq('job_description_hash', jobDescriptionHash)
          .limit(1)
          .single();

        if (!queryError && existingAnalysis) {
          const cachedResult: AnalysisResult = existingAnalysis.analysis_details || {
            match_summary: "This analysis was retrieved from your previous submission with the same resume and job description.",
            match_score: `${existingAnalysis.compatibility_score}/100`,
            job_keywords_detected: existingAnalysis.keyword_matches.map(keyword => ({
              keyword,
              status: 'Present' as const
            })),
            gaps_and_suggestions: existingAnalysis.experience_gaps
          };

          updateState({ 
            analysisResult: cachedResult, 
            usedCachedResult: true, 
            currentStep: 4 
          });
          setIsAnalyzing(false);
          return;
        }
      }

      const allowedAnalysisTypes = dashboardState.selectedAnalysisTypes.filter(type => 
        !analysisOptions.find(option => option.id === type)?.isPremium
      );

      const result = await analyzeResume(
        dashboardState.resumeText, 
        needsJobDescription ? dashboardState.jobDescription : '', 
        allowedAnalysisTypes.filter(type => type !== 'job_match_analysis')
      );
      updateState({ analysisResult: result });

      if (needsJobDescription) {
        const numericScore = getNumericScore(result.match_score);
        const presentKeywords = result.job_keywords_detected
          .filter(item => item.status === 'Present')
          .map(item => item.keyword);

        await supabase.from('resume_analyses').insert({
          user_id: user.id,
          compatibility_score: numericScore,
          keyword_matches: presentKeywords,
          experience_gaps: result.gaps_and_suggestions,
          skill_gaps: [],
          resume_hash: resumeHash,
          job_description_hash: jobDescriptionHash,
          analysis_details: result,
        });
      }

      updateState({ currentStep: 4 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetTailoredResume = () => {
    navigate('/premium', { 
      state: { 
        resumeText: dashboardState.resumeText, 
        jobDescription: dashboardState.jobDescription, 
        analysisResult: dashboardState.analysisResult 
      } 
    });
  };

  const getNumericScore = (matchScore: string): number => {
    const match = matchScore.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const getIssuesCount = () => {
    if (!dashboardState.analysisResult) return { total: 0, details: [] };
    
    const issues = [];
    let total = 0;

    if (dashboardState.analysisResult.ats_compatibility?.issues?.length) {
      const count = dashboardState.analysisResult.ats_compatibility.issues.length;
      issues.push(`${count} ATS compatibility problem${count > 1 ? 's' : ''}`);
      total += count;
    }

    if (dashboardState.analysisResult.job_keywords_detected) {
      const missingCount = dashboardState.analysisResult.job_keywords_detected.filter(
        item => item.status === 'Missing'
      ).length;
      if (missingCount > 0) {
        issues.push(`${missingCount} missing keyword${missingCount > 1 ? 's' : ''}`);
        total += missingCount;
      }
    }

    if (dashboardState.analysisResult.impact_statement_review?.weak_statements?.length) {
      const count = dashboardState.analysisResult.impact_statement_review.weak_statements.length;
      issues.push(`${count} weak impact statement${count > 1 ? 's' : ''}`);
      total += count;
    }

    if (dashboardState.analysisResult.skills_gap_assessment?.missing_skills?.length) {
      const count = dashboardState.analysisResult.skills_gap_assessment.missing_skills.length;
      issues.push(`${count} skill gap${count > 1 ? 's' : ''}`);
      total += count;
    }

    if (dashboardState.analysisResult.format_optimization?.issues?.length) {
      const count = dashboardState.analysisResult.format_optimization.issues.length;
      issues.push(`${count} format issue${count > 1 ? 's' : ''}`);
      total += count;
    }

    if (dashboardState.analysisResult.career_story_flow?.issues?.length) {
      const count = dashboardState.analysisResult.career_story_flow.issues.length;
      issues.push(`${count} career story issue${count > 1 ? 's' : ''}`);
      total += count;
    }

    if (dashboardState.analysisResult.gaps_and_suggestions?.length) {
      const count = dashboardState.analysisResult.gaps_and_suggestions.length;
      if (total === 0) {
        issues.push(`${count} improvement area${count > 1 ? 's' : ''}`);
        total += count;
      }
    }

    return { total, details: issues };
  };

  const isJobMatchSelected = dashboardState.selectedAnalysisTypes.includes('job_match_analysis');

  const renderStep = () => {
    switch (dashboardState.currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Resume</h3>
              <p className="text-base text-gray-600">Upload your resume file or paste your resume text</p>
            </div>

            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ease-in-out transform hover:scale-[1.01] shadow-sm hover:shadow-md ${
              isUploading 
                ? 'border-blue-400 bg-blue-50' 
                : dashboardState.fileName 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 bg-white'
            }`}>
              {isUploading ? (
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <span className="text-blue-600 font-medium text-base">Processing file...</span>
                  <span className="text-sm text-gray-500">Extracting text from {dashboardState.fileName}</span>
                </div>
              ) : dashboardState.fileName ? (
                <div className="flex flex-col items-center space-y-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <span className="text-green-600 font-medium text-base">File uploaded successfully!</span>
                  <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm max-w-full">
                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{dashboardState.fileName}</span>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 p-1 rounded-full hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center space-y-3"
                  >
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span className="text-base text-gray-600 font-medium">Click to upload or drag and drop</span>
                    <span className="text-sm text-gray-500">DOCX or TXT files only</span>
                  </label>
                </>
              )}
            </div>

            <div className="text-center text-gray-500 font-semibold text-lg">
              <span>or</span>
            </div>

            <div>
              <label htmlFor="resume-text" className="block text-base font-medium text-gray-700 mb-3">
                Paste your resume text here
              </label>
              <textarea
                id="resume-text"
                value={dashboardState.resumeText}
                onChange={(e) => updateState({ resumeText: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm"
                placeholder="Paste your resume text here..."
              />
            </div>

            <button
              onClick={() => updateState({ currentStep: 2 })}
              disabled={!dashboardState.resumeText.trim() || isUploading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.005]"
            >
              {isUploading ? 'Processing...' : 'Next: Select Analysis Types'}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">What would you like to analyze?</h3>
              <p className="text-base text-gray-600">Select analysis types for comprehensive insights</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Info className="h-5 w-5 text-purple-600 mr-2" />
                Analysis Options
              </h4>
              <div className="space-y-4">
                {analysisOptions.map((option) => (
                  <div key={option.id} className="relative group">
                    <label className={`flex items-start space-x-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ease-in-out transform group-hover:scale-[1.01] shadow-sm group-hover:shadow-md ${
                      dashboardState.selectedAnalysisTypes.includes(option.id)
                        ? 'border-purple-400 bg-purple-50' 
                        : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-25'
                    } ${option.isPremium ? 'opacity-75' : ''}`}>
                      <input
                        type="checkbox"
                        checked={dashboardState.selectedAnalysisTypes.includes(option.id)}
                        onChange={() => handleAnalysisTypeChange(option.id)}
                        disabled={option.isPremium}
                        className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded-md disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-gray-900 text-base">
                            {option.label}
                          </h5>
                          {option.isPremium && (
                            <Lock className="h-4 w-4 text-orange-500" />
                          )}
                          {option.isCore && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-semibold">
                              Core
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </label>
                    {option.isPremium && (
                      <div className="absolute inset-0 bg-gray-100 bg-opacity-60 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1.5 rounded-full border border-gray-300 shadow-md">
                          Premium Feature
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800 flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tip:</strong> Select multiple options for comprehensive analysis. Premium features will be available after upgrading.
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-900 text-base">Analysis Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Resume: {dashboardState.fileName ? dashboardState.fileName : `${dashboardState.resumeText.length} characters`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Analysis Types: {dashboardState.selectedAnalysisTypes.length} selected
                  </span>
                </div>
                {isJobMatchSelected && (
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      Job description required for job match analysis
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => updateState({ currentStep: 1 })}
                className="flex-1 bg-gray-200 text-gray-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.005]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (isJobMatchSelected) {
                    updateState({ currentStep: 3 });
                  } else {
                    handleAnalyze();
                  }
                }}
                disabled={dashboardState.selectedAnalysisTypes.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.005] flex items-center justify-center space-x-2"
              >
                {isJobMatchSelected ? (
                  <>
                    <span>Next: Add Job Description</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Job Description</h3>
              <p className="text-base text-gray-600">Paste the job description you want to apply for</p>
            </div>

            <div>
              <label htmlFor="job-description" className="block text-base font-medium text-gray-700 mb-3">
                Job Description
              </label>
              <textarea
                id="job-description"
                value={dashboardState.jobDescription}
                onChange={(e) => updateState({ jobDescription: e.target.value })}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm"
                placeholder="Paste the job description here..."
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => updateState({ currentStep: 2 })}
                className="flex-1 bg-gray-200 text-gray-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.005]"
              >
                Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!dashboardState.jobDescription.trim() || isAnalyzing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.005] flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 4:
        const issuesCount = getIssuesCount();
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Analysis Complete! 🎉</h3>
              <p className="text-base text-gray-600">Here's your resume analysis results</p>
              {dashboardState.usedCachedResult && (
                <div className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800 font-medium border border-blue-200">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Retrieved from previous analysis
                </div>
              )}
            </div>

            {dashboardState.analysisResult && (
              <div className="space-y-6">
                {isJobMatchSelected && dashboardState.analysisResult.match_score && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Overall Analysis Score
                    </h4>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${getNumericScore(dashboardState.analysisResult.match_score)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        {dashboardState.analysisResult.match_score}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">This score indicates how well your resume matches the job description.</p>
                  </div>
                )}

                {isJobMatchSelected && dashboardState.analysisResult.match_summary && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      Job Match Analysis Summary
                    </h4>
                    <p className="text-base text-gray-700 leading-relaxed">{dashboardState.analysisResult.match_summary}</p>
                  </div>
                )}

                {isJobMatchSelected && dashboardState.analysisResult.job_keywords_detected && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Keywords Detected</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dashboardState.analysisResult.job_keywords_detected.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                          <span className="text-base text-gray-700 font-medium truncate mr-2">{toSentenceCase(item.keyword)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                            item.status === 'Present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status === 'Present' ? '✅ Present' : '❌ Missing'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isJobMatchSelected && dashboardState.analysisResult.gaps_and_suggestions && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Gaps and Suggestions</h4>
                    <ul className="space-y-3">
                      {dashboardState.analysisResult.gaps_and_suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-base text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {dashboardState.analysisResult.ats_compatibility && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                      ATS Compatibility ({dashboardState.analysisResult.ats_compatibility.score}/10)
                      {dashboardState.analysisResult.ats_compatibility.score < 7 && (
                        <span className="ml-2 text-orange-600 font-medium">⚠️ Issues Found</span>
                      )}
                    </h4>
                    <p className="text-base text-gray-700 mb-4">{dashboardState.analysisResult.ats_compatibility.summary}</p>
                    {dashboardState.analysisResult.ats_compatibility.issues.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900 text-base">Issues Found:</h5>
                        <ul className="space-y-2">
                          {dashboardState.analysisResult.ats_compatibility.issues.map((issue, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-base text-gray-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {dashboardState.analysisResult.impact_statement_review && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                      Impact Statement Review ({dashboardState.analysisResult.impact_statement_review.score}/10)
                      {dashboardState.analysisResult.impact_statement_review.score < 7 && (
                        <span className="ml-2 text-orange-600 font-medium">🎯 Needs improvement</span>
                      )}
                    </h4>
                    <p className="text-base text-gray-700 mb-4">{dashboardState.analysisResult.impact_statement_review.summary}</p>
                    {dashboardState.analysisResult.impact_statement_review.weak_statements.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900 text-base">Weak Statements:</h5>
                        <ul className="space-y-2">
                          {dashboardState.analysisResult.impact_statement_review.weak_statements.map((statement, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-base text-gray-700">{statement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {dashboardState.analysisResult && issuesCount.total > 0 && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6 shadow-lg">
                    <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                      <Sparkles className="h-6 w-6 text-yellow-500 mr-2" />
                      Ready to Fix These Issues?
                    </h4>
                    <p className="text-base text-gray-700 mb-4">
                      Your analysis revealed {issuesCount.details.join(', ')}. Get an enhanced resume that addresses ALL these issues:
                    </p>
                    <ul className="space-y-3 mb-5">
                      <li className="flex items-center space-x-3 text-base">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>✨ Rewritten impact statements with quantified results</span>
                      </li>
                      <li className="flex items-center space-x-3 text-base">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>✨ ATS-optimized formatting</span>
                      </li>
                      <li className="flex items-center space-x-3 text-base">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>✨ Strategic keyword integration</span>
                      </li>
                      <li className="flex items-center space-x-3 text-base">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>✨ Skills section optimization</span>
                      </li>
                    </ul>
                    <button
                      onClick={handleGetTailoredResume}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.005] flex items-center justify-center space-x-2"
                    >
                      <Zap className="h-5 w-5" />
                      <span>Get Enhanced Resume & Cover Letter</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {dashboardState.analysisResult && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <h4 className="text-xl font-bold mb-3">
                      {isJobMatchSelected ? 'Want a Tailored Resume & Cover Letter?' : 'Ready to Enhance Your Resume?'}
                    </h4>
                    <p className="mb-4 text-base">
                      {isJobMatchSelected 
                        ? 'Get a professionally optimized resume and compelling cover letter that matches this job description perfectly.'
                        : 'Get a professionally optimized resume and compelling cover letter that addresses all identified issues and enhances your job prospects.'
                      }
                    </p>
                    <button
                      onClick={handleGetTailoredResume}
                      className="bg-white text-blue-600 py-3 px-5 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-md hover:shadow-lg flex items-center space-x-2 text-base"
                    >
                      <span>Get Enhanced Resume & Cover Letter</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 text-center shadow-lg">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Analysis Complete!</h4>
                  <p className="text-base text-gray-600 mb-5">
                    Your resume analysis is complete. Ready to analyze another resume or enhance this one?
                  </p>
                  <button
                    onClick={handleResetAnalysis}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.005]"
                  >
                    Analyze Another Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 leading-tight">
            Resume Analysis <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Dashboard</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Analyze your resume with AI-powered insights</p>
        </div>

        <div className="mb-10 sm:mb-12 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-center justify-between relative mb-4">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl transition-all duration-300 ease-in-out transform ${
                    step <= dashboardState.currentStep 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-600 border-2 border-gray-300'
                  }`}>
                    {step}
                  </div>
                </div>
                {step < 4 && (
                  <div className={`flex-1 h-1 mx-2 sm:mx-4 transition-all duration-300 ease-in-out ${
                    step < dashboardState.currentStep ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-center">
            <span className="flex-1 text-sm sm:text-base text-gray-700 font-medium">Upload</span>
            <span className="flex-1 text-sm sm:text-base text-gray-700 font-medium">Analysis Types</span>
            <span className="flex-1 text-sm sm:text-base text-gray-700 font-medium">Job Description</span>
            <span className="flex-1 text-sm sm:text-base text-gray-700 font-medium">Results</span>
          </div>
        </div>

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

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;