import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { databases } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../lib/config";
import { Query } from "appwrite";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import {
  TrendingUp, Users, FileText, BookOpen, CheckSquare,
  Calendar, Activity, Award, Clock, Download, Filter
} from "lucide-react";

export default function AdminAnalytics() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    assignmentTrends: [],
    subjectDistribution: [],
    topPerformers: [],
    activityHeatmap: [],
    systemHealth: {
      totalUsers: 0,
      totalAssignments: 0,
      totalResources: 0,
      totalTasks: 0,
      avgGrade: 0,
      completionRate: 0,
      activeUsers: 0,
    }
  });

  // Redirect if not admin
  if (userProfile?.role !== "admin") {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">Admin analytics are only available for administrators.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load all users
      const usersRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
      const students = usersRes.documents.filter(u => u.role === "student");
      const lecturers = usersRes.documents.filter(u => u.role === "lecturer");
      
      // Load assignments
      const assignmentsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSIGNMENTS);
      const gradedAssignments = assignmentsRes.documents.filter(a => a.grade !== null);
      const avgGrade = gradedAssignments.length > 0
        ? gradedAssignments.reduce((sum, a) => sum + a.grade, 0) / gradedAssignments.length
        : 0;
      
      // Calculate completion rate
      const tasksRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TASKS);
      const completedTasks = tasksRes.documents.filter(t => t.completed === true).length;
      const completionRate = tasksRes.total > 0 ? (completedTasks / tasksRes.total) * 100 : 0;
      
      // Calculate active users (users who have submitted assignments or tasks in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = usersRes.documents.filter(user => {
        const userTasks = tasksRes.documents.filter(t => t.userId === user.userId && new Date(t.$createdAt) > thirtyDaysAgo);
        const userAssignments = assignmentsRes.documents.filter(a => a.userId === user.userId && new Date(a.$createdAt) > thirtyDaysAgo);
        return userTasks.length > 0 || userAssignments.length > 0;
      }).length;
      
      // Generate user growth data (last 6 months)
      const userGrowth = [];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const monthName = months[month.getMonth()];
        const usersInMonth = usersRes.documents.filter(u => {
          const createdAt = new Date(u.$createdAt);
          return createdAt.getMonth() === month.getMonth() && createdAt.getFullYear() === month.getFullYear();
        }).length;
        userGrowth.push({ month: monthName, users: usersInMonth });
      }
      
      // Subject distribution
      const subjectCount = {};
      assignmentsRes.documents.forEach(a => {
        if (a.subject) {
          subjectCount[a.subject] = (subjectCount[a.subject] || 0) + 1;
        }
      });
      const subjectDistribution = Object.entries(subjectCount).map(([name, value]) => ({ name, value })).slice(0, 6);
      
      // Top performing students
      const studentPerformance = {};
      students.forEach(student => {
        const studentAssignments = assignmentsRes.documents.filter(a => a.userId === student.userId && a.grade !== null);
        if (studentAssignments.length > 0) {
          const avg = studentAssignments.reduce((sum, a) => sum + a.grade, 0) / studentAssignments.length;
          studentPerformance[student.name] = avg;
        }
      });
      const topPerformers = Object.entries(studentPerformance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, avg]) => ({ name, average: Math.round(avg) }));
      
      // Assignment trends (last 7 days)
      const assignmentTrends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        const assignmentsOnDay = assignmentsRes.documents.filter(a => {
          const createdAt = new Date(a.$createdAt);
          return createdAt.toDateString() === date.toDateString();
        }).length;
        assignmentTrends.push({ day: dateStr, assignments: assignmentsOnDay });
      }
      
      setAnalytics({
        userGrowth,
        assignmentTrends,
        subjectDistribution,
        topPerformers,
        activityHeatmap: [],
        systemHealth: {
          totalUsers: usersRes.total,
          totalAssignments: assignmentsRes.total,
          totalResources: 0,
          totalTasks: tasksRes.total,
          avgGrade: Math.round(avgGrade),
          completionRate: Math.round(completionRate),
          activeUsers: activeUsers,
        }
      });
      
      // Load resources count separately
      const resourcesRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES);
      setAnalytics(prev => ({
        ...prev,
        systemHealth: {
          ...prev.systemHealth,
          totalResources: resourcesRes.total
        }
      }));
      
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
            <p className="text-gray-600 mt-1">System-wide analytics and performance insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.systemHealth.totalUsers}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full"><Users className="w-6 h-6 text-indigo-600" /></div>
          </div>
          <p className="text-xs text-green-600 mt-2">{analytics.systemHealth.activeUsers} active this month</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.systemHealth.totalAssignments}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full"><FileText className="w-6 h-6 text-blue-600" /></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Avg Grade: {analytics.systemHealth.avgGrade}%</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resources</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.systemHealth.totalResources}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full"><BookOpen className="w-6 h-6 text-green-600" /></div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.systemHealth.totalTasks}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full"><CheckSquare className="w-6 h-6 text-yellow-600" /></div>
          </div>
          <p className="text-xs text-green-600 mt-2">{analytics.systemHealth.completionRate}% completion rate</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Growth Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            User Growth (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Assignment Trends */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Assignment Trends (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.assignmentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="assignments" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Assignment Distribution by Subject
          </h3>
          {analytics.subjectDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.subjectDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.subjectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            Top Performing Students
          </h3>
          {analytics.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {analytics.topPerformers.map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-sm">{idx + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${student.average}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{student.average}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No graded assignments yet</div>
          )}
        </div>
      </div>

      {/* Platform Overview */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Platform Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-2xl font-bold text-indigo-600">{Math.round((analytics.systemHealth.activeUsers / analytics.systemHealth.totalUsers) * 100)}%</p>
            <p className="text-sm text-gray-600">User Engagement Rate</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-2xl font-bold text-indigo-600">{analytics.systemHealth.avgGrade}%</p>
            <p className="text-sm text-gray-600">Average Grade Across Platform</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-2xl font-bold text-indigo-600">{analytics.systemHealth.completionRate}%</p>
            <p className="text-sm text-gray-600">Task Completion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}