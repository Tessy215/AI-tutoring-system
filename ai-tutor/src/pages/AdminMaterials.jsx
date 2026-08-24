/* eslint-disable */
import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { databases, storage } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "../lib/config";
import { Query } from "appwrite";
import {
  FileText, Trash2, Eye, Download, Search, Filter,
  X, Calendar, User, BookOpen, File, FileImage, FileVideo
} from "lucide-react";
import { Skeleton } from "../components/Skeleton.jsx";
import { TableSkeleton } from "../components/LoadingSkeleton.jsx";

const PROJECT_ID = "6a0c62610037d13e6c11";
const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";

function getFileUrl(fileId, mode = "view") {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/${mode}?project=${PROJECT_ID}`;
}

export default function AdminMaterials() {
  const { userProfile } = useAuth();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Moved loadResources BEFORE useEffect
  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        [Query.orderDesc("$createdAt")]
      );
      setResources(response.documents);
      setFilteredResources(response.documents);
    } catch (error) {
      console.error("Error loading resources:", error);
    } finally {
      setLoading(false);
    }
  };

  // Moved handleSearch BEFORE useEffect that uses it
  const handleSearch = () => {
    let filtered = [...resources];
    
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.createdBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCourse !== "all") {
      filtered = filtered.filter(r => r.course === filterCourse);
    }
    
    if (filterType !== "all") {
      filtered = filtered.filter(r => r.resourceType === filterType);
    }
    
    setFilteredResources(filtered);
  };

  // Redirect after hooks
  useEffect(() => {
    if (userProfile?.role === "admin") {
      loadResources();
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile?.role === "admin") {
      handleSearch();
    }
  }, [searchTerm, filterCourse, filterType, resources]);

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

  const deleteResource = async (resource) => {
    setDeletingId(resource.$id);
    try {
      await storage.deleteFile(BUCKET_ID, resource.fileId);
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resource.$id);
      
      setResources(resources.filter(r => r.$id !== resource.$id));
      setShowDeleteModal(false);
      setSelectedResource(null);
      setDeleteConfirm("");
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("Failed to delete resource");
    } finally {
      setDeletingId(null);
    }
  };

  const viewResource = (fileId) => {
    window.open(getFileUrl(fileId, "view"), "_blank");
  };

  const downloadResource = (fileId) => {
    window.open(getFileUrl(fileId, "download"), "_blank");
  };

  const getFileTypeLabel = (resource) => {
    const name = (resource.fileName || "").toLowerCase();
    if (name.endsWith(".pdf")) return "PDF";
    if (name.endsWith(".doc") || name.endsWith(".docx")) return "Word";
    if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "PowerPoint";
    if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "Excel";
    if (name.match(/\.(png|jpg|jpeg|webp|svg|gif)$/)) return "Image";
    if (name.match(/\.(mp4|webm|ogg|mov)$/)) return "Video";
    return resource.resourceType || "File";
  };

  const getFileIcon = (resource) => {
    const name = (resource.fileName || "").toLowerCase();
    if (name.endsWith(".pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    if (name.endsWith(".doc") || name.endsWith(".docx")) return <FileText className="w-5 h-5 text-blue-500" />;
    if (name.endsWith(".ppt") || name.endsWith(".pptx")) return <FileText className="w-5 h-5 text-orange-500" />;
    if (name.match(/\.(png|jpg|jpeg)$/)) return <FileImage className="w-5 h-5 text-green-500" />;
    if (name.match(/\.(mp4|webm)$/)) return <FileVideo className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const courses = [...new Set(resources.map(r => r.course))];
  const fileTypes = [...new Set(resources.map(r => r.resourceType))];

if (loading) {
  return (
    <div className="p-6">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-gray-200"
          >
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
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
        <h1 className="text-3xl font-bold text-gray-900">Materials Management</h1>
        <p className="text-gray-600 mt-1">View and manage all uploaded learning materials</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">{resources.length}</p>
          <p className="text-sm text-gray-500">Total Resources</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">
            {resources.filter(r => r.resourceType === "pdf").length}
          </p>
          <p className="text-sm text-gray-500">PDFs</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">
            {resources.filter(r => r.resourceType === "video" || r.fileName?.match(/\.(mp4|webm)$/)).length}
          </p>
          <p className="text-sm text-gray-500">Videos</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">
            {resources.filter(r => r.resourceType === "ppt" || r.fileName?.match(/\.(ppt|pptx)$/)).length}
          </p>
          <p className="text-sm text-gray-500">PowerPoints</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, course, or lecturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="all">All Types</option>
              {fileTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Resource</th>
                <th className="text-left p-4 font-semibold text-gray-700">Course</th>
                <th className="text-left p-4 font-semibold text-gray-700">Uploaded By</th>
                <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No materials found
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                  <tr key={resource.$id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(resource)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{resource.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{resource.fileName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-700">{resource.course}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-700">{resource.createdBy}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {getFileTypeLabel(resource)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(resource.$createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => viewResource(resource.fileId)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadResource(resource.fileId)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedResource(resource);
                            setDeleteConfirm("");
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-red-600">Delete Resource</h2>
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
                  ⚠️ You are about to delete <strong>{selectedResource.title}</strong>
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Uploaded by: {selectedResource.createdBy} • {selectedResource.course}
                </p>
                <p className="text-xs text-red-500 mt-2">
                  This action is permanent and cannot be undone.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="font-mono bg-gray-100 px-1">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE to confirm..."
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
                onClick={() => deleteResource(selectedResource)}
                disabled={deleteConfirm !== "DELETE" || deletingId === selectedResource.$id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === selectedResource.$id ? "Deleting..." : "Delete Resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}