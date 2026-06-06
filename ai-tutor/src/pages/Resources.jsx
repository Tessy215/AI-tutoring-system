import { useState, useEffect } from "react";
import { databases, storage, ID } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "../lib/config";
import { useAuth } from "../Contexts/AuthContext";
import { Query } from "appwrite";
import { Upload, FileText, Trash2, Eye, Plus, X } from "lucide-react";

export default function Resources() {
  const { user, userProfile } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    course: "",
    resourceType: "pdf",
    file: null,
  });

  const isLecturer = userProfile?.role === "lecturer" || userProfile?.role === "admin";

  useEffect(() => {
    if (user) {
      fetchResources();
    }
  }, [user]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        [Query.orderDesc("$createdAt")]
      );
      setResources(response.documents);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!newResource.title || !newResource.course || !newResource.file) {
      alert("Please fill in title, course and select a file!");
      return;
    }

    setIsUploading(true);
    try {
      // STEP 1: Upload file to Appwrite Storage
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        newResource.file
      );

      // STEP 2: Save metadata to database
      const resource = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        ID.unique(),
        {
          userId: user.$id,
          title: newResource.title,
          description: newResource.description,
          course: newResource.course,
          resourceType: newResource.resourceType,
          fileId: uploadedFile.$id,
          fileName: newResource.file.name,
          createdBy: user.name,
        }
      );

      setResources([resource, ...resources]);
      setNewResource({ title: "", description: "", course: "", resourceType: "pdf", file: null });
      setShowUploadForm(false);
    } catch (error) {
      console.error("Error uploading resource:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteResource = async (resource) => {
    try {
      // Delete file from storage
      await storage.deleteFile(BUCKET_ID, resource.fileId);
      // Delete metadata from database
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resource.$id);
      setResources(resources.filter(r => r.$id !== resource.$id));
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  const viewResource = (fileId) => {
    // Generate file view URL
    const url = `https://fra.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=6a0c62610037d13e6c11`;
    window.open(url, "_blank");
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case "pdf": return "📄";
      case "video": return "🎥";
      case "link": return "🔗";
      case "ppt": return "📊";
      default: return "📁";
    }
  };

  // Filter resources by search and course
  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === "all" || r.course === filterCourse;
    return matchesSearch && matchesCourse;
  });

  // Get unique courses for filter
  const courses = [...new Set(resources.map(r => r.course))];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-600 mt-1">
            {isLecturer ? "Manage and upload study materials" : "Browse study materials"}
          </p>
        </div>
        {/* Only lecturers and admins can upload */}
        {isLecturer && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Upload Resource
          </button>
        )}
      </div>

      {/* Upload Form - only for lecturers */}
      {showUploadForm && isLecturer && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200 mb-6">
          <h3 className="font-semibold mb-4">Upload New Resource</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Resource title"
              value={newResource.title}
              onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Course (e.g. Mathematics, Physics)"
              value={newResource.course}
              onChange={(e) => setNewResource({ ...newResource, course: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Description (optional)"
              value={newResource.description}
              onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={newResource.resourceType}
              onChange={(e) => setNewResource({ ...newResource, resourceType: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pdf">PDF</option>
              <option value="ppt">PowerPoint</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* File upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              onChange={(e) => setNewResource({ ...newResource, file: e.target.files[0] })}
              className="w-full p-2 border rounded focus:outline-none"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.png,.jpg"
            />
            {newResource.file && (
              <p className="text-sm text-green-600 mt-1">
                ✅ {newResource.file.name} selected
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload"}
            </button>
            <button
              onClick={() => setShowUploadForm(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Courses</option>
          {courses.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>
      </div>

      {/* Resources List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading resources...</div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {isLecturer ? "No resources yet. Upload your first resource!" : "No resources available yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <div
              key={resource.$id}
              className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getResourceIcon(resource.resourceType)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{resource.title}</h3>
                    <p className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                      {resource.course}
                    </p>
                  </div>
                </div>
              </div>

              {resource.description && (
                <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>By {resource.createdBy}</span>
                <span>{new Date(resource.$createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => viewResource(resource.fileId)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                {/* Only uploader or admin can delete */}
                {(resource.userId === user?.$id || userProfile?.role === "admin") && (
                  <button
                    onClick={() => deleteResource(resource)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}