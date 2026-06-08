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

  function RoleRoute({ children, allowedRoles }) {
    const { userProfile} = useAuth();

    if (!userProfile) return null; // or a loading state

    if (!allowedRoles.includes(userProfile.role)) {
      return <Navigate to="/" replace />;
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
      <Route path="/onboarding/select-field" element={<ProtectedRoute><SelectField/></ProtectedRoute>} />
      <Route path="/onboarding/select-courses" element={<ProtectedRoute><SelectCourses/></ProtectedRoute>} />
      <Route path="/onboarding/select-goals" element={<ProtectedRoute><SelectGoal/></ProtectedRoute>} />

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
        <Route path="resources" element={<Resources />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="progress" element={<Progress />} />
        <Route path="profile" element={<Profile />} />
        <Route path="students" element={<StudentsPage />} />
      </Route>

      {/* redirect any unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;