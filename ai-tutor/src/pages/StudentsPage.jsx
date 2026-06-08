import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { databases } from "../lib/appwrite.js";
import { DATABASE_ID, COLLECTIONS } from "../lib/config.js";
import { Query } from "appwrite";
import { 
  Search, Filter, User, BookOpen, Award, TrendingUp, 
  Eye, X, Calendar, CheckCircle, Clock, BarChart3,
  Mail, GraduationCap, Target, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentsPage() {
  const { user, userProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedField, setSelectedField] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [fields, setFields] = useState([]);

  // Redirect if not lecturer or admin
  if (userProfile?.role !== "lecturer" && userProfile?.role !== "admin") {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">This page is only available for lecturers and admins.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Load all students
      const studentsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal("role", "student")]
      );
      
      setStudents(studentsRes.documents);
      setFilteredStudents(studentsRes.documents);
      
      // Extract unique fields for filter
      const uniqueFields = [...new Set(studentsRes.documents.map(s => s.field).filter(Boolean))];
      setFields(uniqueFields);
      
      // Load progress for each student
      for (const student of studentsRes.documents) {
        await loadStudentProgress(student.$id);
      }
      
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentProgress = async (studentId) => {
    try {
      // Load assignments for this student
      const assignmentsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        [
          Query.or([
            Query.equal("userId", studentId),
            Query.equal("assignedTo", "all")
          ])
        ]
      );
      
      const gradedAssignments = assignmentsRes.documents.filter(a => a.grade !== null);
      const avgGrade = gradedAssignments.length > 0 
        ? gradedAssignments.reduce((sum, a) => sum + a.grade, 0) / gradedAssignments.length 
        : 0;
      
      // Load tasks for this student
      const tasksRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        [Query.equal("userId", studentId)]
      );
      
      const completedTasks = tasksRes.documents.filter(t => t.completed === true).length;
      
      // Store progress in a map
      setStudentProgress(prev => ({
        ...prev,
        [studentId]: {
          avgGrade: Math.round(avgGrade),
          totalAssignments: assignmentsRes.total,
          gradedAssignments: gradedAssignments.length,
          totalTasks: tasksRes.total,
          completedTasks: completedTasks,
          assignments: assignmentsRes.documents.slice(0, 10)
        }
      }));
      
    } catch (error) {
      console.error(`Error loading progress for student ${studentId}:`, error);
    }
  };

  const handleSearch = () => {
    let filtered = [...students];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedField !== "all") {
      filtered = filtered.filter(s => s.field === selectedField);
    }
    
    setFilteredStudents(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, selectedField, students]);

  const viewStudentDetails = async (student) => {
    setSelectedStudent(student);
    
    // Load detailed progress if not already loaded
    if (!studentProgress?.[student.$id]) {
      await loadStudentProgress(student.$id);
    }
    
    setShowDetailModal(true);
  };

  const getGradeColor = (grade) => {
    if (grade >= 80) return "text-green-600";
    if (grade >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600 mt-1">Manage and monitor all students in your courses</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-full md:w-64 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="all">All Fields</option>
              {fields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Student</th>
                <th className="text-left p-4 font-semibold text-gray-700">Field of Study</th>
                <th className="text-left p-4 font-semibold text-gray-700">Courses</th>
                <th className="text-left p-4 font-semibold text-gray-700">Avg. Grade</th>
                <th className="text-left p-4 font-semibold text-gray-700">Tasks</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const progress = studentProgress?.[student.$id] || {
                    avgGrade: 0,
                    totalTasks: 0,
                    completedTasks: 0
                  };
                  
                  return (
                    <tr key={student.$id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {student.name?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="capitalize">{student.field || "Not set"}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {student.courses?.slice(0, 2).map((course, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                              {course.replace(/-/g, " ").slice(0, 15)}
                            </span>
                          ))}
                          {student.courses?.length > 2 && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                              +{student.courses.length - 2}
                            </span>
                          )}
                          {(!student.courses || student.courses.length === 0) && (
                            <span className="text-xs text-gray-400">No courses</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${getGradeColor(progress.avgGrade)}`}>
                          {progress.avgGrade}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{progress.completedTasks || 0}/{progress.totalTasks || 0}</span>
                          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${progress.totalTasks ? (progress.completedTasks / progress.totalTasks) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => viewStudentDetails(student)}
                          className="flex items-center gap-1 px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Progress
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-lg">
                    {selectedStudent.name?.charAt(0) || "S"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Field</p>
                  <p className="font-medium capitalize">{selectedStudent.field || "Not set"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Level/Year</p>
                  <p className="font-medium">{selectedStudent.grade || "Not set"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {selectedStudent.$createdAt 
                      ? new Date(selectedStudent.$createdAt).toLocaleDateString() 
                      : "Unknown"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Goals</p>
                  <p className="font-medium">{selectedStudent.goals?.length || 0} goals set</p>
                </div>
              </div>

              {/* Progress Stats */}
              {studentProgress?.[selectedStudent.$id] && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Average Grade</span>
                      </div>
                      <p className={`text-3xl font-bold ${getGradeColor(studentProgress[selectedStudent.$id].avgGrade)}`}>
                        {studentProgress[selectedStudent.$id].avgGrade}%
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Assignments</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">
                        {studentProgress[selectedStudent.$id].gradedAssignments}/{studentProgress[selectedStudent.$id].totalAssignments}
                      </p>
                      <p className="text-sm text-gray-500">graded</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">Tasks</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">
                        {studentProgress[selectedStudent.$id].completedTasks}/{studentProgress[selectedStudent.$id].totalTasks}
                      </p>
                      <p className="text-sm text-gray-500">completed</p>
                    </div>
                  </div>

                  {/* Recent Assignments */}
                  {studentProgress[selectedStudent.$id].assignments?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Recent Assignments</h3>
                      <div className="space-y-2">
                        {studentProgress[selectedStudent.$id].assignments.map((assignment) => (
                          <div key={assignment.$id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{assignment.title}</p>
                              <p className="text-sm text-gray-500">{assignment.subject}</p>
                            </div>
                            <div className="text-right">
                              {assignment.grade !== null ? (
                                <p className={`font-semibold ${getGradeColor(assignment.grade)}`}>
                                  {assignment.grade}%
                                </p>
                              ) : (
                                <p className="text-sm text-yellow-600">Pending</p>
                              )}
                              {assignment.dueDate && (
                                <p className="text-xs text-gray-400">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Courses */}
                  {selectedStudent.courses?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Enrolled Courses</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.courses.map((course, idx) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm capitalize">
                            {course.replace(/-/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {selectedStudent.goals?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Learning Goals</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.goals.map((goal, idx) => (
                          <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm capitalize">
                            {goal.replace(/-/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              <Link
                to={`/progress?student=${selectedStudent.$id}`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                View Full Progress
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}