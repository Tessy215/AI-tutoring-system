import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

const coursesByField = {
  computing: [
    { id: "web-dev", name: "Web Development", emoji: "🌐" },
    { id: "data-structures", name: "Data Structures", emoji: "🗂️" },
    { id: "networking", name: "Networking", emoji: "🔌" },
    { id: "database", name: "Database Systems", emoji: "🗄️" },
    { id: "ai-ml", name: "AI & Machine Learning", emoji: "🤖" },
    { id: "cyber-security", name: "Cyber Security", emoji: "🔐" },
    { id: "mobile-dev", name: "Mobile Development", emoji: "📱" },
    { id: "cloud", name: "Cloud Computing", emoji: "☁️" },
  ],
  business: [
    { id: "accounting", name: "Accounting", emoji: "📊" },
    { id: "marketing", name: "Marketing", emoji: "📣" },
    { id: "management", name: "Management", emoji: "👔" },
    { id: "finance", name: "Finance", emoji: "💰" },
    { id: "entrepreneurship", name: "Entrepreneurship", emoji: "🚀" },
    { id: "economics", name: "Economics", emoji: "📈" },
    { id: "hr", name: "Human Resources", emoji: "👥" },
    { id: "business-law", name: "Business Law", emoji: "📜" },
  ],
  health: [
    { id: "anatomy", name: "Anatomy", emoji: "🫀" },
    { id: "pharmacology", name: "Pharmacology", emoji: "💊" },
    { id: "nursing", name: "Nursing", emoji: "🩺" },
    { id: "public-health", name: "Public Health", emoji: "🏥" },
    { id: "nutrition", name: "Nutrition", emoji: "🥗" },
    { id: "physiology", name: "Physiology", emoji: "🧬" },
    { id: "medical-ethics", name: "Medical Ethics", emoji: "⚕️" },
    { id: "psychology", name: "Psychology", emoji: "🧠" },
  ],
  arts: [
    { id: "literature", name: "Literature", emoji: "📖" },
    { id: "history", name: "History", emoji: "🏛️" },
    { id: "philosophy", name: "Philosophy", emoji: "🤔" },
    { id: "fine-arts", name: "Fine Arts", emoji: "🎨" },
    { id: "music", name: "Music", emoji: "🎵" },
    { id: "film", name: "Film & Media", emoji: "🎬" },
    { id: "linguistics", name: "Linguistics", emoji: "🗣️" },
    { id: "creative-writing", name: "Creative Writing", emoji: "✍️" },
  ],
  law: [
    { id: "constitutional", name: "Constitutional Law", emoji: "📜" },
    { id: "criminal", name: "Criminal Law", emoji: "⚖️" },
    { id: "corporate", name: "Corporate Law", emoji: "🏢" },
    { id: "international", name: "International Law", emoji: "🌐" },
    { id: "human-rights", name: "Human Rights", emoji: "✊" },
    { id: "property", name: "Property Law", emoji: "🏠" },
    { id: "family", name: "Family Law", emoji: "👨‍👩‍👧" },
    { id: "criminology", name: "Criminology", emoji: "🔍" },
  ],
  stem: [
    { id: "mathematics", name: "Mathematics", emoji: "📐" },
    { id: "physics", name: "Physics", emoji: "⚛️" },
    { id: "chemistry", name: "Chemistry", emoji: "🧪" },
    { id: "biology", name: "Biology", emoji: "🧬" },
    { id: "engineering", name: "Engineering", emoji: "⚙️" },
    { id: "statistics", name: "Statistics", emoji: "📊" },
    { id: "environmental", name: "Environmental Science", emoji: "🌿" },
    { id: "astronomy", name: "Astronomy", emoji: "🔭" },
  ],
  education: [
    { id: "curriculum", name: "Curriculum Design", emoji: "📋" },
    { id: "early-childhood", name: "Early Childhood", emoji: "👶" },
    { id: "special-needs", name: "Special Needs Education", emoji: "🤝" },
    { id: "educational-tech", name: "Educational Technology", emoji: "💻" },
    { id: "counseling", name: "School Counseling", emoji: "💬" },
    { id: "administration", name: "School Administration", emoji: "🏫" },
    { id: "teaching-methods", name: "Teaching Methods", emoji: "📝" },
    { id: "assessment", name: "Assessment & Evaluation", emoji: "✅" },
  ],
  social: [
    { id: "sociology", name: "Sociology", emoji: "👥" },
    { id: "political-science", name: "Political Science", emoji: "🏛️" },
    { id: "social-psychology", name: "Social Psychology", emoji: "🧠" },
    { id: "anthropology", name: "Anthropology", emoji: "🌍" },
    { id: "social-work", name: "Social Work", emoji: "🤝" },
    { id: "international-relations", name: "International Relations", emoji: "🌐" },
    { id: "gender-studies", name: "Gender Studies", emoji: "♾️" },
    { id: "media-studies", name: "Media Studies", emoji: "📺" },
  ],
};

export default function SelectCourses() {
  const navigate = useNavigate();
  const [selectedCourses, setSelectedCourses] = useState([]);

  // Get the field selected in previous step
  const selectedField = localStorage.getItem("onboarding_field");

  // Get courses for that field, fallback to empty if field not found
  const courses = coursesByField[selectedField] || [];

  const toggleCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleContinue = () => {
    if (selectedCourses.length > 0) {
      localStorage.setItem("onboarding_courses", JSON.stringify(selectedCourses));
      navigate("/onboarding/select-goals");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="mb-8">

          {/* Progress bar - step 2 of 3 */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
            <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
          </div>

          <button
            onClick={() => navigate("/onboarding/select-field")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Which courses are you taking?
          </h1>
          <p className="text-gray-600">
            Select all courses you are currently studying. You can change this later.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {courses.map((course) => {
            const isSelected = selectedCourses.includes(course.id);
            return (
              <button
                key={course.id}
                onClick={() => toggleCourse(course.id)}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="text-3xl mb-2">{course.emoji}</div>
                <p className={`font-medium text-sm ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                  {course.name}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedCourses.length} course{selectedCourses.length !== 1 ? "s" : ""} selected
          </p>
          <button
            onClick={handleContinue}
            disabled={selectedCourses.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}