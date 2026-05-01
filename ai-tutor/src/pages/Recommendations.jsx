import { Lightbulb, TrendingUp, BookOpen, Video, FileText, Trophy } from "lucide-react";

const recommendations = [
  {
    id: 1,
    title: "Focus on Algebra Practice",
    reason: "Based on your recent quiz scores, additional practice in quadratic equations could help improve performance",
    subject: "Mathematics",
    type: "practice",
    priority: "high",
    resources: ["Khan Academy - Quadratic Equations", "Practice Worksheet 15"],
  },
  {
    id: 2,
    title: "Review Scientific Method",
    reason: "You've shown strong understanding in lab work but could benefit from reviewing the theoretical aspects",
    subject: "Biology",
    type: "review",
    priority: "medium",
    resources: ["Chapter 2 Notes", "Biology Video Series"],
  },
  {
    id: 3,
    title: "Expand Vocabulary",
    reason: "Your essays are well-structured, but incorporating more advanced vocabulary would enhance your writing",
    subject: "English",
    type: "enhancement",
    priority: "low",
    resources: ["SAT Vocabulary Builder", "Weekly Word Lists"],
  },
  {
    id: 4,
    title: "World War II Timeline",
    reason: "Given your interest in modern history, this deep dive would complement your current coursework",
    subject: "History",
    type: "enrichment",
    priority: "medium",
    resources: ["Documentary Series", "Interactive Timeline Tool"],
  },
];

const learningPaths = [
  {
    title: "Master Calculus Fundamentals",
    progress: 65,
    lessons: 12,
    completed: 8,
    icon: TrendingUp,
    color: "indigo",
  },
  {
    title: "English Literature Deep Dive",
    progress: 40,
    lessons: 15,
    completed: 6,
    icon: BookOpen,
    color: "purple",
  },
  {
    title: "Chemistry Lab Techniques",
    progress: 80,
    lessons: 10,
    completed: 8,
    icon: Trophy,
    color: "green",
  },
];

export default function Recommendations() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Personalized Recommendations</h1>
        <p className="text-gray-600 mt-1">AI-powered suggestions based on your learning activity and performance</p>
      </div>

      {/* Learning Paths */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Continue Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learningPaths.map((path, index) => {
            const Icon = path.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-${path.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${path.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{path.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{path.completed} of {path.lessons} lessons completed</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`bg-${path.color}-600 h-2 rounded-full transition-all`}
                    style={{ width: `${path.progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">{path.progress}% complete</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended Actions</h2>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`bg-white p-6 rounded-xl border-l-4 border ${
                rec.priority === "high" ? "border-red-500" :
                rec.priority === "medium" ? "border-yellow-500" :
                "border-green-500"
              } shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    rec.priority === "high" ? "bg-red-50" :
                    rec.priority === "medium" ? "bg-yellow-50" :
                    "bg-green-50"
                  }`}>
                    <Lightbulb className={`w-5 h-5 ${
                      rec.priority === "high" ? "text-red-600" :
                      rec.priority === "medium" ? "text-yellow-600" :
                      "text-green-600"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {rec.subject}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rec.reason}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  rec.priority === "high" ? "bg-red-100 text-red-600" :
                  rec.priority === "medium" ? "bg-yellow-100 text-yellow-600" :
                  "bg-green-100 text-green-600"
                }`}>
                  {rec.priority} priority
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-sm text-gray-600 mb-2">Recommended Resources:</p>
                <div className="flex flex-wrap gap-2">
                  {rec.resources.map((resource, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full"
                    >
                      {resource.includes("Video") ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      {resource}
                    </span>
                  ))}
                </div>
              </div>

              <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                Start Learning
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}