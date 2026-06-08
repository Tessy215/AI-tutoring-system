import { useState, useEffect } from "react";
import { useAuth } from "../../Contexts/AuthContext.jsx";
import { databases } from "../../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../../lib/config";
import { Users, FileText, BookOpen, CheckSquare, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: { total: 0, students: 0, lecturers: 0 },
    assignments: { total: 0, graded: 0, pendingGrading: 0 },
    resources: { total: 0 },
    tasks: { total: 0, completed: 0 },
    recentAssignments: [],
    recentTasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load users
      const usersRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
      const students = usersRes.documents.filter(u => u.role === "student");
      const lecturers = usersRes.documents.filter(u => u.role === "lecturer");
      
      // Load assignments
      const assignmentsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSIGNMENTS);
      
      // Load resources
      const resourcesRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES);
      
      // Load tasks
      const tasksRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TASKS);
      
      setStats({
        users: {
          total: usersRes.total,
          students: students.length,
          lecturers: lecturers.length
        },
        assignments: {
          total: assignmentsRes.total,
          graded: assignmentsRes.documents.filter(a => a.status === "graded").length,
          pendingGrading: assignmentsRes.documents.filter(a => a.status === "submitted").length
        },
        resources: { total: resourcesRes.total },
        tasks: {
          total: tasksRes.total,
          completed: tasksRes.documents.filter(t => t.completed === true).length
        },
        recentAssignments: assignmentsRes.documents.slice(0, 5),
        recentTasks: tasksRes.documents.slice(0, 5),
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.total}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full"><Users className="w-6 h-6 text-indigo-600" /></div>
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-green-600">{stats.users.students} Students</span>
            <span className="text-blue-600">{stats.users.lecturers} Lecturers</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignments.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full"><FileText className="w-6 h-6 text-blue-600" /></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">{stats.assignments.graded} graded, {stats.assignments.pendingGrading} pending</div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resources</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resources.total}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full"><BookOpen className="w-6 h-6 text-green-600" /></div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tasks.total}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full"><CheckSquare className="w-6 h-6 text-yellow-600" /></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">{stats.tasks.completed} completed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Recent Assignments</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentAssignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No assignments</div>
            ) : (
              stats.recentAssignments.map((assignment) => (
                <div key={assignment.$id} className="p-3">
                  <p className="font-medium text-gray-900">{assignment.title}</p>
                  <p className="text-sm text-gray-500">{assignment.subject} • {assignment.status || "pending"}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tasks</div>
            ) : (
              stats.recentTasks.map((task) => (
                <div key={task.$id} className="p-3">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-500">Status: {task.completed ? "Completed" : "Pending"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}