import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, FileText, CreditCard, Settings } from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2">
              <img src="/easyia-favicon.png" alt="easyIA Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">easyIA Admin</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600">Admin: {user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-red-600 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage users, documents, subscriptions, and system settings
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Admin Dashboard Coming Soon
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              We're building a comprehensive admin dashboard for managing users, documents, 
              subscriptions, and system-wide settings.
            </p>
          </div>
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Users className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-sm text-gray-600 mb-4">
              View, edit, and manage user accounts, roles, and permissions.
            </p>
            <div className="bg-gray-100 rounded p-3">
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <FileText className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Library</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage uploaded legal documents and system-wide document library.
            </p>
            <div className="bg-gray-100 rounded p-3">
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <CreditCard className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Plans</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create and manage subscription plans, pricing, and billing settings.
            </p>
            <div className="bg-gray-100 rounded p-3">
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Settings className="h-8 w-8 text-orange-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Configure system-wide settings, API keys, and feature toggles.
            </p>
            <div className="bg-gray-100 rounded p-3">
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Shield className="h-8 w-8 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Security & Logs</h3>
            <p className="text-sm text-gray-600 mb-4">
              Monitor system security, user activity, and audit logs.
            </p>
            <div className="bg-gray-100 rounded p-3">
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <FileText className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">
              View platform usage statistics, user engagement, and revenue metrics.
            </p>
            <div className="bg-gray-100 rounded p-3">
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;