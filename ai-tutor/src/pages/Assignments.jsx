import { useState, useEffect } from "react";
import { 
  Plus, FileText, Upload, CheckCircle, Clock, AlertCircle, 
  Trash2, Edit2, X, Save, Send, BookOpen, Calendar, Users, BarChart3, 
  FileQuestion, PlusCircle, MinusCircle, Paperclip, HelpCircle
} from "lucide-react";
import { databases, storage, ID } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "../lib/config";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { Query } from "appwrite";

export default function Assignments() {
  const { user, userProfile } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [submittingTo, setSubmittingTo] = useState(null);
  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    dueDate: "",
    type: "file",
    assignedTo: "all",
    maxScore: 100,
    questions: [],
    attachmentFile: null,
  });
  const [submissionData, setSubmissionData] = useState({});
  const [submissionFile, setSubmissionFile] = useState(null);
  const [gradeData, setGradeData] = useState({ grade: "", feedback: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      let queries = [];
      
      if (userProfile?.role === "student") {
        queries = [
          Query.or([
            Query.equal("assignedTo", user.$id),
            Query.equal("assignedTo", "all")
          ])
        ];
      } else if (userProfile?.role === "lecturer" || userProfile?.role === "admin") {
        queries = [Query.equal("createdBy", user.$id)];
      }
      
      queries.push(Query.orderDesc("$createdAt"));
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        queries
      );
      setAssignments(response.documents);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    setIsSaving(true);
    try {
      let attachmentFileId = null;
      
      if (formData.attachmentFile) {
        const uploadedFile = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          formData.attachmentFile
        );
        attachmentFileId = uploadedFile.$id;
      }
      
      const assignmentData = {
        userId: user.$id,
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        dueDate: formData.dueDate,
        type: formData.type,
        assignedTo: formData.assignedTo,
        createdBy: user.$id,
        status: "pending",
        maxScore: parseInt(formData.maxScore),
        questions: JSON.stringify(formData.questions),
        attachment: attachmentFileId,
        grade: null,
        submission: null,
        submissionDate: null,
        feedback: null,
      };

      if (editingAssignment) {
        // Update existing assignment
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.ASSIGNMENTS,
          editingAssignment.$id,
          assignmentData
        );
      } else {
        // Create new assignment
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ASSIGNMENTS,
          ID.unique(),
          assignmentData
        );
      }

      resetModal();
      loadAssignments();
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert("Failed to save assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    let questions = [];
    try {
      questions = JSON.parse(assignment.questions || "[]");
    } catch (e) {
      questions = [];
    }
    
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      subject: assignment.subject,
      dueDate: assignment.dueDate || "",
      type: assignment.type,
      assignedTo: assignment.assignedTo,
      maxScore: assignment.maxScore || 100,
      questions: questions,
      attachmentFile: null, // Can't edit file attachment, would need re-upload
    });
    setEditingAssignment(assignment);
    setShowModal(true);
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const assignment = assignments.find(a => a.$id === assignmentId);
    const answers = submissionData[assignmentId] || {};
    
    setIsSaving(true);
    try {
      let finalScore = 0;
      const questions = JSON.parse(assignment.questions || "[]");
      const pointsPerQuestion = assignment.maxScore / questions.length;
      
      questions.forEach((q, idx) => {
        const studentAnswer = answers[idx]?.answer || "";
        
        if (q.type === "multiple") {
          if (studentAnswer === q.correctAnswer) {
            finalScore += pointsPerQuestion;
          }
        } else if (q.type === "text" && q.autoGrade) {
          const correct = q.correctAnswer || "";
          const normalizedStudent = studentAnswer.toLowerCase().trim();
          const normalizedCorrect = correct.toLowerCase().trim();
          
          if (normalizedStudent === normalizedCorrect) {
            finalScore += pointsPerQuestion;
          }
          else if (isNumberWord(normalizedStudent) && numberWordToNumber(normalizedStudent) === normalizedCorrect) {
            finalScore += pointsPerQuestion;
          }
        }
      });
      
      const submittedAnswers = {};
      questions.forEach((q, idx) => {
        submittedAnswers[idx] = {
          answer: answers[idx]?.answer || "",
          working: answers[idx]?.working || "",
          autoGraded: (q.type === "multiple" || (q.type === "text" && q.autoGrade)) ? true : false,
          pointsAwarded: 0
        };
      });
      
      const submissionPayload = {
        submission: JSON.stringify(submittedAnswers),
        submissionDate: new Date().toISOString(),
        status: "submitted",
      };
      
      const allAutoGraded = questions.every(q => q.type === "multiple" || (q.type === "text" && q.autoGrade));
      if (allAutoGraded) {
        submissionPayload.grade = Math.round(finalScore);
        submissionPayload.feedback = `Auto-graded: ${Math.round(finalScore)}/${assignment.maxScore}`;
      }
      
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        assignmentId,
        submissionPayload
      );

      setSubmittingTo(null);
      setSubmissionData({});
      setSubmissionFile(null);
      loadAssignments();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Failed to submit assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGradeAssignment = async (assignmentId) => {
    if (!gradeData.grade) return;
    
    setIsSaving(true);
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        assignmentId,
        {
          grade: parseInt(gradeData.grade),
          feedback: gradeData.feedback,
          status: "graded"
        }
      );

      setGradingAssignment(null);
      setGradeData({ grade: "", feedback: "" });
      loadAssignments();
    } catch (error) {
      console.error("Error grading assignment:", error);
      alert("Failed to grade assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        assignmentId
      );
      loadAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    }
  };

  const downloadAttachment = async (fileId, fileName) => {
    try {
      const file = await storage.getFileView(BUCKET_ID, fileId);
      window.open(file.href, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to open file");
    }
  };

  const isNumberWord = (str) => {
    const numberWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    return numberWords.includes(str);
  };
  
  const numberWordToNumber = (str) => {
    const map = {
      "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
      "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10"
    };
    return map[str] || str;
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { 
          text: "", 
          type: "multiple", 
          options: ["", ""], 
          correctAnswer: "",
          autoGrade: true,
          showWorking: false
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[optIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (qIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push("");
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeOption = (qIndex, optIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.splice(optIndex, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormData({
      title: "",
      description: "",
      subject: "",
      dueDate: "",
      type: "file",
      assignedTo: "all",
      maxScore: 100,
      questions: [],
      attachmentFile: null,
    });
  };

  const updateStudentAnswer = (assignmentId, questionIndex, field, value) => {
    setSubmissionData(prev => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || {}),
        [questionIndex]: {
          ...(prev[assignmentId]?.[questionIndex] || {}),
          [field]: value
        }
      }
    }));
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "submitted":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"><Clock className="w-3 h-3 inline mr-1" />Submitted</span>;
      case "graded":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 inline mr-1" />Graded</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 inline mr-1" />Pending</span>;
    }
  };

  const canCreate = userProfile?.role === "lecturer" || userProfile?.role === "admin";
  const canGrade = userProfile?.role === "lecturer" || userProfile?.role === "admin";

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Submit your work and track grades</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments</h3>
            <p className="text-gray-600">
              {canCreate ? "Create your first assignment" : "No assignments yet"}
            </p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const questions = JSON.parse(assignment.questions || "[]");
            const hasAttachment = assignment.attachment;
            
            return (
              <div key={assignment.$id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {assignment.type === "quiz" ? (
                        <FileQuestion className="w-5 h-5 text-purple-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-indigo-600" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <p className="text-gray-600 mb-2">{assignment.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{assignment.subject}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No date"}</span>
                      <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" />Max Score: {assignment.maxScore}</span>
                    </div>
                    {hasAttachment && (
                      <button onClick={() => downloadAttachment(assignment.attachment, assignment.title)} className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                        <Paperclip className="w-4 h-4" />Download Assignment File
                      </button>
                    )}
                  </div>
                  {(canCreate || assignment.createdBy === user.$id) && assignment.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditAssignment(assignment)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Assignment">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteAssignment(assignment.$id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Assignment">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {(canCreate || assignment.createdBy === user.$id) && assignment.status !== "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteAssignment(assignment.$id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Assignment">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Student Submission Section - same as before */}
                {userProfile?.role === "student" && assignment.status !== "graded" && assignment.status !== "submitted" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {submittingTo === assignment.$id ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                          <p className="text-sm font-medium text-indigo-800 mb-2">📋 Assignment Instructions:</p>
                          <p className="text-sm text-indigo-700">{assignment.description || "Answer all questions below. Check the due date and submit before the deadline."}</p>
                          <div className="mt-3 flex gap-4 text-xs text-indigo-600">
                            <span>📅 Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}</span>
                            <span>⭐ Max Score: {assignment.maxScore} points</span>
                          </div>
                        </div>

                        {questions.map((q, qIdx) => (
                          <div key={qIdx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="font-medium text-gray-900 mb-3">{qIdx + 1}. {q.text}</p>
                            
                            {q.type === "multiple" ? (
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600 mb-2">Select your answer from the options below:</p>
                                <div className="space-y-2">
                                  {q.options.map((opt, optIdx) => (
                                    <label key={optIdx} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50">
                                      <input
                                        type="radio"
                                        name={`q_${qIdx}`}
                                        value={opt}
                                        onChange={(e) => updateStudentAnswer(assignment.$id, qIdx, "answer", e.target.value)}
                                        className="w-4 h-4 text-indigo-600"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  ))}
                                </div>
                                {q.showWorking && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <label className="text-sm font-medium text-blue-800 flex items-center gap-1">
                                      <HelpCircle className="w-4 h-4" /> Show your working (optional but recommended)
                                    </label>
                                    <textarea
                                      value={submissionData[assignment.$id]?.[qIdx]?.working || ""}
                                      onChange={(e) => updateStudentAnswer(assignment.$id, qIdx, "working", e.target.value)}
                                      className="w-full p-2 border border-blue-200 rounded-lg mt-1 bg-white"
                                      rows="3"
                                      placeholder="Write your step-by-step solution, calculations, or reasoning here..."
                                    />
                                    <p className="text-xs text-blue-600 mt-1">Showing your work helps your lecturer understand your thought process and may earn partial credit.</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-700 mb-1 block">Your Answer:</label>
                                  <textarea
                                    value={submissionData[assignment.$id]?.[qIdx]?.answer || ""}
                                    onChange={(e) => updateStudentAnswer(assignment.$id, qIdx, "answer", e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={q.showWorking ? "3" : "5"}
                                    placeholder={q.autoGrade ? "Type your final answer here (e.g., 42, Paris, x=5)" : "Type your detailed answer here..."}
                                  />
                                </div>
                                {q.showWorking && (
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <label className="text-sm font-medium text-blue-800 flex items-center gap-1">
                                      <HelpCircle className="w-4 h-4" /> Show your working (optional but recommended)
                                    </label>
                                    <textarea
                                      value={submissionData[assignment.$id]?.[qIdx]?.working || ""}
                                      onChange={(e) => updateStudentAnswer(assignment.$id, qIdx, "working", e.target.value)}
                                      className="w-full p-2 border border-blue-200 rounded-lg mt-1 bg-white"
                                      rows="3"
                                      placeholder="Write your step-by-step solution, calculations, or reasoning here..."
                                    />
                                    <p className="text-xs text-blue-600 mt-1">Showing your work helps your lecturer understand your thought process and may earn partial credit.</p>
                                  </div>
                                )}
                                {q.autoGrade && q.correctAnswer && (
                                  <div className="p-2 bg-green-50 rounded-lg">
                                    <p className="text-xs text-green-700">✓ This question will be auto-graded based on your final answer. {q.showWorking ? "Your working will be reviewed separately." : ""}</p>
                                  </div>
                                )}
                                {!q.autoGrade && (
                                  <div className="p-2 bg-yellow-50 rounded-lg">
                                    <p className="text-xs text-yellow-700">📝 This question will be manually graded by your lecturer.</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => handleSubmitAssignment(assignment.$id)} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            <Send className="w-4 h-4" />Submit Assignment
                          </button>
                          <button onClick={() => setSubmittingTo(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setSubmittingTo(assignment.$id)} className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Upload className="w-4 h-4" />Start Assignment
                      </button>
                    )}
                  </div>
                )}

                {userProfile?.role === "student" && assignment.status === "submitted" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-blue-600 p-3 bg-blue-50 rounded-lg">
                      <Clock className="w-5 h-5" />
                      <span>Assignment submitted! Waiting for grading.</span>
                    </div>
                  </div>
                )}

                {assignment.grade !== null && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Grade: {assignment.grade}/{assignment.maxScore}</span>
                      <span className="text-lg font-semibold text-indigo-600">{((assignment.grade / assignment.maxScore) * 100).toFixed(0)}%</span>
                    </div>
                    {assignment.feedback && <p className="text-sm text-gray-600 mt-2"><strong>Feedback:</strong> {assignment.feedback}</p>}
                  </div>
                )}

                {canGrade && assignment.status === "submitted" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {gradingAssignment === assignment.$id ? (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Grade (0-{assignment.maxScore})</label>
                          <input 
                            type="number" 
                            min="0" 
                            max={assignment.maxScore} 
                            value={gradeData.grade} 
                            onChange={(e) => setGradeData({...gradeData, grade: e.target.value})} 
                            className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                          <textarea 
                            value={gradeData.feedback} 
                            onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})} 
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                            rows="3"
                            placeholder="Provide feedback to the student..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleGradeAssignment(assignment.$id)} disabled={!gradeData.grade} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save Grade</button>
                          <button onClick={() => setGradingAssignment(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setGradingAssignment(assignment.$id)} className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg">
                        <BarChart3 className="w-4 h-4" />Grade Submission
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAssignment ? "Edit Assignment" : "Create Assignment"}
              </h2>
              <button onClick={resetModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g., Week 5 Assignment, Midterm Project, Quiz 2"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description / Instructions</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows="4"
                  placeholder="Explain what students need to do. Example:&#10;&#10;1. Answer all questions below&#10;2. Show your working for calculation questions&#10;3. Submit before the due date&#10;4. Each question is worth 25 points"
                />
                <p className="text-xs text-gray-500 mt-1">These instructions will be shown to students before they start the assignment</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input 
                  type="text" 
                  value={formData.subject} 
                  onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                  placeholder="e.g., Mathematics, Programming, Physics, English"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input 
                  type="date" 
                  value={formData.dueDate} 
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="file">File Upload (Students submit files - PDF, DOCX, etc.)</option>
                  <option value="quiz">Quiz (Questions & Answers - Multiple choice or text)</option>
                </select>
              </div>

              {formData.type === "file" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignment File (Optional)</label>
                  <input 
                    type="file" 
                    onChange={(e) => setFormData({...formData, attachmentFile: e.target.files[0]})} 
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload PDF, DOCX, or other file with assignment instructions</p>
                  {editingAssignment && editingAssignment.attachment && (
                    <p className="text-xs text-blue-600 mt-1">Note: Uploading a new file will replace the existing one.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                <select value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="all">All Students</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Score</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={formData.maxScore} 
                  onChange={(e) => setFormData({...formData, maxScore: e.target.value})} 
                  className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Total points for this assignment</p>
              </div>

              {formData.type === "quiz" && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="font-medium text-gray-900">Questions</label>
                    <button onClick={addQuestion} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
                      <PlusCircle className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>

                  {formData.questions.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4 border border-dashed border-gray-300 rounded-lg">No questions added yet. Click "Add Question" to start.</p>
                  ) : (
                    <div className="space-y-4">
                      {formData.questions.map((q, qIdx) => (
                        <div key={qIdx} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-900">Question {qIdx + 1}</h4>
                            <button onClick={() => removeQuestion(qIdx)} className="text-red-600 hover:text-red-700">
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                              placeholder="Enter your question here..."
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />

                            <select
                              value={q.type}
                              onChange={(e) => updateQuestion(qIdx, "type", e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="multiple">Multiple Choice (Students select from options)</option>
                              <option value="text">Text Answer (Students type their answer)</option>
                            </select>

                            {q.type === "multiple" ? (
                              <div className="pl-4 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Answer Options</label>
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                      placeholder={`Option ${optIdx + 1}`}
                                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button onClick={() => removeOption(qIdx, optIdx)} className="text-red-600 hover:text-red-700">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button onClick={() => addOption(qIdx)} className="text-sm text-indigo-600 hover:text-indigo-700">
                                  + Add Option
                                </button>

                                <div className="mt-3">
                                  <label className="text-sm font-medium text-gray-700">Correct Answer</label>
                                  <select
                                    value={q.correctAnswer}
                                    onChange={(e) => updateQuestion(qIdx, "correctAnswer", e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="">Select correct answer</option>
                                    {q.options.map((opt, i) => (
                                      <option key={i} value={opt}>{opt || `Option ${i + 1}`}</option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-gray-500 mt-1">Student must select this exact option to get points</p>
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={q.showWorking}
                                    onChange={(e) => updateQuestion(qIdx, "showWorking", e.target.checked)}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <label className="text-sm text-gray-700">Allow students to show working (optional text box)</label>
                                </div>
                              </div>
                            ) : (
                              <div className="pl-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={q.autoGrade}
                                    onChange={(e) => updateQuestion(qIdx, "autoGrade", e.target.checked)}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <label className="text-sm text-gray-700">Auto-grade this question (exact/number word match)</label>
                                </div>
                                
                                {q.autoGrade && (
                                  <div>
                                    <input
                                      type="text"
                                      value={q.correctAnswer || ""}
                                      onChange={(e) => updateQuestion(qIdx, "correctAnswer", e.target.value)}
                                      placeholder="Correct answer (e.g., 4 or Paris)"
                                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Student's answer will be compared to this. "4" matches "four" automatically.</p>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={q.showWorking}
                                    onChange={(e) => updateQuestion(qIdx, "showWorking", e.target.checked)}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <label className="text-sm text-gray-700">Allow students to show working (optional text box)</label>
                                </div>

                                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                  {q.autoGrade ? "Auto-graded questions check the final answer only. The working box is optional for students to show their steps." : "Text answers without auto-grade require manual grading by the lecturer."}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
              <button onClick={resetModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button 
                onClick={handleCreateAssignment} 
                disabled={!formData.title || !formData.subject} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : (editingAssignment ? "Update Assignment" : "Create Assignment")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}