import { useState, useEffect } from "react";
import { useAuth } from "../../Contexts/AuthContext.jsx";
import { databases } from "../../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../../lib/config";
import { Query } from "appwrite";
import { Users, FileText, Clock, BookOpen, Plus, Upload, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LecturerDashboard() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    students: { total: 0 },
    assignments: { total: 0, pendingGrading: 0 },
    resources: { total: 0 },
    recentAssignments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load students
      const studentsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal("role", "student")]
      );
      
      // Load assignments created by this lecturer
      const assignmentsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        [Query.equal("userId", user.$id)]
      );
      
      // Load resources - check BOTH userId and createdBy
      const resourcesRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        [
          Query.or([
            Query.equal("userId", user.$id),
            Query.equal("createdBy", user.$id)
          ])
        ]
      );
      
      const pendingGrading = assignmentsRes.documents.filter(a => a.status === "submitted").length;
      
      setStats({
        students: { total: studentsRes.total },
        assignments: {
          total: assignmentsRes.total,
          pendingGrading: pendingGrading
        },
        resources: { total: resourcesRes.total },
        recentAssignments: assignmentsRes.documents.slice(0, 5),
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
        <h1 className="text-3xl font-bold text-gray-900">Lecturer Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor your courses and student progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.students.total}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full"><Users className="w-6 h-6 text-indigo-600" /></div>
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
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resources</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resources.total}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full"><BookOpen className="w-6 h-6 text-green-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-3">
            <Link to="/assignments" className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              <div className="p-2 bg-indigo-100 rounded-lg"><Plus className="w-5 h-5 text-indigo-600" /></div>
              <div><p className="font-medium text-gray-900">Create Assignment</p><p className="text-sm text-gray-500">Create new assignment or quiz</p></div>
            </Link>
            <Link to="/resources" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="p-2 bg-green-100 rounded-lg"><Upload className="w-5 h-5 text-green-600" /></div>
              <div><p className="font-medium text-gray-900">Upload Resource</p><p className="text-sm text-gray-500">Share learning materials with students</p></div>
            </Link>
            <Link to="/students" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="p-2 bg-purple-100 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
              <div><p className="font-medium text-gray-900">View Students</p><p className="text-sm text-gray-500">Monitor student progress and grades</p></div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Assignments</h3>
            <Link to="/assignments" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">View All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentAssignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No assignments created yet.</div>
            ) : (
              stats.recentAssignments.map((assignment) => (
                <div key={assignment.$id} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900">{assignment.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      assignment.status === "graded" ? "bg-green-100 text-green-700" : 
                      assignment.status === "submitted" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{assignment.status || "pending"}</span>
                  </div>
                  <p className="text-sm text-gray-500">{assignment.subject}</p>
                  <div className="mt-2 flex gap-2 text-xs text-gray-400">
                    {assignment.dueDate && <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                    {assignment.type && <span>Type: {assignment.type}</span>}
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