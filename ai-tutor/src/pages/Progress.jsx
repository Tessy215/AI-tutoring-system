import { useState, useEffect } from "react";
import { 
  TrendingUp, BarChart3, LineChart as LineChartIcon, 
  Plus, Calendar, BookOpen, Award, Target, Clock,
  X, Save, Trash2, Edit2, Filter
} from "lucide-react";
import { databases, ID } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../lib/config";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { Query } from "appwrite";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from "recharts";

export default function Progress() {
  const { user, userProfile } = useAuth();
  const [progressData, setProgressData] = useState([]);
  const [assignmentsData, setAssignmentsData] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    score: "",
    date: new Date().toISOString().split("T")[0],
    type: "quiz",
    note: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Load data
  useEffect(() => {
    if (user && userProfile?.role === "student") {
      loadProgressData();
    }
  }, [user]);

  // Redirect if not student
  if (userProfile?.role !== "student") {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">
            Progress page is only available for students. 
            {userProfile?.role === "lecturer" && " Lecturers can view student progress from the Students page."}
          </p>
        </div>
      </div>
    );
  }

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // 1. Load assignments with grades
      const assignmentsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        [
          Query.equal("userId", user.$id),
          Query.isNotNull("grade"),
          Query.orderDesc("$createdAt")
        ]
      );
      
      const formattedAssignments = assignmentsResponse.documents.map(doc => ({
        id: doc.$id,
        subject: doc.subject,
        score: doc.grade,
        maxScore: doc.maxScore || 100,
        percentage: (doc.grade / (doc.maxScore || 100)) * 100,
        date: doc.submissionDate ? doc.submissionDate.split("T")[0] : doc.$createdAt.split("T")[0],
        type: "assignment",
        title: doc.title,
        source: "assignment",
        note: doc.feedback || ""
      }));
      
      setAssignmentsData(formattedAssignments);
      
      // 2. Load manual progress entries
      const progressResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROGRESS,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("date")
        ]
      );
      
      const formattedProgress = progressResponse.documents.map(doc => ({
        id: doc.$id,
        subject: doc.subject,
        score: doc.score,
        maxScore: 100,
        percentage: doc.score,
        date: doc.date || doc.$createdAt.split("T")[0],
        type: doc.type || "quiz",
        source: "manual",
        note: doc.note || "",
        title: `${doc.type || "Quiz"} - ${doc.subject}`
      }));
      
      setManualEntries(formattedProgress);
      
      // 3. Combine all data for charts
      const combined = [...formattedAssignments, ...formattedProgress];
      combined.sort((a, b) => new Date(a.date) - new Date(b.date));
      setProgressData(combined);
      
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualEntry = async () => {
    if (!formData.subject || !formData.score) {
      alert("Please fill in subject and score");
      return;
    }
    
    setIsSaving(true);
    try {
      const entryData = {
        userId: user.$id,
        subject: formData.subject,
        score: parseInt(formData.score),
        date: formData.date,
        type: formData.type,
        note: formData.note,
      };
      
      if (editingEntry) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PROGRESS,
          editingEntry.$id,
          entryData
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PROGRESS,
          ID.unique(),
          entryData
        );
      }
      
      resetModal();
      loadProgressData();
    } catch (error) {
      console.error("Error saving progress entry:", error);
      alert("Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId, source) => {
    if (source === "manual") {
      if (!confirm("Delete this progress entry?")) return;
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROGRESS, entryId);
        loadProgressData();
      } catch (error) {
        console.error("Error deleting entry:", error);
        alert("Failed to delete entry");
      }
    } else {
      alert("Assignment grades cannot be deleted from here. They are managed in the Assignments page.");
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingEntry(null);
    setFormData({
      subject: "",
      score: "",
      date: new Date().toISOString().split("T")[0],
      type: "quiz",
      note: "",
    });
  };

  const editManualEntry = (entry) => {
    setEditingEntry(entry);
    setFormData({
      subject: entry.subject,
      score: entry.score.toString(),
      date: entry.date,
      type: entry.type,
      note: entry.note || "",
    });
    setShowAddModal(true);
  };

  // Prepare data for charts
  const getUniqueSubjects = () => {
    const subjects = [...new Set(progressData.map(d => d.subject))];
    return subjects;
  };

  const getTrendData = () => {
    let filtered = [...progressData];
    if (subjectFilter !== "all") {
      filtered = filtered.filter(d => d.subject === subjectFilter);
    }
    return filtered.slice(-20).map(d => ({
      date: d.date,
      score: d.percentage.toFixed(0),
      name: d.title || d.subject,
      type: d.type
    }));
  };

  const getSubjectAverages = () => {
    const subjects = getUniqueSubjects();
    return subjects.map(subject => {
      const entries = progressData.filter(d => d.subject === subject);
      const avg = entries.reduce((sum, d) => sum + d.percentage, 0) / entries.length;
      return { subject, average: Math.round(avg), count: entries.length };
    }).filter(s => s.count > 0);
  };

  const getStats = () => {
    if (progressData.length === 0) return { total: 0, average: 0, best: 0, subjects: 0 };
    const total = progressData.length;
    const average = progressData.reduce((sum, d) => sum + d.percentage, 0) / total;
    const best = Math.max(...progressData.map(d => d.percentage));
    const subjects = getUniqueSubjects().length;
    return { total, average: Math.round(average), best: Math.round(best), subjects };
  };

  const stats = getStats();
  const trendData = getTrendData();
  const subjectAverages = getSubjectAverages();
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600 mt-1">Track your academic performance and grades</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Manual Entry
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg"><Award className="w-5 h-5 text-indigo-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Total Entries</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.average}%</p><p className="text-sm text-gray-500">Average Score</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Target className="w-5 h-5 text-yellow-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.best}%</p><p className="text-sm text-gray-500">Best Score</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><BookOpen className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.subjects}</p><p className="text-sm text-gray-500">Subjects</p></div>
          </div>
        </div>
      </div>

      {/* Subject Filter */}
      {getUniqueSubjects().length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Subjects</option>
            {getUniqueSubjects().map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Grade Trend Line Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-indigo-600" />
            Grade Trend Over Time
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
          )}
        </div>

        {/* Average per Subject Bar Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Average Score by Subject
          </h3>
          {subjectAverages.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="average" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
          )}
        </div>
      </div>

      {/* Progress Entries List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">All Progress Entries</h3>
          <p className="text-sm text-gray-500">
            {progressData.filter(d => d.source === "assignment").length} from assignments • {progressData.filter(d => d.source === "manual").length} manual entries
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {progressData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No progress data available. Complete assignments or add manual entries.</div>
          ) : (
            progressData.map((entry, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        entry.source === "assignment" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {entry.source === "assignment" ? "Assignment" : entry.type}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {entry.date}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">{entry.title || entry.subject}</p>
                    <p className="text-sm text-gray-600">{entry.subject}</p>
                    {entry.note && <p className="text-sm text-gray-500 mt-1">{entry.note}</p>}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${
                        entry.percentage >= 80 ? "text-green-600" : entry.percentage >= 60 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {entry.percentage}%
                      </span>
                      <span className="text-sm text-gray-500">/ {entry.maxScore}</span>
                      {entry.source === "manual" && (
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => editManualEntry(entry)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteEntry(entry.id, entry.source)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {entry.source === "assignment" && entry.score && (
                      <p className="text-xs text-gray-400 mt-1">Score: {entry.score}/{entry.maxScore}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">{editingEntry ? "Edit Entry" : "Add Manual Entry"}</h2>
              <button onClick={resetModal} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="e.g., Mathematics, Physics" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Score (%) *</label>
                <input type="number" min="0" max="100" value={formData.score} onChange={(e) => setFormData({...formData, score: e.target.value})} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded-lg">
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="homework">Homework</option>
                  <option value="project">Project</option>
                  <option value="paper">Paper Test</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                <textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} rows="2" className="w-full p-2 border rounded-lg" placeholder="Additional notes about this entry..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={resetModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAddManualEntry} disabled={isSaving || !formData.subject || !formData.score} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {isSaving ? "Saving..." : (editingEntry ? "Update" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}