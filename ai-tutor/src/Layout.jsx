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
  {name: "Announcements", path: "/dashboard/announcements", icon: Bot},
  {name: "Settings", path: "/dashboard/settings", icon: CheckSquare},
]

const adminNavigation = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "System Logs", path: "/dashboard/logs", icon: Lightbulb },
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
  <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    {/* Desktop Top Bar */}
    <div className="hidden md:flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 items-center justify-between px-6 fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">AI Tutor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 hidden lg:block">
          Learning Management System
        </p>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="text-sm hidden sm:block">
            <p className="font-medium text-gray-900 dark:text-white">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {userProfile?.role || "student"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/profile")}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Profile"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    {/* Mobile top bar */}
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 flex items-center justify-between px-4 py-3">
      <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">AI Tutor</h1>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-700 dark:text-gray-300"
        >
          {isSidebarOpen ? <X /> : <Menu />}
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
    <aside
      className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 transition-transform duration-300
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      md:translate-x-0 md:top-16 md:h-[calc(100vh-4rem)]
    `}
    >
      <div className="p-6 mt-12 md:hidden">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">AI Tutor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Learning System</p>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto mt-4">
        {navigation.map(item => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 md:hidden">
        <Link
          to="/dashboard/profile"
          onClick={() => setIsSidebarOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full ${
            location.pathname === "/dashboard/profile"
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
              {user?.name || "user"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
              {userProfile?.role || "student"}
            </p>
          </div>
          <User className="w-4 h-4 shrink-0 text-gray-600 dark:text-gray-400" />
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
)
}