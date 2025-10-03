import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Upload, FileText } from 'lucide-react';

const Chat: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2">
              <img src="/easyia-favicon.png" alt="easyIA Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">easyIA</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600">Welcome, {user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Legal Research Assistant</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Upload legal documents and start chatting with your AI legal assistant
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Chat Interface Coming Soon
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              We're building an advanced chat interface where you can upload Nigerian legal documents 
              and get instant AI-powered answers with proper citations.
            </p>
            
            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
              <div className="bg-gray-50 rounded-lg p-4">
                <Upload className="h-6 w-6 text-blue-600 mb-2" />
                <h4 className="font-semibold text-gray-900 mb-1">Document Upload</h4>
                <p className="text-sm text-gray-600">
                  Upload PDF and DOCX legal documents for AI analysis
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <FileText className="h-6 w-6 text-purple-600 mb-2" />
                <h4 className="font-semibold text-gray-900 mb-1">Smart Citations</h4>
                <p className="text-sm text-gray-600">
                  Get answers with proper legal citations and case references
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Chat Interface */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Chat Preview</h3>
          </div>
          
          <div className="p-4 sm:p-6 space-y-4 min-h-96">
            {/* Sample Messages */}
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                <p className="text-sm text-gray-700">
                  Hello! I'm your AI legal assistant. Upload a document to get started.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
                <p className="text-sm">
                  What are the requirements for filing a motion in Nigerian courts?
                </p>
              </div>
            </div>
            
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-md">
                <p className="text-sm text-gray-700">
                  Based on Nigerian civil procedure rules, a motion must include... 
                  <span className="text-blue-600 underline cursor-pointer">[Citation: Order 43 Rule 1]</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ask a legal question... (Coming Soon)"
                disabled
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <button
                disabled
                className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;