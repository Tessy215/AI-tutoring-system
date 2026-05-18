// CHANGED: react-router -> react-router-dom
import { useNavigate } from "react-router-dom";
import { Sparkles, BookOpen, Target, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "../../Contexts/AuthContext.jsx";

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: "Personalized Learning",
      description: "AI-powered recommendations tailored to your learning style",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and achieve your academic goals with smart insights",
    },
    {
      icon: TrendingUp,
      title: "Progress Analytics",
      description: "Visualize your growth with detailed performance metrics",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {/* CHANGED: user?.name shows dynamic name from AuthContext */}
            Welcome to AI Tutor, {user?.name}!
          </h1>
          <p className="text-xl text-gray-600">
            Let's personalize your learning experience in just a few steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate("/onboarding/select-interests")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-4">This will only take a minute</p>
        </div>
      </div>
    </div>
  );
}