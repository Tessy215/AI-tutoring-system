import { useState } from "react";
// CHANGED: react-router -> react-router-dom
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../../Contexts/AuthContext.jsx";

export default function SelectGoals() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const goals = [
    { id: "improve-grades", name: "Improve Grades", icon: "📈" },
    { id: "exam-prep", name: "Prepare for Exams", icon: "📝" },
    { id: "homework-help", name: "Get Homework Help", icon: "✏️" },
    { id: "learn-faster", name: "Learn Faster", icon: "⚡" },
    { id: "stay-organized", name: "Stay Organized", icon: "📋" },
    { id: "build-confidence", name: "Build Confidence", icon: "💪" },
    { id: "career-prep", name: "Career Preparation", icon: "🎓" },
    { id: "explore-topics", name: "Explore New Topics", icon: "🔍" },
  ];

  const toggleGoal = (goalId) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleComplete = async () => {
    if (selectedGoals.length === 0) return;

    setIsLoading(true);

    // CHANGED: onboarding_subjects -> onboarding_interests to match SelectInterests.jsx
    const field = localStorage.getItem("onboarding_field");
    const courses = JSON.parse(localStorage.getItem("onboarding_courses") || "[]");
    const role = localStorage.getItem("onboarding_role") || "student";


    await completeOnboarding(field, courses, selectedGoals, role);

    // CHANGED: cleanup key name updated
    localStorage.removeItem("onboarding_field");
    localStorage.removeItem("onboarding_courses");
    localStorage.removeItem("onboarding_role");

    setIsLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="mb-8">
          {/* Progress bar - both filled since this is last step */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
            <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
          </div>

          {/* CHANGED: back button goes to select-courses not select-field */}
          <button
            onClick={() => navigate("/onboarding/select-courses")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            What are your learning goals?
          </h1>
          <p className="text-gray-600">
            Select your goals to help us personalize your experience. Choose all that apply.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{goal.icon}</div>
                  <p className={`font-medium text-lg ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                    {goal.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedGoals.length} goal{selectedGoals.length !== 1 ? "s" : ""} selected
          </p>
          <button
            onClick={handleComplete}
            disabled={selectedGoals.length === 0 || isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Setting up..." : "Complete Setup"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}