import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Home, CheckSquare, Lightbulb, BookOpen, TrendingUp, User, LogOut } from "lucide-react";

import { useAuth } from "./contexts/AuthContext";

const navigation = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Recommendations", path: "/recommendations", icon: Lightbulb },
  { name: "Assignments", path: "/assignments", icon: BookOpen },
  { name: "Progress", path: "/progress", icon: TrendingUp },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  // CHANGED: added user and logout from AuthContext to display user info and handle logout
  const { user ,logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600">AI Tutor</h1>
          <p className="text-sm text-gray-500">Learning System</p>
        </div>

        <nav className="flex-1 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
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

        <div className="p-4 border-t border-gray-200 space-y-2">
          {/* //profile link */}
          <Link
            to="/profile"
            className={`flex item-center gap-3 px-4 py-3 rounded-lg w-full ${
              location.pathname === "/profile"
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
              <p className="text-xs text-gray-500 truncate">{user?.grade || "Not set"}</p>
            </div>
            <User className="w-4 h-4 shrink-0"/>
          </Link>

          {/* logout button */}
          <button
            onClick={ () =>{
              console.log("Button clicked");
              console.log("user in storage:", localStorage.getItem("user"));
              handleLogout();
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium"> Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}