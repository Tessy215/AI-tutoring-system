import { Users, BookOpen, Shield, Activity } from "lucide-react";
import { useAuth } from "../../Contexts/AuthContext.jsx";

const stats = [
  { label: "Total Users", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Total Students", value: "0", icon: Users, color: "text-green-600", bg: "bg-green-50" },
  { label: "Total Lecturers", value: "0", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "System Status", value: "Active", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Panel 🛡️
        </h1>
        <p className="text-gray-600 mt-1">Welcome, {user?.name || "Admin"}. Here's the system overview.</p>
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

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">System Management</h2>
        <p className="text-gray-500 text-sm">Admin features coming soon!</p>
      </div>
    </div>
  );
}