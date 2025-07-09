import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Brain, CreditCard, MessageCircle, Heart, Info, Sparkles, Zap, Target, TrendingUp } from 'lucide-react';
import AnalysisInfoModal from '../components/AnalysisInfoModal';

const Landing: React.FC = () => {
  const [showAnalysisInfoModal, setShowAnalysisInfoModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsAppSupport = () => {
    const phoneNumber = '2348135381616';
    const message = encodeURIComponent('Hi! I want to learn more about Zolla AI resume analysis.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section with Enhanced Background */}
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-purple-900/90 to-indigo-900/95" />
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{
              backgroundImage: 'url(https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)'
            }}
          />
        </div>

        {/* Enhanced Navigation */}
        <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-lg' 
            : 'bg-black/10 backdrop-blur-sm border-b border-white/10'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-18">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <img src="/am_fav.png" alt="Zolla Logo" className="h-8 w-8 sm:h-10 sm:w-10 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
                <span className={`text-xl sm:text-2xl font-bold transition-colors ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}>Zolla</span>
              </Link>
              
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Link
                  to="/login"
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105 ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' 
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                    isScrolled 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                      : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Enhanced Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <div className="text-center">
              {/* Floating Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6 sm:mb-8">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-white/90 text-sm font-medium">AI-Powered Resume Analysis</span>
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight">
                Hi, I'm
                <span className="relative inline-block ml-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 animate-pulse">
                    Zolla!
                  </span>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-lg blur opacity-20 animate-pulse"></div>
                </span>
              </h1>

              <div className="space-y-4 mb-8 sm:mb-12">
                <p className="text-lg sm:text-xl lg:text-2xl text-white/95 max-w-4xl mx-auto leading-relaxed font-medium">
                  Use my <span className="text-blue-300 font-semibold">Free AI Resume Analysis Tool</span> to instantly improve your ATS score so you land more interviews.
                </p>
                <p className="text-base sm:text-lg lg:text-xl text-white/85 max-w-4xl mx-auto leading-relaxed">
                  Upload your resume and job description to get a detailed AI-powered review—keyword matching, ATS optimization, action-driven impact tips—all for free.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 mb-8">
                <Link
                  to="/signup"
                  className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 sm:px-10 py-4 sm:py-4 rounded-2xl font-bold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-3 text-base sm:text-lg shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transform"
                >
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Start Free Analysis</span>
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </Link>
                <Link
                  to="/login"
                  className="group bg-white/15 backdrop-blur-md text-white border-2 border-white/30 px-8 sm:px-10 py-4 sm:py-4 rounded-2xl font-semibold hover:bg-white/25 hover:border-white/50 transition-all duration-300 flex items-center justify-center space-x-2 text-base sm:text-lg shadow-xl hover:scale-105 transform"
                >
                  <span>Sign In</span>
                </Link>
              </div>
              
              {/* Enhanced Analysis Info Link */}
              <div className="mt-6 sm:mt-8">
                <button
                  onClick={() => setShowAnalysisInfoModal(true)}
                  className="group text-white/80 hover:text-white text-sm sm:text-base transition-all duration-300 flex items-center justify-center space-x-2 mx-auto hover:scale-105 transform"
                >
                  <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                    <Info className="h-4 w-4" />
                  </div>
                  <span className="underline underline-offset-4 decoration-2 decoration-white/50 group-hover:decoration-white/80">
                    How Zolla Analyzes Your Resume
                  </span>
                </button>
              </div>

              {/* Stats Section */}
              <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">10K+</div>
                  <div className="text-white/70 text-sm">Resumes Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">95%</div>
                  <div className="text-white/70 text-sm">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">30s</div>
                  <div className="text-white/70 text-sm">Average Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="py-16 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-semibold">How It Works</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Three Simple Steps to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Success</span>
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
              Transform your resume in minutes with our AI-powered analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                icon: FileText,
                title: "Upload Resume",
                description: "Upload your resume in DOCX format or paste your resume text directly",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100",
                step: "01"
              },
              {
                icon: Brain,
                title: "AI Analysis",
                description: "Our AI analyzes your resume against the job description for compatibility",
                gradient: "from-purple-500 to-purple-600",
                bgGradient: "from-purple-50 to-purple-100",
                step: "02"
              },
              {
                icon: CreditCard,
                title: "Get Tailored Resume",
                description: "Get a professionally tailored resume optimized for the job",
                gradient: "from-green-500 to-green-600",
                bgGradient: "from-green-50 to-green-100",
                step: "03"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-3xl transform group-hover:scale-105 transition-transform duration-300`}></div>
                <div className="relative text-center p-8 sm:p-10">
                  {/* Step Number */}
                  <div className="absolute top-4 right-4 text-6xl font-bold text-gray-200 group-hover:text-gray-300 transition-colors">
                    {feature.step}
                  </div>
                  
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg group-hover:shadow-xl transition-shadow transform group-hover:scale-110 duration-300`}>
                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{feature.title}</h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Benefits Section */}
      <div className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full px-6 py-2 mb-6">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-semibold">Why Choose Zolla</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8 sm:mb-12">
                Supercharge Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Job Search</span>
              </h2>
              
              <ul className="space-y-6 sm:space-y-8">
                {[
                  {
                    title: "Instant Analysis",
                    description: "Get your compatibility score in seconds",
                    icon: Zap
                  },
                  {
                    title: "Keyword Matching",
                    description: "See which keywords you're missing",
                    icon: Target
                  },
                  {
                    title: "Gap Analysis",
                    description: "Identify experience and skill gaps",
                    icon: Brain
                  },
                  {
                    title: "Tailored Resume & Cover Letter",
                    description: "Get a professionally optimized resume",
                    icon: FileText
                  },
                  {
                    title: "Instant Download",
                    description: "Download your tailored resume immediately",
                    icon: ArrowRight
                  }
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{benefit.title}</h4>
                      <p className="text-base sm:text-lg text-gray-600">{benefit.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl transform rotate-3 opacity-20"></div>
                <div className="relative bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                      Ready to get started?
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                      Join thousands of job seekers who have improved their resumes with Zolla
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Link
                      to="/signup"
                      className="group w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-3 text-lg shadow-xl hover:shadow-2xl hover:scale-105 transform"
                    >
                      <Sparkles className="h-5 w-5" />
                      <span>Start Your Free Analysis</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <div className="text-center text-sm text-gray-500">
                      No credit card required • 100% Free
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white py-8 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Heart className="h-5 w-5 text-red-400 fill-current animate-pulse" />
            <span className="text-white/90 text-sm">Made with love by</span>
            <a 
              href="https://elxis.com.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 font-semibold transition-colors hover:underline"
            >
              eLxis
            </a>
            <Heart className="h-5 w-5 text-red-400 fill-current animate-pulse" />
          </div>
          <p className="text-white/70 text-xs">
            © 2024 Zolla AI. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Enhanced WhatsApp Support Button */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50">
        <button
          onClick={handleWhatsAppSupport}
          className="group relative bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 sm:p-5 rounded-2xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300/50"
          aria-label="Contact WhatsApp Support"
        >
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" />
          
          {/* Enhanced Tooltip */}
          <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl transform group-hover:translate-y-1">
            Need help? Chat with us!
            <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
          </div>
          
          {/* Enhanced Pulse Animation */}
          <div className="absolute inset-0 rounded-2xl bg-green-400 animate-ping opacity-30"></div>
          <div className="absolute inset-0 rounded-2xl bg-green-300 animate-pulse opacity-20"></div>
        </button>
      </div>

      {/* Analysis Info Modal */}
      <AnalysisInfoModal 
        isOpen={showAnalysisInfoModal} 
        onClose={() => setShowAnalysisInfoModal(false)} 
      />
    </div>
  );
};

export default Landing;