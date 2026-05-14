import { useState } from "react";
// CHANGED: react-router -> react-router-dom
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

export default function SelectInterests() {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState([]);

  // CHANGED: replaced school subjects with universal study categories
  const interests = [
    { id: "stem", name: "STEM", emoji: "🔬" },
    { id: "business", name: "Business", emoji: "💼" },
    { id: "arts", name: "Arts", emoji: "🎨" },
    { id: "health", name: "Health Sciences", emoji: "🏥" },
    { id: "law", name: "Law", emoji: "⚖️" },
    { id: "computing", name: "Computing", emoji: "💻" },
    { id: "education", name: "Education", emoji: "📚" },
    { id: "engineering", name: "Engineering", emoji: "⚙️" },
    { id: "social", name: "Social Sciences", emoji: "🌍" },
    { id: "languages", name: "Languages", emoji: "🗣️" },
    { id: "media", name: "Media & Comm", emoji: "📱" },
    { id: "agriculture", name: "Agriculture", emoji: "🌱" },
  ];

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedInterests.length > 0) {
      localStorage.setItem("onboarding_interests", JSON.stringify(selectedInterests));
      navigate("/onboarding/select-goals");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="mb-8">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
          </div>

          <button
            onClick={() => navigate("/onboarding/welcome")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            What are your study interests?
          </h1>
          <p className="text-gray-600">
            Select all areas you are currently studying. You can change this later.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {interests.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`relative p-6 rounded-xl border-2 transition-all ${
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
                <div className="text-4xl mb-2">{interest.emoji}</div>
                <p className={`font-medium ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                  {interest.name}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedInterests.length} interest{selectedInterests.length !== 1 ? "s" : ""} selected
          </p>
          <button
            onClick={handleContinue}
            disabled={selectedInterests.length === 0}
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