import { useAuth } from "../Contexts/AuthContext.jsx";
import StudentDashboard from "./dashboards/StudentDashboard";
import LecturerDashboard from "./dashboards/LecturerDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

export default function Dashboard() {
  const { userProfile } = useAuth();

  if (userProfile?.role === "lecturer") {
    return <LecturerDashboard />;
  }

  if (userProfile?.role === "admin") {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
}