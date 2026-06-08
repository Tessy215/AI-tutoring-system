import { useState, useEffect } from "react";
import { useAuth } from "../../Contexts/AuthContext.jsx";
import { databases } from "../../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../../lib/config";
import { Query } from "appwrite";
import { CheckSquare, FileText, Award, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0 },
    assignments: { total: 0, graded: 0, pendingGrading: 0, averageGrade: 0 },
    recentTasks: [],
    recentAssignments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load tasks
      const tasksRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        [Query.equal("userId", user.$id)]
      );
      
      // Load assignments
      const assignmentsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        [
          Query.or([
            Query.equal("userId", user.$id),
            Query.equal("assignedTo", "all")
          ])
        ]
      );
      
      const gradedAssignments = assignmentsRes.documents.filter(a => a.grade !== null && a.grade !== undefined);
      const avgGrade = gradedAssignments.length > 0 
        ? gradedAssignments.reduce((sum, a) => sum + a.grade, 0) / gradedAssignments.length 
        : 0;
      
      setStats({
        tasks: {
          total: tasksRes.total,
          completed: tasksRes.documents.filter(t => t.completed === true).length
        },
        assignments: {
          total: assignmentsRes.total,
          graded: gradedAssignments.length,
          pendingGrading: assignmentsRes.documents.filter(a => a.status === "submitted").length,
          averageGrade: Math.round(avgGrade)
        },
        recentTasks: tasksRes.documents.slice(0, 5),
        recentAssignments: assignmentsRes.documents.slice(0, 5),
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    if (stats.tasks.total === 0) return 0;
    return Math.round((stats.tasks.completed / stats.tasks.total) * 100);
  };

  const getGradeColor = (grade) => {
    if (grade >= 80) return "text-green-600";
    if (grade >= 60) return "text-yellow-600";
    return "text-red-600";
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
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(" ")[0] || "Student"}! 👋</h1>
        <p className="text-gray-600 mt-1">Here's your learning progress summary</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tasks.total}</p>
              <p className="text-xs text-green-600 mt-1">{stats.tasks.completed} completed</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full"><CheckSquare className="w-6 h-6 text-indigo-600" /></div>
          </div>
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${getCompletionPercentage()}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignments.total}</p>
              <p className="text-xs text-green-600 mt-1">{stats.assignments.graded} graded</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full"><FileText className="w-6 h-6 text-blue-600" /></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Grade</p>
              <p className={`text-2xl font-bold ${getGradeColor(stats.assignments.averageGrade)}`}>
                {stats.assignments.averageGrade}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full"><Award className="w-6 h-6 text-green-600" /></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Grading</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.assignments.pendingGrading}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full"><Clock className="w-6 h-6 text-yellow-600" /></div>
          </div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
            <Link to="/tasks" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">View All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tasks yet. Create your first task!</div>
            ) : (
              stats.recentTasks.map((task) => (
                <div key={task.$id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${task.completed ? "bg-green-500" : "bg-yellow-500"}`}></div>
                    <span className={task.completed ? "line-through text-gray-400" : "text-gray-700"}>{task.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === "high" ? "bg-red-100 text-red-700" : 
                    task.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                  }`}>
                    {task.priority || "normal"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Assignments</h3>
            <Link to="/assignments" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">View All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentAssignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No assignments yet.</div>
            ) : (
              stats.recentAssignments.map((assignment) => (
                <div key={assignment.$id} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900">{assignment.title}</span>
                    {assignment.grade !== null && <span className={`text-sm font-semibold ${getGradeColor(assignment.grade)}`}>{assignment.grade}%</span>}
                  </div>
                  <p className="text-sm text-gray-500">{assignment.subject}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      assignment.status === "graded" ? "bg-green-100 text-green-700" : 
                      assignment.status === "submitted" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {assignment.status || "pending"}
                    </span>
                    {assignment.dueDate && <span className="text-xs text-gray-400">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}