import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useState } from "react";

const fields = [
  { id: "computing", name: "Computing", emoji: "💻", description: "Software, networks, data and systems" },
  { id: "business", name: "Business", emoji: "💼", description: "Management, finance, marketing and entrepreneurship" },
  { id: "health", name: "Health Sciences", emoji: "🏥", description: "Medicine, nursing, pharmacy and public health" },
  { id: "arts", name: "Arts & Humanities", emoji: "🎨", description: "Literature, history, philosophy and creative arts" },
  { id: "law", name: "Law", emoji: "⚖️", description: "Legal studies, criminology and justice" },
  { id: "stem", name: "STEM", emoji: "🔬", description: "Science, technology, engineering and mathematics" },
  { id: "education", name: "Education", emoji: "📚", description: "Teaching, curriculum and learning development" },
  { id: "social", name: "Social Sciences", emoji: "🌍", description: "Psychology, sociology and political science" },
];

export default function SelectField() {
  const navigate = useNavigate();
  const [selectedField, setSelectedField] = useState(null);
  const [selectedRole, setSelectedRole] = useState("student"); // Default to student role

  const handleContinue = () => {
    if (selectedField) {
      localStorage.setItem("onboarding_field", selectedField);
      localStorage.setItem("onboarding_role", selectedRole);
      navigate("/onboarding/select-courses");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="mb-8">
          {/* Progress bar - step 1 of 3 */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
          </div>

          <button
            onClick={() => navigate("/onboarding/welcome")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">What is your field of study?</h1>
          <p className="text-gray-600">
            Select your primary field. This helps us suggest the most relevant courses and
            materials.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Select your role</h2>

          <div className="flex gap-3">
            {["student", "lecturer"].map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedRole === role ? "bg-indigo-600 text-white" : "bg-white text-gray-700"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {fields.map(field => {
            const isSelected = selectedField === field.id
            return (
              <button
                key={field.id}
                onClick={() => setSelectedField(field.id)}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-3xl mb-2">{field.emoji}</div>
                <p
                  className={`font-semibold mb-1 ${isSelected ? "text-indigo-900" : "text-gray-900"}`}
                >
                  {field.name}
                </p>
                <p className="text-xs text-gray-500">{field.description}</p>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedField ? "1 field selected" : "No field selected yet"}
          </p>
          <button
            onClick={handleContinue}
            disabled={!selectedField}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}