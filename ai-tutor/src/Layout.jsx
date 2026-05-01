import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, CheckSquare, Lightbulb, BookOpen, TrendingUp } from "lucide-react";

const navigation = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Recommendations", path: "/recommendations", icon: Lightbulb },
  { name: "Assignments", path: "/assignments", icon: BookOpen },
  { name: "Progress", path: "/progress", icon: TrendingUp },
];

export default function Layout() {
  const location = useLocation();

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

        <div className="p-4 border-t">
          <p className="font-medium">Jane Student</p>
          <p className="text-xs text-gray-500">Grade 10</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}