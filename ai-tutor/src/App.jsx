import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Assignments from "./pages/Assignments";
import Progress from "./pages/Progress";
import Recommendations from "./pages/Recommendations";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgetPassword";
import Welcome from "./pages/onboarding/Welcome";
import SelectField from "./pages/onboarding/SelectField";
import SelectCourses from "./pages/onboarding/SelectCourses";
import SelectGoal from "./pages/onboarding/SelectGoal";
import Profile from "./pages/Profile";
import Resources from "./pages/Resources.jsx";
import StudentsPage from "./pages/StudentsPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Settings from "./pages/Settings.jsx";
import AIAssistance from "./pages/AIAssistance.jsx";
import AdminAnalytics from "./pages/AdminAnalytics.jsx";

import { useAuth } from "./Contexts/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleRoute({ children, allowedRoles }) {
  const { userProfile } = useAuth();

  if (!userProfile) return null;

  if (!allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Placeholder component for pages not built yet
function PlaceholderPage({ title }) {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">This feature is coming soon</p>
      </div>
      <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🚀</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Under Development</h2>
        <p className="text-gray-500">This page will be available in the next update.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Landing Page - Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Onboarding Routes */}
      <Route path="/onboarding/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
      <Route path="/onboarding/select-field" element={<ProtectedRoute><SelectField /></ProtectedRoute>} />
      <Route path="/onboarding/select-courses" element={<ProtectedRoute><SelectCourses /></ProtectedRoute>} />
      <Route path="/onboarding/select-goals" element={<ProtectedRoute><SelectGoal /></ProtectedRoute>} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="resources" element={<Resources />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="progress" element={<Progress />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="ai-assistant" element={<AIAssistance />} />
        <Route path="analytics" element={
          <RoleRoute allowedRoles={["admin"]}>
            <AdminAnalytics />
          </RoleRoute>
        } />
        <Route path="students" element={
          <RoleRoute allowedRoles={["lecturer", "admin"]}>
            <StudentsPage />
          </RoleRoute>
        } />
        
        {/* Admin placeholder routes - Coming Soon */}
        <Route path="logs" element={<PlaceholderPage title="System Logs" />} />
        <Route path="content" element={<PlaceholderPage title="Manage Content" />} />
        <Route path="materials" element={<PlaceholderPage title="Materials" />} />
        <Route path="users" element={<PlaceholderPage title="Users Management" />} />
      </Route>

      {/* Redirect any unknown routes to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;