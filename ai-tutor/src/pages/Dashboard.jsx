import { BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../Contexts/AuthContext.jsx";

const stats = [
  { label: "Tasks Completed", value: "24", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  { label: "Active Assignments", value: "8", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Study Hours", value: "32", icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Average Score", value: "87%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
];

const weeklyActivity = [
  { day: "Mon", hours: 3 },
  { day: "Tue", hours: 4 },
  { day: "Wed", hours: 2 },
  { day: "Thu", hours: 5 },
  { day: "Fri", hours: 3 },
  { day: "Sat", hours: 6 },
  { day: "Sun", hours: 4 },
];

const recentActivities = [
  { title: "Completed Math Assignment", subject: "Mathematics", time: "2 hours ago", status: "completed" },
  { title: "Started Physics Chapter 5", subject: "Physics", time: "4 hours ago", status: "in-progress" },
  { title: "Quiz on World History", subject: "History", time: "Yesterday", status: "completed" },
  { title: "Project Report Draft Submitted", subject: "English", time: "Yesterday", status: "submitted" },
];

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name || "User" } 👋</h1>
        <p className="text-gray-600 mt-1">Here's your learning overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Study Hours */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Study Hours</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Chemistry Lab Report</p>
                <p className="text-sm text-gray-600">Due in 2 days</p>
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">Urgent</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">CPS404 Assignment</p>
                <p className="text-sm text-gray-600">Due in 5 days</p>
              </div>
              <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">Soon</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Math Problem Set</p>
                <p className="text-sm text-gray-600">Due in 1 week</p>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Upcoming</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === "completed" ? "bg-green-500" :
                  activity.status === "submitted" ? "bg-blue-500" :
                  "bg-yellow-500"
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.subject}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
