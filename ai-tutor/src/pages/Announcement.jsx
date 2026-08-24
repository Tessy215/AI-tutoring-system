import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { databases, ID } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../lib/config";
import { Query } from "appwrite";
import { 
  Plus, Edit2, Trash2, X, Save, Calendar, User,
  MessageSquare, AlertCircle, CheckCircle
} from "lucide-react";
import { createLog } from "../lib/logService";
import { notifyStudentsAboutAnnouncement } from "../lib/notifications";

export default function Announcement() {
  const { user, userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Check if user is lecturer or admin
  const canCreate = userProfile?.role === "lecturer" || userProfile?.role === "admin";

  // Redirect if not lecturer or admin
  if (!canCreate) {
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
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ANNOUNCEMENTS,
        [Query.orderDesc("$createdAt")]
      );
      setAnnouncements(response.documents);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      alert("Please fill in both title and content");
      return;
    }

    setIsSaving(true);
    try {
      let doc;
      
      if (editingAnnouncement) {
        // Update existing
        doc = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.ANNOUNCEMENTS,
          editingAnnouncement.$id,
          {
            title: formData.title,
            content: formData.content,
          }
        );
        await createLog(
          user.$id,
          user.name,
          "Edited announcement",
          `Edited announcement: ${formData.title}`,
          "announcement"
        );
      } else {
        // Create new
        doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ANNOUNCEMENTS,
          ID.unique(),
          {
            title: formData.title,
            content: formData.content,
            createdBy: user.$id,
            createdByName: user.name,
          }
        );
        
        // ✅ NEW: Notify all students about the announcement
        const notified = await notifyStudentsAboutAnnouncement(
          formData.title,
          formData.content,
          user.name,
          doc.$id
        );
        console.log(`Notified ${notified} students about announcement`);
        
        await createLog(
          user.$id,
          user.name,
          "Created announcement",
          `Created announcement: ${formData.title} (${notified} students notified)`,
          "announcement"
        );
      }

      resetModal();
      loadAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    setIsSaving(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.ANNOUNCEMENTS,
        selectedAnnouncement.$id
      );
      await createLog(
        user.$id,
        user.name,
        "Deleted announcement",
        `Deleted announcement: ${selectedAnnouncement.title}`,
        "announcement"
      );
      setShowDeleteModal(false);
      setSelectedAnnouncement(null);
      loadAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
    });
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    setFormData({ title: "", content: "" });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Post updates for your students</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
          <p className="text-sm text-gray-500">Total Announcements</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-indigo-600">
            {announcements.filter(a => {
              const date = new Date(a.$createdAt);
              const now = new Date();
              return date > new Date(now.setDate(now.getDate() - 7));
            }).length}
          </p>
          <p className="text-sm text-gray-500">Last 7 Days</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-green-600">
            {announcements.filter(a => a.createdBy === user.$id).length}
          </p>
          <p className="text-sm text-gray-500">Your Announcements</p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No announcements yet. Create your first announcement!</p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const isOwner = announcement.createdBy === user.$id;
            const isAdmin = userProfile?.role === "admin";

            return (
              <div key={announcement.$id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      {isOwner && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">Your Post</span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {announcement.createdByName || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(announcement.$createdAt)}
                      </span>
                    </div>
                  </div>
                  {(isOwner || isAdmin) && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button onClick={resetModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  maxLength="255"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.title.length}/255</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your announcement here..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows="6"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.content.length} characters
                  {formData.content.length > 4500 && (
                    <span className="text-red-500 ml-2">⚠️ Maximum 5000 characters</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={resetModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSaving || !formData.title || !formData.content}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : (editingAnnouncement ? "Update" : "Post")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-red-600">Delete Announcement</h2>
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
                  ⚠️ You are about to delete <strong>{selectedAnnouncement.title}</strong>
                </p>
                <p className="text-xs text-red-500 mt-2">
                  This action is permanent and cannot be undone.
                </p>
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
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}