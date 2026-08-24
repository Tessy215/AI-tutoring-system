/* eslint-disable */
import { AssignmentsSkeleton } from "../components/LoadingSkeleton";
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
import { createLog } from "../lib/logService";
import { notifyStudentsAboutAssignment, notifyStudentAboutGrade } from "../lib/notifications";

export default function Assignments() {
  const { user, userProfile } = useAuth();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [submittingTo, setSubmittingTo] = useState(null);
  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [questionPoints, setQuestionPoints] = useState({});
  const [showDetails, setShowDetails] = useState({});
  const [showLecturerDetails, setShowLecturerDetails] = useState({});
  const [editingGrade, setEditingGrade] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
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
      
      const assignmentsWithGrades = response.documents.map(doc => ({
        ...doc,
        questionGrades: doc.questionGrades ? JSON.parse(doc.questionGrades) : {}
      }));
      
      setAssignments(assignmentsWithGrades);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadAssignments();
  }, [user]);

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
        questionGrades: null,
      };

      let doc;
      if (editingAssignment) {
        doc = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.ASSIGNMENTS,
          editingAssignment.$id,
          assignmentData
        );
      } else {
        doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ASSIGNMENTS,
          ID.unique(),
          assignmentData
        );

        // ✅ Notify all students about new assignment
        const notified = await notifyStudentsAboutAssignment(
          formData.title,
          formData.subject,
          doc.$id
        );
        console.log(`✅ Notified ${notified} students about new assignment`);

        // Create log
        await createLog(
          user.$id,
          user.name,
          "Created assignment",
          `Created assignment: ${formData.title}`,
          "assignment"
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
      attachmentFile: null,
    });
    setEditingAssignment(assignment);
    setShowModal(true);
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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

  const handleSubmitAssignment = async (assignmentId) => {
    const assignment = assignments.find(a => a.$id === assignmentId);
    const answers = submissionData[assignmentId] || {};
    
    if (assignment.dueDate) {
      const dueDate = new Date(assignment.dueDate);
      const today = new Date();
      if (dueDate < today) {
        alert("Cannot submit: Assignment due date has passed!");
        return;
      }
    }
    
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
      
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.ASSIGNMENTS, assignmentId, submissionPayload);

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
    if (!gradeData.grade && gradeData.grade !== 0) return;
    
    setIsSaving(true);
    try {
      const questionGradesJson = JSON.stringify(questionPoints[assignmentId] || {});
      
      // Find the assignment before updating
      const assignment = assignments.find(a => a.$id === assignmentId);
      
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.ASSIGNMENTS, assignmentId, {
        grade: parseInt(gradeData.grade),
        feedback: gradeData.feedback,
        status: "graded",
        questionGrades: questionGradesJson
      });

      // ✅ NOTIFY STUDENT ABOUT GRADE
      if (assignment) {
        console.log("🎯 Notifying student about grade...");
        await notifyStudentAboutGrade(
          assignment.userId,
          assignment.title,
          gradeData.grade,
          assignment.maxScore
        );
        console.log(`✅ Student notified about grade for: ${assignment.title}`);
      }

      // Create log
      await createLog(
        user.$id,
        user.name,
        "Graded assignment",
        assignment?.title || "assignment",
        "grading"
      );

      setGradingAssignment(null);
      setGradeData({ grade: "", feedback: "" });
      setQuestionPoints({});
      loadAssignments();
    } catch (error) {
      console.error("Error grading assignment:", error);
      alert("Failed to grade assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGrade = async (assignmentId) => {
    if (!gradeData.grade && gradeData.grade !== 0) return;
    
    setIsSaving(true);
    try {
      const assignment = assignments.find(a => a.$id === assignmentId);
      const existingQuestionGrades = assignment?.questionGrades || {};
      
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.ASSIGNMENTS, assignmentId, {
        grade: parseInt(gradeData.grade),
        feedback: gradeData.feedback,
        status: "graded",
        questionGrades: JSON.stringify(existingQuestionGrades)
      });

      // ✅ NOTIFY STUDENT ABOUT UPDATED GRADE
      if (assignment) {
        console.log("🎯 Notifying student about updated grade...");
        await notifyStudentAboutGrade(
          assignment.userId,
          assignment.title,
          gradeData.grade,
          assignment.maxScore
        );
        console.log(`✅ Student notified about updated grade for: ${assignment.title}`);
      }

      setEditingGrade(prev => ({ ...prev, [assignmentId]: false }));
      setGradeData({ grade: "", feedback: "" });
      loadAssignments();
    } catch (error) {
      console.error("Error updating grade:", error);
      alert("Failed to update grade");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ASSIGNMENTS, assignmentId);
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

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { text: "", type: "multiple", options: ["", ""], correctAnswer: "", autoGrade: true, showWorking: false }
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
        [questionIndex]: { ...(prev[assignmentId]?.[questionIndex] || {}), [field]: value }
      }
    }));
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "submitted": return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"><Clock className="w-3 h-3 inline mr-1" />Submitted</span>;
      case "graded": return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 inline mr-1" />Graded</span>;
      default: return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 inline mr-1" />Pending</span>;
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
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
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
            <p className="text-gray-600">{canCreate ? "Create your first assignment" : "No assignments yet"}</p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const questions = JSON.parse(assignment.questions || "[]");
            const submission = JSON.parse(assignment.submission || "{}");
            const hasAttachment = assignment.attachment;
            const overdue = isOverdue(assignment.dueDate);
            const pointsPerQuestion = assignment.maxScore / questions.length;
            const savedQuestionGrades = assignment.questionGrades || {};
            
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
                      {overdue && assignment.status === "pending" && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{assignment.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{assignment.subject}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No date"}</span>
                      <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" />Max Score: {assignment.maxScore}</span>
                    </div>
                    {hasAttachment && (
                      <button onClick={() => downloadAttachment(assignment.attachment, assignment.title)} className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
                        <Paperclip className="w-4 h-4" />Download Assignment File
                      </button>
                    )}
                  </div>
                  {(canCreate || assignment.createdBy === user.$id) && assignment.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditAssignment(assignment)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteAssignment(assignment.$id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                {/* STUDENT SUBMISSION SECTION */}
                {userProfile?.role === "student" && assignment.status !== "graded" && assignment.status !== "submitted" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {overdue ? (
                      <div className="p-3 bg-red-50 rounded-lg text-red-600 text-center">
                        <AlertCircle className="w-5 h-5 inline mr-2" />
                        Submission deadline has passed. You can no longer submit this assignment.
                      </div>
                    ) : submittingTo === assignment.$id ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-indigo-50 rounded-lg">
                          <p className="text-sm font-medium text-indigo-800 mb-2">📋 Instructions:</p>
                          <p className="text-sm text-indigo-700">{assignment.description || "Answer all questions below."}</p>
                          <div className="mt-3 flex gap-4 text-xs text-indigo-600">
                            <span>📅 Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}</span>
                            <span>⭐ Max Score: {assignment.maxScore} points</span>
                          </div>
                        </div>

                        {questions.map((q, qIdx) => (
                          <div key={qIdx} className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900 mb-3">{qIdx + 1}. {q.text}</p>
                            {q.type === "multiple" ? (
                              <div className="space-y-2">
                                {q.options.map((opt, optIdx) => (
                                  <label key={optIdx} className="flex items-center gap-3 p-2 border rounded-lg bg-white cursor-pointer">
                                    <input type="radio" name={`q_${qIdx}`} value={opt} onChange={(e) => updateStudentAnswer(assignment.$id, qIdx, "answer", e.target.value)} className="w-4 h-4 text-indigo-600" />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                                {q.showWorking && (
                                  <textarea value={submissionData[assignment.$id]?.[qIdx]?.working || ""} onChange={(e) => updateStudentAnswer(assignment.$id, qIdx, "working", e.target.value)} className="w-full p-2 border rounded-lg mt-2" rows="2" placeholder="Show your working (optional)..." />
                                )}
                              </div>
                            ) : (
                              <div>
                                <textarea value={submissionData[assignment.$id]?.[qIdx]?.answer || ""} onChange={(e) => updateStudentAnswer(assignment.$id, qIdx, "answer", e.target.value)} className="w-full p-3 border rounded-lg" rows="3" placeholder="Type your answer here..." />
                                {q.showWorking && (
                                  <textarea value={submissionData[assignment.$id]?.[qIdx]?.working || ""} onChange={(e) => updateStudentAnswer(assignment.$id, qIdx, "working", e.target.value)} className="w-full p-2 border rounded-lg mt-2" rows="2" placeholder="Show your working (optional)..." />
                                )}
                                {q.autoGrade && q.correctAnswer && <p className="text-xs text-green-600 mt-1">✓ This question will be auto-graded.</p>}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <div className="flex gap-2">
                          <button onClick={() => handleSubmitAssignment(assignment.$id)} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Submit Assignment</button>
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

                {/* SUBMITTED WAITING MESSAGE */}
                {userProfile?.role === "student" && assignment.status === "submitted" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 p-3 rounded-lg border">
                      {assignment.grade !== null && assignment.grade !== undefined ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-medium">Auto-graded: {assignment.grade}/{assignment.maxScore}</span>
                          <span className="text-gray-500 text-sm ml-2">(Waiting for lecturer review)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5 text-blue-600" />
                          <span className="text-blue-700 font-medium">Assignment submitted!</span>
                          <span className="text-gray-500 text-sm ml-2">Waiting for grading.</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* GRADE DISPLAY */}
                {assignment.grade !== null && assignment.grade !== undefined && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">Overall Grade:</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-indigo-600">{assignment.grade}</span>
                        <span className="text-gray-500">/{assignment.maxScore}</span>
                        <span className="ml-2 text-sm text-gray-500">({((assignment.grade / assignment.maxScore) * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                    {assignment.feedback && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Feedback:</p>
                        <p className="text-sm text-gray-600 mt-1">{assignment.feedback}</p>
                      </div>
                    )}
                    
                    {/* VIEW DETAILS - For Students */}
                    {userProfile?.role === "student" && assignment.type === "quiz" && assignment.grade !== null && (
                      <button onClick={() => { setShowDetails(prev => ({ ...prev, [assignment.$id]: !prev[assignment.$id] })); }} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        {showDetails[assignment.$id] ? " Hide Details ▲" : " View Details ▼"}
                      </button>
                    )}

                    {/* EDIT GRADE - For Lecturers */}
                    {canGrade && assignment.status === "graded" && (
                      <button onClick={() => { setEditingGrade(prev => ({ ...prev, [assignment.$id]: !prev[assignment.$id] })); if (!editingGrade[assignment.$id]) { setGradeData({ grade: assignment.grade, feedback: assignment.feedback || "" }); } }} className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <Edit2 className="w-3 h-3" />
                        {editingGrade[assignment.$id] ? " Cancel Edit" : " Edit Grade"}
                      </button>
                    )}

                    {/* EDIT GRADE FORM */}
                    {canGrade && assignment.status === "graded" && editingGrade[assignment.$id] && (
                      <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-3">{assignment.type === "quiz" ? "Edit Quiz Grades" : "Edit Grade"}</h4>
                        {assignment.type === "quiz" ? (
                          <div className="space-y-4">
                            <div className="space-y-3">
                              {(() => {
                                const questionsList = JSON.parse(assignment.questions || "[]");
                                const submission = JSON.parse(assignment.submission || "{}");
                                const pointsPerQuestion = assignment.maxScore / questionsList.length;
                                const savedQuestionGrades = assignment.questionGrades || {};
                                return questionsList.map((q, qIdx) => {
                                  const studentAnswer = submission[qIdx]?.answer || "Not answered";
                                  const isMultipleChoice = q.type === "multiple";
                                  const isCorrect = isMultipleChoice && studentAnswer === q.correctAnswer;
                                  const currentPoints = savedQuestionGrades[qIdx] !== undefined ? savedQuestionGrades[qIdx] : (isMultipleChoice && isCorrect ? Math.round(pointsPerQuestion) : 0);
                                  return (
                                    <div key={qIdx} className="p-3 bg-white rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900 mb-2">{qIdx + 1}. {q.text}</p>
                                      <p className="text-sm text-gray-700">Student's Answer: <span className="font-medium">{studentAnswer}</span></p>
                                      {isMultipleChoice && <p className="text-sm text-gray-700">Correct Answer: <span className="text-green-600 font-medium">{q.correctAnswer}</span></p>}
                                      {!isMultipleChoice && q.autoGrade && q.correctAnswer && <p className="text-sm text-gray-700">Expected Answer: <span className="text-green-600 font-medium">{q.correctAnswer}</span></p>}
                                      {submission[qIdx]?.working && <p className="text-sm text-gray-600 mt-1">Working: {submission[qIdx].working}</p>}
                                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-3">
                                        <label className="text-sm font-medium text-gray-700">Points (0-{Math.round(pointsPerQuestion)})</label>
                                        <input type="number" min="0" max={Math.round(pointsPerQuestion)} step="1" value={currentPoints} onChange={(e) => { const newPoints = parseFloat(e.target.value) || 0; const maxPoints = Math.round(pointsPerQuestion); const validPoints = Math.min(newPoints, maxPoints); setQuestionPoints(prev => ({ ...prev, [assignment.$id]: { ...(prev[assignment.$id] || {}), [qIdx]: validPoints } })); const updatedPoints = { ...questionPoints[assignment.$id], [qIdx]: validPoints }; let newTotal = 0; for (let i = 0; i < questionsList.length; i++) { newTotal += parseFloat(updatedPoints[i]) || 0; } setGradeData(prev => ({ ...prev, grade: Math.round(newTotal) })); }} className="w-20 p-1 border border-gray-300 rounded-lg" />
                                        <span className="text-xs text-gray-500">/ {Math.round(pointsPerQuestion)} pts</span>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Total Grade:</span>
                                <span className="text-xl font-bold text-indigo-600">{gradeData.grade || 0}/{assignment.maxScore}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Auto-calculated from per-question points</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                              <textarea value={gradeData.feedback} onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" rows="2" placeholder="Update feedback..." />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { handleUpdateGrade(assignment.$id); }} disabled={!gradeData.grade && gradeData.grade !== 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Save className="w-4 h-4 inline mr-1" /> Update Grade
                              </button>
                              <button onClick={() => { setEditingGrade(prev => ({ ...prev, [assignment.$id]: false })); setGradeData({ grade: "", feedback: "" }); setQuestionPoints({}); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">New Grade (0-{assignment.maxScore})</label>
                              <input type="number" min="0" max={assignment.maxScore} value={gradeData.grade} onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })} className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                              <textarea value={gradeData.feedback} onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" rows="2" placeholder="Update feedback..." />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateGrade(assignment.$id)} disabled={!gradeData.grade && gradeData.grade !== 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Save className="w-4 h-4 inline mr-1" /> Update Grade
                              </button>
                              <button onClick={() => { setEditingGrade(prev => ({ ...prev, [assignment.$id]: false })); setGradeData({ grade: "", feedback: "" }); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* LECTURER VIEW STUDENT ANSWERS */}
                    {canGrade && assignment.type === "quiz" && (
                      <div className="mt-3">
                        <button onClick={() => { setShowLecturerDetails(prev => ({ ...prev, [assignment.$id]: !prev[assignment.$id] })); }} className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                          {showLecturerDetails[assignment.$id] ? " Hide Student Answers ▲" : " View Student Answers ▼"}
                        </button>
                        {showLecturerDetails[assignment.$id] && (
                          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">📝 Student Answers:</h4>
                            <div className="space-y-3">
                              {questions.map((q, qIdx) => {
                                const studentAnswer = submission[qIdx]?.answer || "Not answered";
                                const isMultipleChoice = q.type === "multiple";
                                const isCorrect = isMultipleChoice && studentAnswer === q.correctAnswer;
                                const earnedPoints = savedQuestionGrades[qIdx] !== undefined ? savedQuestionGrades[qIdx] : (isMultipleChoice && isCorrect ? Math.round(pointsPerQuestion) : 0);
                                return (
                                  <div key={qIdx} className="p-3 bg-white rounded-lg border">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 mb-1">{qIdx + 1}. {q.text}</p>
                                        <p className="text-sm mt-1">
                                          <span className="font-medium text-gray-700">Student's Answer:</span>{' '}
                                          <span className={isMultipleChoice && isCorrect ? "text-green-600" : "text-gray-700"}>{studentAnswer}</span>
                                          {isMultipleChoice && (isCorrect ? <span className="ml-2 text-green-600">✓ Correct</span> : <span className="ml-2 text-red-600">✗ Incorrect</span>)}
                                        </p>
                                        {isMultipleChoice && !isCorrect && <p className="text-sm text-green-600 mt-1">✓ Correct answer: {q.correctAnswer}</p>}
                                        {!isMultipleChoice && q.autoGrade && q.correctAnswer && <p className="text-sm text-green-600 mt-1">✓ Expected answer: {q.correctAnswer}</p>}
                                        {submission[qIdx]?.working && <p className="text-sm text-gray-600 mt-1">Working: {submission[qIdx].working}</p>}
                                      </div>
                                      <div className="text-right min-w-[100px]">
                                        <span className="text-sm font-semibold text-blue-600">{earnedPoints.toFixed(1)}/{Math.round(pointsPerQuestion)} pts</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STUDENT DETAILED RESULTS */}
                {userProfile?.role === "student" && assignment.status === "graded" && assignment.type === "quiz" && showDetails[assignment.$id] && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">📝 Detailed Results:</h4>
                    <div className="space-y-3">
                      {questions.map((q, qIdx) => {
                        const studentAnswer = submission[qIdx]?.answer || "Not answered";
                        const isMultipleChoice = q.type === "multiple";
                        const isCorrect = isMultipleChoice && studentAnswer === q.correctAnswer;
                        const earnedPoints = savedQuestionGrades[qIdx] !== undefined ? savedQuestionGrades[qIdx] : (isMultipleChoice && isCorrect ? Math.round(pointsPerQuestion) : 0);
                        return (
                          <div key={qIdx} className="p-3 bg-white rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 mb-1">{qIdx + 1}. {q.text}</p>
                                <p className="text-sm mt-1">
                                  <span className="font-medium text-gray-700">Your Answer:</span>{' '}
                                  <span className={isMultipleChoice && isCorrect ? "text-green-600" : "text-gray-700"}>{studentAnswer}</span>
                                  {isMultipleChoice && (isCorrect ? <span className="ml-2 text-green-600">✓ Correct</span> : <span className="ml-2 text-red-600">✗ Incorrect</span>)}
                                </p>
                                {isMultipleChoice && !isCorrect && <p className="text-sm text-green-600 mt-1">✓ Correct answer: {q.correctAnswer}</p>}
                                {!isMultipleChoice && q.autoGrade && q.correctAnswer && studentAnswer.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim() && <p className="text-sm text-green-600 mt-1">✓ Expected answer: {q.correctAnswer}</p>}
                                {submission[qIdx]?.working && <p className="text-sm text-gray-600 mt-1">Working: {submission[qIdx].working}</p>}
                              </div>
                              <div className="text-right min-w-[100px]">
                                <span className="text-sm font-semibold text-blue-600">{earnedPoints.toFixed(1)}/{Math.round(pointsPerQuestion)} pts</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LECTURER GRADING SECTION */}
                {canGrade && assignment.status === "submitted" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {gradingAssignment === assignment.$id ? (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold">Grade: {assignment.title}</h4>
                        {assignment.type === "quiz" && (
                          <div className="space-y-4">
                            {questions.map((q, qIdx) => {
                              const studentAnswer = submission[qIdx]?.answer || "Not answered";
                              const isMultipleChoice = q.type === "multiple";
                              const isCorrect = isMultipleChoice && studentAnswer === q.correctAnswer;
                              const currentPoints = questionPoints[assignment.$id]?.[qIdx] ?? (isMultipleChoice && isCorrect ? Math.round(pointsPerQuestion) : 0);
                              return (
                                <div key={qIdx} className="p-4 bg-white rounded-lg border">
                                  <p className="font-medium mb-2">{qIdx + 1}. {q.text}</p>
                                  <p className="text-sm">Student's Answer: <span className={isMultipleChoice && isCorrect ? "text-green-600" : "text-gray-700"}>{studentAnswer}</span></p>
                                  {isMultipleChoice && <p className="text-sm">Correct Answer: <span className="text-green-600">{q.correctAnswer}</span> {isCorrect ? "✓ Correct" : "✗ Incorrect"}</p>}
                                  {!isMultipleChoice && q.autoGrade && q.correctAnswer && <p className="text-sm mt-1">Expected Answer: <span className="text-green-600">{q.correctAnswer}</span> {studentAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim() ? <span className="ml-2 text-green-600">✓ Matches</span> : <span className="ml-2 text-red-600">✗ Does not match</span>}</p>}
                                  {submission[qIdx]?.working && <p className="text-sm text-gray-600 mt-1">Working: {submission[qIdx].working}</p>}
                                  <div className="mt-3 pt-2 border-t">
                                    <label className="text-sm font-medium">Points (0-{Math.round(pointsPerQuestion)})</label>
                                    <input type="number" min="0" max={Math.round(pointsPerQuestion)} step="1" value={currentPoints} onChange={(e) => { const newPoints = parseFloat(e.target.value) || 0; const maxPoints = Math.round(pointsPerQuestion); const validPoints = Math.min(newPoints, maxPoints); setQuestionPoints(prev => ({ ...prev, [assignment.$id]: { ...(prev[assignment.$id] || {}), [qIdx]: validPoints } })); const updatedPoints = { ...questionPoints[assignment.$id], [qIdx]: validPoints }; let newTotal = 0; for (let i = 0; i < questions.length; i++) { newTotal += parseFloat(updatedPoints[i]) || 0; } setGradeData(prev => ({ ...prev, grade: Math.round(newTotal) })); }} className="w-24 p-1 border rounded-lg mt-1" />
                                    <span className="text-xs text-gray-500 ml-2">points</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {assignment.type === "file" && assignment.submission && (
                          <div className="p-3 bg-white rounded-lg border">
                            <button onClick={() => downloadAttachment(assignment.submission, "submission")} className="text-indigo-600 text-sm flex items-center gap-1">
                              <Paperclip className="w-4 h-4" />Download Student's File
                            </button>
                          </div>
                        )}
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <div className="flex justify-between">
                            <span className="font-medium">Total Grade:</span>
                            <span className="text-xl font-bold text-indigo-600">{gradeData.grade || 0}/{assignment.maxScore}</span>
                          </div>
                        </div>
                        <textarea value={gradeData.feedback} onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })} className="w-full p-2 border rounded-lg" rows="3" placeholder="Feedback to student..." />
                        <div className="flex gap-2">
                          <button onClick={() => handleGradeAssignment(assignment.$id)} disabled={!gradeData.grade && gradeData.grade !== 0} className="px-4 py-2 bg-green-600 text-white rounded-lg">Save Grade</button>
                          <button onClick={() => { setGradingAssignment(null); setQuestionPoints({}); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setGradingAssignment(assignment.$id); const initialPoints = {}; questions.forEach((q, idx) => { const studentAnswer = submission[idx]?.answer || ""; let earnedPoints = 0; if (q.type === "multiple") { if (studentAnswer === q.correctAnswer) { earnedPoints = Math.round(pointsPerQuestion); } } else if (q.type === "text" && q.autoGrade) { const normalizedStudent = studentAnswer.toLowerCase().trim(); const normalizedCorrect = (q.correctAnswer || "").toLowerCase().trim(); if (normalizedStudent === normalizedCorrect) { earnedPoints = Math.round(pointsPerQuestion); } } initialPoints[idx] = earnedPoints; }); const totalFromPoints = Object.values(initialPoints).reduce((sum, val) => sum + val, 0); setQuestionPoints({ [assignment.$id]: initialPoints }); setGradeData({ grade: totalFromPoints, feedback: assignment.feedback || "" }); }} className="flex items-center gap-2 px-4-py-2 text-green-600 hover:bg-green-50 rounded-lg">
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

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editingAssignment ? "Edit Assignment" : "Create Assignment"}</h2>
              <button onClick={resetModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Title *" className="w-full p-2 border rounded-lg" />
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Description / Instructions" rows="3" className="w-full p-2 border rounded-lg" />
              <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="Subject *" className="w-full p-2 border rounded-lg" />
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full p-2 border rounded-lg" />
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="file">File Upload Assignment</option>
                <option value="quiz">Quiz Assignment</option>
              </select>
              {formData.type === "file" && (
                <input type="file" onChange={(e) => setFormData({...formData, attachmentFile: e.target.files[0]})} className="w-full p-2 border rounded-lg" />
              )}
              <select value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="all">All Students</option>
              </select>
              <input type="number" min="1" max="100" value={formData.maxScore} onChange={(e) => setFormData({...formData, maxScore: e.target.value})} className="w-32 p-2 border rounded-lg" placeholder="Max Score" />
              {formData.type === "quiz" && (
                <div className="border-t pt-4">
                  <label className="font-medium block mb-4">Questions</label>
                  {formData.questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 border rounded-lg mb-4">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Question {qIdx + 1}</h4>
                        <button onClick={() => removeQuestion(qIdx)} className="text-red-600"><MinusCircle className="w-4 h-4" /></button>
                      </div>
                      <input type="text" value={q.text} onChange={(e) => updateQuestion(qIdx, "text", e.target.value)} placeholder="Question text" className="w-full p-2 border rounded-lg my-2" />
                      <select value={q.type} onChange={(e) => updateQuestion(qIdx, "type", e.target.value)} className="w-full p-2 border rounded-lg mb-2">
                        <option value="multiple">Multiple Choice</option>
                        <option value="text">Text Answer</option>
                      </select>
                      {q.type === "multiple" ? (
                        <>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex gap-2 mb-2">
                              <input type="text" value={opt} onChange={(e) => updateOption(qIdx, optIdx, e.target.value)} placeholder={`Option ${optIdx + 1}`} className="flex-1 p-2 border rounded-lg" />
                              <button onClick={() => removeOption(qIdx, optIdx)} className="text-red-600"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                          <button onClick={() => addOption(qIdx)} className="text-sm text-indigo-600 mb-2">+ Add Option</button>
                          <select value={q.correctAnswer} onChange={(e) => updateQuestion(qIdx, "correctAnswer", e.target.value)} className="w-full p-2 border rounded-lg">
                            <option value="">Select correct answer</option>
                            {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                          </select>
                          <div className="mt-2 flex items-center gap-2">
                            <input type="checkbox" checked={q.showWorking} onChange={(e) => updateQuestion(qIdx, "showWorking", e.target.checked)} className="w-4 h-4" />
                            <label className="text-sm">Allow students to show working</label>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={q.autoGrade} onChange={(e) => updateQuestion(qIdx, "autoGrade", e.target.checked)} className="w-4 h-4" />
                            <label className="text-sm">Auto-grade this question</label>
                          </div>
                          {q.autoGrade && (
                            <input type="text" value={q.correctAnswer || ""} onChange={(e) => updateQuestion(qIdx, "correctAnswer", e.target.value)} placeholder="Correct answer" className="w-full p-2 border rounded-lg mb-2" />
                          )}
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={q.showWorking} onChange={(e) => updateQuestion(qIdx, "showWorking", e.target.checked)} className="w-4 h-4" />
                            <label className="text-sm">Allow students to show working</label>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <button onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                    <PlusCircle className="w-5 h-5" />Add Question
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={resetModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreateAssignment} disabled={!formData.title || !formData.subject} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                {editingAssignment ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}