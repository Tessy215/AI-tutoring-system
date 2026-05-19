import { Calendar, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";

const assignments = [
  {
    id: 1,
    title: "Quadratic Equations Problem Set",
    subject: "Mathematics",
    dueDate: "Apr 5, 2026",
    status: "in-progress",
    progress: 75,
    grade: null,
    description: "Complete problems 1-20 from Chapter 7",
  },
  {
    id: 2,
    title: "Chemistry Lab Report",
    subject: "Chemistry",
    dueDate: "Apr 4, 2026",
    status: "overdue",
    progress: 60,
    grade: null,
    description: "Write a detailed report on the acid-base titration experiment",
  },
  {
    id: 3,
    title: "World War II Essay",
    subject: "History",
    dueDate: "Apr 10, 2026",
    status: "not-started",
    progress: 0,
    grade: null,
    description: "5-page essay analyzing the causes and effects of WWII",
  },
  {
    id: 4,
    title: "Spanish Conversation Practice",
    subject: "Spanish",
    dueDate: "Mar 30, 2026",
    status: "graded",
    progress: 100,
    grade: 92,
    description: "10-minute recorded conversation",
  },
  {
    id: 5,
    title: "Biology Cell Structure Diagram",
    subject: "Biology",
    dueDate: "Mar 28, 2026",
    status: "graded",
    progress: 100,
    grade: 88,
    description: "Label all major cell organelles and their functions",
  },
  {
    id: 6,
    title: "English Literature Analysis",
    subject: "English",
    dueDate: "Apr 12, 2026",
    status: "not-started",
    progress: 0,
    grade: null,
    description: "Character analysis of Hamlet",
  },
];

export default function Assignments() {
  const activeAssignments = assignments.filter((a) => a.status !== "graded");
  const gradedAssignments = assignments.filter((a) => a.status === "graded");

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-600 mt-1">Track and manage your course assignments</p>
      </div>

      {/* Active Assignments */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Assignments ({activeAssignments.length})
        </h2>
        <div className="space-y-4">
          {activeAssignments.map((assignment) => {
            const badge = getStatusBadge(assignment.status);
            const StatusIcon = badge.icon;

            return (
              <div
                key={assignment.id}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex  flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
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
                      <span
                        className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${badge.color}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {badge.text}
                      </span>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
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
      </div>

      {/* Graded Assignments */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Graded Assignments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gradedAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white p-5 rounded-xl border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {assignment.subject}
                  </span>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      assignment.grade >= 90
                        ? "text-green-600"
                        : assignment.grade >= 80
                        ? "text-blue-600"
                        : assignment.grade >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {assignment.grade}%
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
                <button className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  View Feedback
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}