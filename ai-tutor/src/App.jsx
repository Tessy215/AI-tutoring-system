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
import SelectInterests from "./pages/onboarding/SelectInterest";
import SelectGoals from "./pages/onboarding/SelectGoal";
import Profile from "./pages/Profile";


import { useAuth } from "./Contexts/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
  }

function App() {
  return (
    <Routes>
      {/* public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* onboarding routes are protected but don't require auth since they are part of the onboarding flow right after registration */}
      <Route path="/onboarding/welcome" element={<ProtectedRoute><Welcome/></ProtectedRoute>} />
      <Route path="/onboarding/select-interests" element={<ProtectedRoute><SelectInterests/></ProtectedRoute>} />
      <Route path="/onboarding/select-goals" element={<ProtectedRoute><SelectGoals/></ProtectedRoute>} />

      {/* protected app routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="progress" element={<Progress />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* redirect any unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;