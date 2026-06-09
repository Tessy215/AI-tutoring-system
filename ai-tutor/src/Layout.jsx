import {useState} from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Menu, X, Home, CheckSquare, Lightbulb, BookOpen, TrendingUp, User, LogOut, Bot } from "lucide-react";
import NotificationBell from "./components/NotificationBell.jsx";

import { useAuth } from "./Contexts/AuthContext.jsx";

const studentNavigation = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "Tasks", path: "/dashboard/tasks", icon: CheckSquare },
  { name: "Resources", path: "/dashboard/resources", icon: BookOpen },
  { name: "AI Assistant", path: "/dashboard/ai-assistant", icon: Lightbulb },
  { name: "Recommendations", path: "/dashboard/recommendations", icon: Lightbulb },
  { name: "Assignments", path: "/dashboard/assignments", icon: BookOpen },
  { name: "Progress", path: "/dashboard/progress", icon: TrendingUp },
  { name: "Settings", path: "/dashboard/settings", icon: CheckSquare }
];

const lecturerNavigation = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  {name: "Resources", path: "/dashboard/resources", icon: BookOpen},
  {name: "Assignments", path: "/dashboard/assignments", icon: CheckSquare},
  {name: "Students", path: "/dashboard/students", icon: User},
  {name: "Settings", path: "/dashboard/settings", icon: CheckSquare},
]

const adminNavigation = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "System Logs", path: "/dashboard/logs", icon: Lightbulb },
  { name: "Manage Content", path: "/dashboard/content", icon: BookOpen },
  { name: "Analytics", path: "/dashboard/analytics", icon: TrendingUp },
  { name: "Materials", path: "/dashboard/materials", icon: BookOpen },
  {name: "Users", path: "/dashboard/users", icon: User},
  {name: "Settings", path: "/dashboard/settings", icon: CheckSquare},
]

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user , userProfile, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  }

  const navigation = 
    userProfile?.role === "lecturer" ? lecturerNavigation :
    userProfile?.role === "admin" ? adminNavigation :
    studentNavigation;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Desktop Top Bar */}
      <div className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-6 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-indigo-600">AI Tutor</h1>
          <p className="text-sm text-gray-500 hidden lg:block">Learning Management System</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="text-sm hidden sm:block">
              <p className="font-medium text-gray-900">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500 capitalize">{userProfile?.role || "student"}</p>
            </div>
            <button 
              onClick={() => navigate("/dashboard/profile")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Profile"
            >
              <User className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-indigo-600">AI Tutor</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X/> : <Menu/>}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white border-r flex flex-col z-40 transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:top-16 md:h-[calc(100vh-4rem)]
      `}>
        {/* Sidebar header - hidden on desktop since top bar has logo */}
        <div className="p-6 mt-12 md:hidden">
          <h1 className="text-2xl font-bold text-indigo-600">AI Tutor</h1>
          <p className="text-sm text-gray-500">Learning System</p>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile only sidebar footer */}
        <div className="p-4 border-t border-gray-200 space-y-2 md:hidden">
          <Link
            to="/dashboard/profile"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full ${
              location.pathname === "/dashboard/profile"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0"> 
              <p className="font-medium text-sm truncate">{user?.name || "user"}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{userProfile?.role || "student"}</p>
            </div>
            <User className="w-4 h-4 shrink-0"/>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pl-64 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}