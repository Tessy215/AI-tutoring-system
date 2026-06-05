import { Users, BookOpen, FileText, CheckSquare } from "lucide-react";
import { useAuth } from "../../Contexts/AuthContext.jsx";

const stats = [
  { label: "Total Students", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Materials Uploaded", value: "0", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Assignments Created", value: "0", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Submissions to Grade", value: "0", icon: CheckSquare, color: "text-green-600", bg: "bg-green-50" },
];

export default function LecturerDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.name || "Lecturer"} 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's your teaching overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="p-4 bg-indigo-50 rounded-xl text-indigo-600 font-medium hover:bg-indigo-100 transition-colors flex items-center gap-3">
            <BookOpen className="w-5 h-5" />
            Upload Material
          </button>
          <button className="p-4 bg-purple-50 rounded-xl text-purple-600 font-medium hover:bg-purple-100 transition-colors flex items-center gap-3">
            <FileText className="w-5 h-5" />
            Create Assignment
          </button>
          <button className="p-4 bg-green-50 rounded-xl text-green-600 font-medium hover:bg-green-100 transition-colors flex items-center gap-3">
            <Users className="w-5 h-5" />
            View Students
          </button>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Recent Submissions</h2>
        <p className="text-gray-500 text-sm">No submissions yet. Lecturer features coming soon!</p>
      </div>
    </div>
  );
}