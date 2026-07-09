import { useState, useEffect } from "react";
import { databases, storage, ID } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "../lib/config";
import { useAuth } from "../Contexts/AuthContext";
import { Query } from "appwrite";
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Plus,
  X,
  Download,
  File,
  FileImage,
  FileVideo,
} from "lucide-react";

const PROJECT_ID = "6a0c62610037d13e6c11";
const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";

function getFileUrl(fileId, mode = "view") {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/${mode}?project=${PROJECT_ID}`;
}

export default function Resources() {
  const { user, userProfile } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");

  const [previewingResource, setPreviewingResource] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewCategory, setPreviewCategory] = useState(null);

  const [downloadingId, setDownloadingId] = useState(null);

  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    course: "",
    resourceType: "pdf",
    file: null,
  });

  const isLecturer =
    userProfile?.role === "lecturer" || userProfile?.role === "admin";

  useEffect(() => {
    if (user) fetchResources();
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
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        newResource.file
      );

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
      setNewResource({
        title: "",
        description: "",
        course: "",
        resourceType: "pdf",
        file: null,
      });
      setShowUploadForm(false);
    } catch (error) {
      console.error("Error uploading resource:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteResource = async (resource) => {
    if (!confirm("Delete this resource?")) return;

    try {
      await storage.deleteFile(BUCKET_ID, resource.fileId);
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        resource.$id
      );
      setResources(resources.filter((r) => r.$id !== resource.$id));
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  // =========================
  // DOWNLOAD
  // =========================
  const downloadResource = async (fileId, fileName) => {
    if (downloadingId === fileId) return;

    setDownloadingId(fileId);

    try {
      const url = getFileUrl(fileId, "download");

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "file");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file.");
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  const getFileCategory = (resource) => {
    const name = (resource.fileName || "").toLowerCase();
    const type = (resource.resourceType || "").toLowerCase();

    // PDF
    if (name.endsWith(".pdf") || type === "pdf") return "pdf";

    // Images
    if (
      name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/) ||
      type === "image"
    ) {
      return "image";
    }

    // Videos
    if (
      name.match(/\.(mp4|webm|ogg|mov)$/) ||
      type === "video"
    ) {
      return "video";
    }

    // Office files - open with Google Docs Viewer
    if (
      name.match(/\.(doc|docx|ppt|pptx|xls|xlsx|txt|csv)$/) ||
      type === "doc" ||
      type === "ppt"
    ) {
      return "office";
    }

    return "other";
  };

  // =========================
  // PREVIEW
  // =========================
  const openPreview = (resource) => {
    const fileUrl = getFileUrl(resource.fileId, "view");
    const category = getFileCategory(resource);

    // Office files -> Open in new tab with Google Docs
    if (category === "office") {
      const encodedUrl = encodeURIComponent(fileUrl);
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
      window.open(googleViewerUrl, "_blank");
      return;
    }

    // Non-previewable -> Show fallback modal
    if (category === "other") {
      setPreviewingResource(resource);
      setPreviewUrl(fileUrl);
      setPreviewCategory(category);
      return;
    }

    // PDF / Image / Video -> Show modal preview
    setPreviewingResource(resource);
    setPreviewUrl(fileUrl);
    setPreviewCategory(category);
  };

  const closePreview = () => {
    setPreviewingResource(null);
    setPreviewUrl(null);
    setPreviewCategory(null);
  };

  const getResourceIcon = (resource) => {
    const name = (resource.fileName || "").toLowerCase();

    if (name.endsWith(".pdf"))
      return <FileText className="w-5 h-5 text-red-500" />;

    if (name.endsWith(".doc") || name.endsWith(".docx"))
      return <FileText className="w-5 h-5 text-blue-500" />;

    if (name.endsWith(".ppt") || name.endsWith(".pptx"))
      return <FileText className="w-5 h-5 text-orange-500" />;

    if (name.endsWith(".xls") || name.endsWith(".xlsx"))
      return <FileText className="w-5 h-5 text-green-500" />;

    if (name.match(/\.(png|jpg|jpeg|webp|svg|gif)$/))
      return <FileImage className="w-5 h-5 text-green-500" />;

    if (name.match(/\.(mp4|webm|ogg|mov)$/))
      return <FileVideo className="w-5 h-5 text-purple-500" />;

    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getFileTypeLabel = (resource) => {
    const name = (resource.fileName || "").toLowerCase();

    if (name.endsWith(".pdf")) return "PDF";
    if (name.endsWith(".doc") || name.endsWith(".docx")) return "Word";
    if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "PowerPoint";
    if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "Excel";
    if (name.endsWith(".txt")) return "Text";
    if (name.endsWith(".csv")) return "CSV";
    if (name.match(/\.(png|jpg|jpeg|webp|svg|gif)$/)) return "Image";
    if (name.match(/\.(mp4|webm|ogg|mov)$/)) return "Video";

    return resource.resourceType || "File";
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.course.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse =
      filterCourse === "all" || r.course === filterCourse;

    return matchesSearch && matchesCourse;
  });

  const courses = [...new Set(resources.map((r) => r.course))];

  return (
    <div>
      {/* =========================
          PREVIEW MODAL
      ========================== */}
      {previewingResource && previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex justify-between items-center p-4 border-b shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {previewingResource.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {previewingResource.course}
                </p>
              </div>

              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[400px]">
              {previewCategory === "other" ? (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    This file type cannot be previewed in the browser.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {previewingResource.fileName}
                  </p>

                  <button
                    onClick={() =>
                      downloadResource(
                        previewingResource.fileId,
                        previewingResource.fileName
                      )
                    }
                    className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mx-auto"
                  >
                    <Download className="w-4 h-4" />
                    Download to View
                  </button>
                </div>
              ) : previewCategory === "pdf" ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[500px]"
                  title={previewingResource.title}
                />
              ) : previewCategory === "image" ? (
                <img
                  src={previewUrl}
                  alt={previewingResource.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : previewCategory === "video" ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full max-h-[70vh] rounded-lg"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading preview...</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 p-4 border-t shrink-0">
              <button
                onClick={() =>
                  downloadResource(
                    previewingResource.fileId,
                    previewingResource.fileName
                  )
                }
                disabled={downloadingId === previewingResource.fileId}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloadingId === previewingResource.fileId
                  ? "Downloading…"
                  : "Download"}
              </button>

              <button
                onClick={closePreview}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-600 mt-1">
            {isLecturer
              ? "Manage and upload study materials"
              : "Browse study materials"}
          </p>
        </div>

        {isLecturer && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Upload Resource
          </button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && isLecturer && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200 mb-6">
          <h3 className="font-semibold mb-4">Upload New Resource</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Resource title"
              value={newResource.title}
              onChange={(e) =>
                setNewResource({ ...newResource, title: e.target.value })
              }
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              placeholder="Course (e.g. Mathematics, Physics)"
              value={newResource.course}
              onChange={(e) =>
                setNewResource({ ...newResource, course: e.target.value })
              }
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              placeholder="Description (optional)"
              value={newResource.description}
              onChange={(e) =>
                setNewResource({
                  ...newResource,
                  description: e.target.value,
                })
              }
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={newResource.resourceType}
              onChange={(e) =>
                setNewResource({
                  ...newResource,
                  resourceType: e.target.value,
                })
              }
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pdf">📄 PDF</option>
              <option value="ppt">📊 PowerPoint</option>
              <option value="video">🎥 Video</option>
              <option value="image">🖼️ Image</option>
              <option value="doc">📝 Word</option>
              <option value="other">📁 Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              onChange={(e) =>
                setNewResource({
                  ...newResource,
                  file: e.target.files[0],
                })
              }
              className="w-full p-2 border rounded focus:outline-none"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.png,.jpg,.jpeg,.webp,.svg,.txt,.csv"
            />
            {newResource.file && (
              <p className="text-sm text-green-600 mt-1">
                ✅ {newResource.file.name} selected
              </p>
            )}

            {/* ✅ RECOMMENDATION BOX */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                📌 File Format Recommendations:
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>
                  • <strong>For lecture notes & slides:</strong> Use{" "}
                  <strong>PDF</strong> (read-only, consistent formatting)
                </li>
                <li>
                  • <strong>For student submissions:</strong> Any format is
                  fine (Word, PDF, etc.)
                </li>
                <li>
                  • <strong>For images:</strong> PNG, JPG, JPEG, SVG, WebP
                </li>
                <li>
                  • <strong>For videos:</strong> MP4, WebM, OGG, MOV
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading…" : "Upload"}
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
          placeholder="Search resources…"
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
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          Loading resources…
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {isLecturer
              ? "No resources yet. Upload your first resource!"
              : "No resources available yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const category = getFileCategory(resource);
            const isModalPreview =
              category === "pdf" ||
              category === "image" ||
              category === "video";
            const isOfficeDoc = category === "office";

            return (
              <div
                key={resource.$id}
                className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getResourceIcon(resource)}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {resource.title}
                      </h3>
                      <p className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                        {resource.course}
                      </p>
                    </div>
                  </div>
                </div>

                {resource.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {resource.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>By {resource.createdBy}</span>
                  <span>
                    {new Date(resource.$createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                    {getFileTypeLabel(resource)}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {resource.fileName}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openPreview(resource)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    {isModalPreview
                      ? "Preview"
                      : isOfficeDoc
                      ? "Open"
                      : "View"}
                  </button>

                  <button
                    onClick={() =>
                      downloadResource(resource.fileId, resource.fileName)
                    }
                    disabled={downloadingId === resource.fileId}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {(resource.userId === user?.$id ||
                    userProfile?.role === "admin") && (
                    <button
                      onClick={() => deleteResource(resource)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}