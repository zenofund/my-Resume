import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyzeResume } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { extractTextFromFile, generateSHA256Hash } from '../lib/utils';
import { 
  Upload, 
  FileText, 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Star,
  ArrowRight,
  Info
} from 'lucide-react';

interface JobKeyword {
  keyword: string;
  status: 'Present' | 'Missing';
}

interface AnalysisResult {
  match_summary: string;
  match_score: string;
  job_keywords_detected: JobKeyword[];
  gaps_and_suggestions: string[];
  ats_compatibility?: {
    score: number;
    summary: string;
    issues: string[];
    suggestions: string[];
  };
  impact_statement_review?: {
    score: number;
    summary: string;
    weak_statements: string[];
    suggestions: string[];
  };
  skills_gap_assessment?: {
    score: number;
    summary: string;
    missing_skills: string[];
    suggestions: string[];
  };
  format_optimization?: {
    score: number;
    summary: string;
    issues: string[];
    suggestions: string[];
  };
  career_story_flow?: {
    score: number;
    summary: string;
    issues: string[];
    suggestions: string[];
  };
}

const Dashboard: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have initial data from navigation state
  React.useEffect(() => {
    if (location.state) {
      const { 
        initialAnalysisResult, 
        originalResumeText, 
        originalJobDescription,
        fromHistory 
      } = location.state;
      
      if (initialAnalysisResult) {
        setAnalysisResult(initialAnalysisResult);
      }
      if (originalResumeText) {
        setResumeText(originalResumeText);
      }
      if (originalJobDescription) {
        setJobDescription(originalJobDescription);
      }
      
      // Clear the navigation state to prevent issues on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text from file');
    }
  };

  const handleAnalysisTypeToggle = (type: string) => {
    setSelectedAnalysisTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please provide your resume text');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please provide the job description');
      return;
    }

    if (!user) {
      setError('You must be logged in to analyze resumes');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Generate hashes for deduplication
      const resumeHash = await generateSHA256Hash(resumeText);
      const jobDescriptionHash = await generateSHA256Hash(jobDescription);

      // Check for existing analysis
      const { data: existingAnalysis, error: queryError } = await supabase
        .from('resume_analyses')
        .select('compatibility_score, keyword_matches, experience_gaps, skill_gaps, analysis_details')
        .eq('user_id', user.id)
        .eq('resume_hash', resumeHash)
        .eq('job_description_hash', jobDescriptionHash)
        .limit(1)
        .maybeSingle();

      if (!queryError && existingAnalysis !== null) {
        // Use cached analysis
        const cachedResult: AnalysisResult = existingAnalysis.analysis_details || {
          match_summary: "This is a cached analysis from your previous request.",
          match_score: `${existingAnalysis.compatibility_score}/100`,
          job_keywords_detected: existingAnalysis.keyword_matches.map((keyword: string) => ({
            keyword,
            status: 'Present' as const
          })),
          gaps_and_suggestions: existingAnalysis.experience_gaps || []
        };
        
        setAnalysisResult(cachedResult);
        setIsAnalyzing(false);
        return;
      }

      // Perform new analysis
      const result = await analyzeResume(resumeText, jobDescription, selectedAnalysisTypes);
      setAnalysisResult(result);

      // Helper function to extract numeric score from match_score string
      const getNumericScore = (matchScore: string): number => {
        const match = matchScore.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      // Helper function to extract present keywords
      const getPresentKeywords = (): string[] => {
        return result.job_keywords_detected
          .filter(item => item.status === 'Present')
          .map(item => item.keyword);
      };

      // Save analysis to database
      await supabase.from('resume_analyses').insert({
        user_id: user.id,
        compatibility_score: getNumericScore(result.match_score),
        keyword_matches: getPresentKeywords(),
        experience_gaps: result.gaps_and_suggestions || [],
        skill_gaps: [], // Empty array as new format combines all gaps
        resume_hash: resumeHash,
        job_description_hash: jobDescriptionHash,
        analysis_details: result,
        original_resume_text: resumeText,
        original_job_description: jobDescription
      });

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetTailoredResume = () => {
    if (!analysisResult || !resumeText || !jobDescription) return;
    
    navigate('/premium', {
      state: {
        resumeText,
        jobDescription,
        analysisResult
      }
    });
  };

  // Helper function to extract numeric score from match_score string
  const getNumericScore = (matchScore: string): number => {
    const match = matchScore.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const analysisTypes = [
    {
      id: 'ats_compatibility',
      name: 'ATS Compatibility',
      description: 'Check if your resume will pass Applicant Tracking Systems',
      icon: '🤖'
    },
    {
      id: 'impact_statement_review',
      name: 'Impact Statement Review',
      description: 'Evaluate the strength of your accomplishments and achievements',
      icon: '💪'
    },
    {
      id: 'skills_gap_assessment',
      name: 'Skills Gap Assessment',
      description: 'Compare your skills to job requirements',
      icon: '🎯'
    },
    {
      id: 'format_optimization',
      name: 'Format Optimization',
      description: 'Review resume formatting and structure',
      icon: '📄'
    },
    {
      id: 'career_story_flow',
      name: 'Career Story Flow',
      description: 'Analyze career progression narrative',
      icon: '📈'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">AI Resume Analysis</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Get instant feedback on how well your resume matches the job description
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Column - Input */}
        <div className="space-y-4 sm:space-y-6">
          {/* Resume Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
              Your Resume
            </h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Upload DOCX</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              <div className="text-center text-xs sm:text-sm text-gray-500">
                or paste your resume text below
              </div>
              
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full h-40 sm:h-48 p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Job Description Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
              Job Description
            </h3>
            
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-40 sm:h-48 p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs sm:text-sm"
            />
          </div>

          {/* Premium Analysis Options */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mr-2" />
              Premium Analysis Options
            </h3>
            
            <div className="space-y-2 sm:space-y-3">
              {analysisTypes.map((type) => (
                <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAnalysisTypes.includes(type.id)}
                    onChange={() => handleAnalysisTypeToggle(type.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{type.icon}</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{type.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                Premium analysis options provide deeper insights into your resume's effectiveness
              </p>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !resumeText.trim() || !jobDescription.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Analyze Resume</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-xs sm:text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {analysisResult && (
            <>
              {/* Match Score */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
                  Compatibility Score
                </h3>
                
                <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${getNumericScore(analysisResult.match_score)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {analysisResult.match_score}
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-600">
                  {analysisResult.match_summary}
                </p>
              </div>

              {/* Keywords */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Keyword Analysis
                </h3>
                
                <div className="space-y-2">
                  {analysisResult.job_keywords_detected.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-700">{item.keyword}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Present' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaps and Suggestions */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Improvement Suggestions
                </h3>
                
                <ul className="space-y-2 sm:space-y-3">
                  {analysisResult.gaps_and_suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium Analysis Results */}
              {(analysisResult.ats_compatibility || 
                analysisResult.impact_statement_review || 
                analysisResult.skills_gap_assessment || 
                analysisResult.format_optimization || 
                analysisResult.career_story_flow) && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mr-2" />
                    Premium Analysis Results
                  </h3>
                  
                  <div className="space-y-4">
                    {analysisResult.ats_compatibility && (
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-gray-900 text-sm">ATS Compatibility</h4>
                        <p className="text-xs text-gray-600 mb-2">Score: {analysisResult.ats_compatibility.score}/10</p>
                        <p className="text-xs text-gray-700">{analysisResult.ats_compatibility.summary}</p>
                      </div>
                    )}
                    
                    {analysisResult.impact_statement_review && (
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-medium text-gray-900 text-sm">Impact Statements</h4>
                        <p className="text-xs text-gray-600 mb-2">Score: {analysisResult.impact_statement_review.score}/10</p>
                        <p className="text-xs text-gray-700">{analysisResult.impact_statement_review.summary}</p>
                      </div>
                    )}
                    
                    {analysisResult.skills_gap_assessment && (
                      <div className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-medium text-gray-900 text-sm">Skills Gap Assessment</h4>
                        <p className="text-xs text-gray-600 mb-2">Score: {analysisResult.skills_gap_assessment.score}/10</p>
                        <p className="text-xs text-gray-700">{analysisResult.skills_gap_assessment.summary}</p>
                      </div>
                    )}
                    
                    {analysisResult.format_optimization && (
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-medium text-gray-900 text-sm">Format Optimization</h4>
                        <p className="text-xs text-gray-600 mb-2">Score: {analysisResult.format_optimization.score}/10</p>
                        <p className="text-xs text-gray-700">{analysisResult.format_optimization.summary}</p>
                      </div>
                    )}
                    
                    {analysisResult.career_story_flow && (
                      <div className="border-l-4 border-indigo-500 pl-4">
                        <h4 className="font-medium text-gray-900 text-sm">Career Story Flow</h4>
                        <p className="text-xs text-gray-600 mb-2">Score: {analysisResult.career_story_flow.score}/10</p>
                        <p className="text-xs text-gray-700">{analysisResult.career_story_flow.summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Get Tailored Resume Button */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Ready for the next step?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Get a professionally tailored resume and cover letter optimized for this specific job
                </p>
                <button
                  onClick={handleGetTailoredResume}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Get Tailored Resume & Cover Letter</span>
                </button>
              </div>
            </>
          )}

          {!analysisResult && !error && (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
              <p className="text-sm text-gray-600">
                Upload your resume and paste the job description to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;