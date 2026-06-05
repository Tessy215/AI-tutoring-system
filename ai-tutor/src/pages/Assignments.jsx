import { useState, useEffect } from "react";
import { Calendar, CheckCircle, Clock, AlertCircle, Eye, Plus, X, Save } from "lucide-react";
import { databases, ID } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../lib/config";
import { useAuth } from "../Contexts/AuthContext";
import { Query } from "appwrite";

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    subject: "",
    dueDate: "",
    status: "not-started",
    progress: 0,
    description: "",
  });

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        [Query.equal("userId", user.$id)]
      );
      setAssignments(response.documents);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAssignment = async () => {
    if (newAssignment.title && newAssignment.subject) {
      try {
        const assignment = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ASSIGNMENTS,
          ID.unique(),
          {
            userId: user.$id,
            title: newAssignment.title,
            subject: newAssignment.subject,
            dueDate: newAssignment.dueDate,
            status: newAssignment.status,
            progress: Number(newAssignment.progress),
            description: newAssignment.description,
          }
        );
        setAssignments([...assignments, assignment]);
        setNewAssignment({
          title: "",
          subject: "",
          dueDate: "",
          status: "not-started",
          progress: 0,
          description: "",
        });
        setShowAddForm(false);
      } catch (error) {
        console.error("Error adding assignment:", error);
      }
    }
  };

  const saveEdit = async () => {
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        editingAssignment.$id,
        {
          title: editingAssignment.title,
          subject: editingAssignment.subject,
          dueDate: editingAssignment.dueDate,
          status: editingAssignment.status,
          progress: Number(editingAssignment.progress),
          description: editingAssignment.description,
        }
      );
      setAssignments(assignments.map(a => a.$id === editingAssignment.$id ? updated : a));
      setEditingAssignment(null);
    } catch (error) {
      console.error("Error editing assignment:", error);
    }
  };

  const deleteAssignment = async (id) => {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ASSIGNMENTS, id);
      setAssignments(assignments.filter(a => a.$id !== id));
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "in-progress":
        return { text: "In Progress", color: "bg-blue-100 text-blue-600", icon: Clock };
      case "overdue":
        return { text: "Overdue", color: "bg-red-100 text-red-600", icon: AlertCircle };
      case "not-started":
        return { text: "Not Started", color: "bg-gray-100 text-gray-600", icon: Clock };
      case "graded":
        return { text: "Graded", color: "bg-green-100 text-green-600", icon: CheckCircle };
      default:
        return { text: status, color: "bg-gray-100 text-gray-600", icon: Clock };
    }
  };

  const activeAssignments = assignments.filter((a) => a.status !== "graded");
  const gradedAssignments = assignments.filter((a) => a.status === "graded");

  const FormFields = ({ data, onChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <input
        placeholder="Assignment title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        placeholder="Subject"
        value={data.subject}
        onChange={(e) => onChange({ ...data, subject: e.target.value })}
        className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="date"
        value={data.dueDate}
        onChange={(e) => onChange({ ...data, dueDate: e.target.value })}
        className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <select
        value={data.status}
        onChange={(e) => onChange({ ...data, status: e.target.value })}
        className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="not-started">Not Started</option>
        <option value="in-progress">In Progress</option>
        <option value="overdue">Overdue</option>
        <option value="graded">Graded</option>
      </select>
      <input
        type="number"
        placeholder="Progress (0-100)"
        min="0"
        max="100"
        value={data.progress}
        onChange={(e) => onChange({ ...data, progress: e.target.value })}
        className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        placeholder="Description"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Track and manage your course assignments</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add Assignment
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border mb-6">
          <h3 className="font-semibold mb-4">Add New Assignment</h3>
          <FormFields data={newAssignment} onChange={setNewAssignment} />
          <div className="flex gap-2">
            <button onClick={addAssignment} className="px-4 py-2 bg-indigo-600 text-white rounded">
              Add
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingAssignment && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200 mb-6">
          <h3 className="font-semibold mb-4">Edit Assignment</h3>
          <FormFields data={editingAssignment} onChange={setEditingAssignment} />
          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded">
              <Save className="w-4 h-4" />
              Save
            </button>
            <button onClick={() => setEditingAssignment(null)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading assignments...</div>
      ) : (
        <>
          {/* Active Assignments */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Assignments ({activeAssignments.length})
            </h2>
            {activeAssignments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active assignments yet!</p>
            ) : (
              <div className="space-y-4">
                {activeAssignments.map((assignment) => {
                  const badge = getStatusBadge(assignment.status);
                  const StatusIcon = badge.icon;
                  return (
                    <div
                      key={assignment.$id}
                      className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                              {assignment.subject}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              Due: {assignment.dueDate}
                            </span>
                            <span className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${badge.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {badge.text}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingAssignment(assignment)}
                            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteAssignment(assignment.$id)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {assignment.progress > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-900 font-medium">{assignment.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                assignment.status === "overdue" ? "bg-red-600" : "bg-indigo-600"
                              }`}
                              style={{ width: `${assignment.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Graded Assignments */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Graded Assignments ({gradedAssignments.length})
            </h2>
            {gradedAssignments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No graded assignments yet!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gradedAssignments.map((assignment) => (
                  <div key={assignment.$id} className="bg-white p-5 rounded-xl border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {assignment.subject}
                        </span>
                      </div>
                      <div className="text-right ml-2">
                        <div className={`text-2xl font-bold ${
                          assignment.grade >= 90 ? "text-green-600" :
                          assignment.grade >= 80 ? "text-blue-600" :
                          assignment.grade >= 70 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {assignment.grade ? `${assignment.grade}%` : "N/A"}
                        </div>
                        <p className="text-xs text-gray-500">Grade</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Submitted: {assignment.dueDate}
                      </span>
                      <button
                        onClick={() => setEditingAssignment(assignment)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}