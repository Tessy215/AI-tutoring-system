import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { databases } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../lib/config";
import { Query } from "appwrite";
import { 
  Lightbulb, TrendingUp, BookOpen, Video, FileText, 
  Target, ArrowRight, AlertCircle, CheckCircle, 
  Clock, BarChart3, Star, ThumbsUp, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "../components/Skeleton.jsx";

export default function Recommendations() {
  const { user, userProfile } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    weakSubjects: [],
    strongSubjects: [],
    averageSubjects: [],
    overallAvg: 0,
    pendingTasks: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    if (user && userProfile?.role === "student") {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Load assignments with grades - using assignedTo
      const assignmentsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSIGNMENTS,
        [
          Query.or([
            Query.equal("assignedTo", user.$id),
            Query.equal("assignedTo", "all")
          ]),
          Query.isNotNull("grade")
        ]
      );
      
      // Load tasks
      const tasksRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        [Query.equal("userId", user.$id)]
      );
      
      // Analyze subject performance - using percentage
      const subjectGrades = {};
      assignmentsRes.documents.forEach(assignment => {
        const subject = assignment.subject || "Uncategorized";
        if (!subjectGrades[subject]) {
          subjectGrades[subject] = { total: 0, count: 0 };
        }
        const percentage = (assignment.grade / assignment.maxScore) * 100;
        subjectGrades[subject].total += percentage;
        subjectGrades[subject].count++;
      });
      
      const weakSubjects = [];
      const averageSubjects = [];
      const strongSubjects = [];
      
      for (const [subject, data] of Object.entries(subjectGrades)) {
        const avg = data.total / data.count;
        if (avg < 50) {
          weakSubjects.push({ subject, avg, count: data.count });
        } else if (avg >= 50 && avg < 70) {
          averageSubjects.push({ subject, avg, count: data.count });
        } else if (avg >= 80) {
          strongSubjects.push({ subject, avg, count: data.count });
        }
      }
      
      weakSubjects.sort((a, b) => a.avg - b.avg);
      averageSubjects.sort((a, b) => a.avg - b.avg);
      strongSubjects.sort((a, b) => b.avg - a.avg);
      
      const overallAvg = assignmentsRes.documents.length > 0
        ? assignmentsRes.documents.reduce((sum, a) => sum + ((a.grade / a.maxScore) * 100), 0) / assignmentsRes.documents.length
        : 0;
      
      const pendingTasks = tasksRes.documents.filter(t => !t.completed).length;
      
      setPerformanceData({
        weakSubjects,
        averageSubjects,
        strongSubjects,
        overallAvg: Math.round(overallAvg),
        pendingTasks,
        unreadNotifications: 0,
      });
      
      // Generate recommendations
      const generatedRecommendations = [];
      
      // 1. Subject improvement recommendations - only for <50%
      weakSubjects.forEach(subject => {
        generatedRecommendations.push({
          id: `weak-${subject.subject}`,
          title: `Improve Your ${subject.subject} Skills`,
          description: `Your average in ${subject.subject} is ${Math.round(subject.avg)}%. Focus on this subject to boost your overall grade.`,
          type: "improvement",
          priority: "high",
          action: "Study",
          actionLink: "/dashboard/resources",
          icon: TrendingUp,
        });
      });
      
      // 2. Average subject recommendations - 50-69%
      averageSubjects.forEach(subject => {
        generatedRecommendations.push({
          id: `average-${subject.subject}`,
          title: `Strengthen Your ${subject.subject} Foundation`,
          description: `Your average in ${subject.subject} is ${Math.round(subject.avg)}%. Keep practicing to reach the next level.`,
          type: "improvement",
          priority: "medium",
          action: "Study",
          actionLink: "/dashboard/resources",
          icon: Target,
        });
      });
      
      // 3. Resource recommendations
      if (weakSubjects.length > 0 || averageSubjects.length > 0) {
        const resourcesRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES);
        const weakSubjectNames = weakSubjects.map(s => s.subject);
        const avgSubjectNames = averageSubjects.map(s => s.subject);
        const allSubjectsToHelp = [...weakSubjectNames, ...avgSubjectNames];
        
        const relevantResources = resourcesRes.documents.filter(r => 
          allSubjectsToHelp.some(s => r.course?.toLowerCase().includes(s.toLowerCase()))
        );
        
        if (relevantResources.length > 0) {
          generatedRecommendations.push({
            id: "resources",
            title: "Recommended Study Materials",
            description: `We found ${relevantResources.length} resources to help strengthen your understanding.`,
            type: "resource",
            priority: "medium",
            action: "View Resources",
            actionLink: "/dashboard/resources",
            icon: BookOpen,
          });
        }
      }
      
      // 4. Task completion recommendation
      if (pendingTasks > 0) {
        generatedRecommendations.push({
          id: "tasks",
          title: `${pendingTasks} Pending Task${pendingTasks > 1 ? "s" : ""}`,
          description: `You have ${pendingTasks} incomplete task${pendingTasks > 1 ? "s" : ""}. Complete them to stay on track.`,
          type: "task",
          priority: pendingTasks > 3 ? "high" : "medium",
          action: "View Tasks",
          actionLink: "/dashboard/tasks",
          icon: CheckCircle,
        });
      }
      
      // 5. Overall grade recommendation
      if (overallAvg < 50 && overallAvg > 0) {
        generatedRecommendations.push({
          id: "overall",
          title: "Boost Your Overall Grade",
          description: `Your current average is ${Math.round(overallAvg)}%. Focus on weak subjects and complete pending assignments.`,
          type: "improvement",
          priority: "high",
          action: "View Progress",
          actionLink: "/dashboard/progress",
          icon: Target,
        });
      } else if (overallAvg >= 50 && overallAvg < 70) {
        generatedRecommendations.push({
          id: "overall-average",
          title: "Keep Building Momentum",
          description: `You're averaging ${Math.round(overallAvg)}%. Consistent effort will help you improve further.`,
          type: "improvement",
          priority: "medium",
          action: "View Progress",
          actionLink: "/dashboard/progress",
          icon: TrendingUp,
        });
      } else if (overallAvg >= 85 && overallAvg > 0) {
        generatedRecommendations.push({
          id: "excellent",
          title: "Excellent Performance! 🎉",
          description: `You're averaging ${Math.round(overallAvg)}%. Keep up the great work! Consider helping classmates or exploring advanced topics.`,
          type: "achievement",
          priority: "low",
          action: "View Progress",
          actionLink: "/dashboard/progress",
          icon: Star,
        });
      }
      
      // 6. Goals-based recommendation
      if (userProfile?.goals && userProfile.goals.length > 0) {
        const goal = userProfile.goals[0];
        const goalMessages = {
          "improve-grades": "Focus on your weak subjects to improve your grades.",
          "exam-prep": "Review past assignments and practice with quizzes.",
          "homework-help": "Check resources and ask AI Assistant for help.",
          "learn-faster": "Use active recall and practice problems.",
          "stay-organized": "Use the Tasks page to track your deadlines.",
          "career-prep": "Explore advanced topics beyond your curriculum.",
        };
        
        generatedRecommendations.push({
          id: "goal",
          title: `Your Goal: ${goal.replace(/-/g, " ")}`,
          description: goalMessages[goal] || "Keep working towards your learning goals!",
          type: "goal",
          priority: "medium",
          action: "View Profile",
          actionLink: "/dashboard/profile",
          icon: Target,
        });
      }
      
      // 7. AI Assistant recommendation
      generatedRecommendations.push({
        id: "ai-assistant",
        title: "Need Help? Ask AI Tutor",
        description: "Get explanations, summaries, and practice questions from our AI Assistant.",
        type: "ai",
        priority: "low",
        action: "Chat with AI",
        actionLink: "/dashboard/ai-assistant",
        icon: Sparkles,
      });
      
      setRecommendations(generatedRecommendations);
      
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "border-red-500 bg-red-50";
      case "medium": return "border-yellow-500 bg-yellow-50";
      default: return "border-green-500 bg-green-50";
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case "high": return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">High Priority</span>;
      case "medium": return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Medium Priority</span>;
      default: return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Low Priority</span>;
    }
  };

  const getScoreColor = (score) => {
    if (score < 50) return "text-red-600 bg-red-50 border-red-200";
    if (score < 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score < 85) return "text-green-600 bg-green-50 border-green-200";
    return "text-purple-600 bg-purple-50 border-purple-200";
  };

  // Lecturer view
  if (userProfile?.role === "lecturer") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Class Recommendations</h1>
          <p className="text-gray-600 mt-1">Insights to help your students succeed</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
              <h2 className="font-semibold text-gray-900">Student Performance Overview</h2>
            </div>
            <p className="text-gray-600 mb-4">Track class averages and identify struggling students.</p>
            <Link to="/dashboard/students" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
              View Students <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg"><FileText className="w-5 h-5 text-green-600" /></div>
              <h2 className="font-semibold text-gray-900">Resource Engagement</h2>
            </div>
            <p className="text-gray-600 mb-4">See which resources are most helpful to your students.</p>
            <Link to="/dashboard/resources" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
              Manage Resources <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin view
  if (userProfile?.role === "admin") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600 mt-1">Overview of platform usage and performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-500 text-sm">Advanced analytics and recommendations for admins are in development.</p>
          </div>
        </div>
      </div>
    );
  }

 if (loading) {
   return (
     <div className="p-6">
       <Skeleton className="h-8 w-64 mb-2" />
       <Skeleton className="h-4 w-96 mb-6" />
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
       <div className="space-y-4">
         {[1, 2, 3].map(i => (
           <div
             key={i}
             className="bg-white p-5 rounded-xl border border-gray-200"
           >
             <div className="flex items-center gap-3 mb-2">
               <Skeleton className="h-5 w-5 rounded" />
               <Skeleton className="h-6 w-48" />
               <Skeleton className="h-5 w-20 rounded-full" />
             </div>
             <Skeleton className="h-4 w-full mb-2" />
             <Skeleton className="h-4 w-3/4" />
           </div>
         ))}
       </div>
     </div>
   )
 }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Personalized Recommendations</h1>
        <p className="text-gray-600 mt-1">
          AI-powered suggestions based on your learning activity and performance
        </p>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg"><BarChart3 className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{performanceData.overallAvg}%</p>
              <p className="text-sm text-gray-500">Overall Average</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold text-red-600">{performanceData.weakSubjects.length}</p>
              <p className="text-sm text-gray-500">Needs Improvement</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><ThumbsUp className="w-5 h-5 text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{performanceData.averageSubjects.length}</p>
              <p className="text-sm text-gray-500">Average Subjects</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-green-600">{performanceData.strongSubjects.length}</p>
              <p className="text-sm text-gray-500">Strong Subjects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{performanceData.pendingTasks}</p>
            <p className="text-sm text-gray-500">Pending Tasks</p>
          </div>
        </div>
      </div>

      {/* Subjects Needing Attention */}
      {performanceData.weakSubjects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Subjects Needing Attention (&lt;50%)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {performanceData.weakSubjects.map((subject) => (
              <div key={subject.subject} className="bg-red-50 p-4 rounded-xl border border-red-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-red-800 capitalize">{subject.subject}</span>
                  <span className="text-sm font-semibold text-red-700">{Math.round(subject.avg)}%</span>
                </div>
                <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(subject.avg, 100)}%` }}></div>
                </div>
                <p className="text-xs text-red-600 mt-2">{subject.count} graded assignment{subject.count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Subjects (50-69%) */}
      {performanceData.averageSubjects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-yellow-600" />
            Average Subjects (50-69%)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {performanceData.averageSubjects.map((subject) => (
              <div key={subject.subject} className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-yellow-800 capitalize">{subject.subject}</span>
                  <span className="text-sm font-semibold text-yellow-700">{Math.round(subject.avg)}%</span>
                </div>
                <div className="mt-2 h-2 bg-yellow-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(subject.avg, 100)}%` }}></div>
                </div>
                <p className="text-xs text-yellow-600 mt-2">{subject.count} graded assignment{subject.count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Subjects (80%+) */}
      {performanceData.strongSubjects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-green-600" />
            Strong Subjects (80%+)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {performanceData.strongSubjects.map((subject) => (
              <div key={subject.subject} className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800 capitalize">{subject.subject}</span>
                  <span className="text-sm font-semibold text-green-700">{Math.round(subject.avg)}%</span>
                </div>
                <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(subject.avg, 100)}%` }}></div>
                </div>
                <p className="text-xs text-green-600 mt-2">{subject.count} graded assignment{subject.count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Suggested Actions</h2>
        {recommendations.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recommendations yet. Complete more assignments to get personalized suggestions.</p>
          </div>
        ) : (
          recommendations.map((rec) => {
            const Icon = rec.icon;
            return (
              <div
                key={rec.id}
                className={`bg-white p-5 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Icon className="w-5 h-5 text-gray-700" />
                      <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-gray-600 mb-3">{rec.description}</p>
                    <Link
                      to={rec.actionLink}
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {rec.action}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-indigo-900">Quick Study Tips</h3>
            <p className="text-sm text-indigo-800 mt-1">
              • Review your weak subjects for 30 minutes daily<br />
              • Complete pending tasks before their due dates<br />
              • Use the AI Assistant to explain difficult concepts<br />
              • Check resources for additional study materials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}