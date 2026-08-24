/* eslint-disable */
import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { databases } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../lib/config";
import { Query } from "appwrite";
import {
  Users, Search, Filter, User, Mail, Shield, 
  Edit2, Trash2, X, Save, ChevronRight, Eye,
  CheckCircle, AlertCircle, Calendar, BookOpen, Target,
  Award, Clock, Activity, FileText, CheckSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "../components/Skeleton.jsx";
import { TableSkeleton } from "../components/LoadingSkeleton.jsx";

export default function AdminUsers() {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "student",
    field: "",
    grade: "",
  });
  const [userActivity, setUserActivity] = useState({
    tasks: 0,
    assignments: 0,
    resources: 0,
    completedTasks: 0,
    gradedAssignments: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Redirect if not admin
  if (userProfile?.role !== "admin") {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">This page is only available for administrators.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.orderDesc("$createdAt")]
      );
      setUsers(response.documents);
      setFilteredUsers(response.documents);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async (userId) => {
    setLoadingActivity(true);
    try {
      // Load tasks for this user
      const tasksRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        [Query.equal("userId", userId)]
      );
      
      // Load assignments for this user
      const assignmentsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        [
          Query.or([
            Query.equal("userId", userId),
            Query.equal("assignedTo", "all")
          ])
        ]
      );
      
      // Load resources for this user
      const resourcesRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        [Query.equal("userId", userId)]
      );
      
      const completedTasks = tasksRes.documents.filter(t => t.completed === true).length;
      const gradedAssignments = assignmentsRes.documents.filter(a => a.grade !== null).length;
      
      setUserActivity({
        tasks: tasksRes.total,
        assignments: assignmentsRes.total,
        resources: resourcesRes.total,
        completedTasks: completedTasks,
        gradedAssignments: gradedAssignments,
      });
    } catch (error) {
      console.error("Error loading user activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...users];
    
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, roleFilter, users]);

  const openViewModal = async (userData) => {
    setSelectedUser(userData);
    setShowViewModal(true);
    await loadUserActivity(userData.userId);
  };

  const openEditModal = (userData) => {
    setSelectedUser(userData);
    setEditForm({
      name: userData.name || "",
      email: userData.email || "",
      role: userData.role || "student",
      field: userData.field || "",
      grade: userData.grade || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (userData) => {
    setSelectedUser(userData);
    setDeleteConfirm("");
    setShowDeleteModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setIsSaving(true);
    try {
      // Don't allow changing your own role to non-admin
      if (selectedUser.userId === user.$id && editForm.role !== "admin") {
        alert("You cannot remove your own admin privileges!");
        setIsSaving(false);
        return;
      }
      
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        selectedUser.$id,
        {
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          field: editForm.field,
          grade: editForm.grade,
        }
      );
      
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (deleteConfirm !== selectedUser.name) {
      alert(`Type "${selectedUser.name}" to confirm deletion`);
      return;
    }
    
    if (selectedUser.userId === user.$id) {
      alert("You cannot delete your own account!");
      return;
    }
    
    setIsSaving(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        selectedUser.$id
      );
      
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case "admin":
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Admin</span>;
      case "lecturer":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Lecturer</span>;
      case "student":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Student</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{role}</span>;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case "admin": return "text-purple-600";
      case "lecturer": return "text-blue-600";
      case "student": return "text-green-600";
      default: return "text-gray-600";
    }
  };

 if (loading) {
   return (
     <div className="p-6">
       <Skeleton className="h-8 w-48 mb-4" />
       <Skeleton className="h-10 w-full mb-6" />
       <TableSkeleton
         rows={5}
         cols={5}
       />
     </div>
   )
 }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-1">Manage all users in the system</p>
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="lecturer">Lecturers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">User</th>
                <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                <th className="text-left p-4 font-semibold text-gray-700">Field</th>
                <th className="text-left p-4 font-semibold text-gray-700">Member Since</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userData) => {
                  const isCurrentUser = userData.userId === user.$id;
                  
                  return (
                    <tr key={userData.$id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {userData.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {userData.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">You</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{userData.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(userData.role)}
                      </td>
                      <td className="p-4">
                        <span className="capitalize">{userData.field || "Not set"}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-500">
                          {userData.$createdAt
                            ? new Date(userData.$createdAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {/* View Button */}
                          <button
                            onClick={() => openViewModal(userData)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View User Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(userData)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {/* Delete Button - Hide for current user */}
                          {!isCurrentUser && (
                            <button
                              onClick={() => openDeleteModal(userData)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== VIEW USER MODAL ===== */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-lg">
                    {selectedUser.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Section 1 - Account Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Account Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="font-medium">{getRoleBadge(selectedUser.role)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Field of Study</p>
                    <p className="font-medium capitalize">{selectedUser.field || "Not set"}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Level/Year</p>
                    <p className="font-medium">{selectedUser.grade || "Not set"}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="font-medium">
                      {selectedUser.$createdAt
                        ? new Date(selectedUser.$createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2 - Learning Profile */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Learning Profile</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Courses</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.courses?.length > 0 ? (
                        selectedUser.courses.map((course, idx) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs capitalize">
                            {course.replace(/-/g, " ")}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No courses</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Learning Goals</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.goals?.length > 0 ? (
                        selectedUser.goals.map((goal, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs capitalize">
                            {goal.replace(/-/g, " ")}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No goals</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3 - Activity Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Activity Summary</h3>
                {loadingActivity ? (
                  <div className="text-center py-4 text-gray-500">Loading activity...</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{userActivity.tasks}</p>
                      <p className="text-xs text-gray-500">Tasks</p>
                      <p className="text-xs text-green-600">{userActivity.completedTasks} completed</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{userActivity.assignments}</p>
                      <p className="text-xs text-gray-500">Assignments</p>
                      <p className="text-xs text-indigo-600">{userActivity.gradedAssignments} graded</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">{userActivity.resources}</p>
                      <p className="text-xs text-gray-500">Resources</p>
                      <p className="text-xs text-gray-400">{selectedUser.role === "lecturer" ? "Uploaded" : "Accessed"}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-600">{selectedUser.role === "lecturer" ? "📚" : "📝"}</p>
                      <p className="text-xs text-gray-500">Account Type</p>
                      <p className="text-xs font-medium capitalize">{selectedUser.role}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT USER MODAL ===== */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
                {selectedUser.userId === user.$id && editForm.role !== "admin" && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ You are about to remove your own admin privileges.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                <input
                  type="text"
                  value={editForm.field}
                  onChange={(e) => setEditForm({...editForm, field: e.target.value})}
                  placeholder="e.g., Computing, Business"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level/Year</label>
                <input
                  type="text"
                  value={editForm.grade}
                  onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                  placeholder="e.g., Year 2, Grade 10"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE USER MODAL ===== */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-red-600">Delete User</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ You are about to delete <strong>{selectedUser.name}</strong>.
                  This action is permanent and cannot be undone.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="font-mono bg-gray-100 px-1">{selectedUser.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type the user's name..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isSaving || deleteConfirm !== selectedUser.name}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSaving ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}