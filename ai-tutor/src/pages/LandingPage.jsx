import { Link } from "react-router-dom";
import { 
  Sparkles, 
  BookOpen, 
  CheckSquare, 
  TrendingUp, 
  Lightbulb,
  Users,
  GraduationCap,
  ArrowRight,
  Bot,
  FileText,
  BarChart3,
  Star,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Bot,
      title: "AI Tutor Assistant",
      description: "Ask questions, get explanations, summarize PDFs, and generate quizzes using AI.",
      color: "indigo"
    },
    {
      icon: CheckSquare,
      title: "Assignment Management",
      description: "Create, submit, and grade assignments. Support for file uploads and auto-graded quizzes.",
      color: "blue"
    },
    {
      icon: BookOpen,
      title: "Resource Sharing",
      description: "Upload and share learning materials. Students can access resources anytime, anywhere.",
      color: "green"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Track grades, visualize performance trends, and identify areas for improvement.",
      color: "purple"
    },
    {
      icon: Lightbulb,
      title: "Smart Recommendations",
      description: "Personalized resource recommendations based on your performance and learning goals.",
      color: "yellow"
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Dedicated dashboards for Students, Lecturers, and Admins with tailored features.",
      color: "pink"
    }
  ];

  const stats = [
    { value: "100%", label: "Free for Students", icon: Star },
    { value: "24/7", label: "AI Availability", icon: Bot },
    { value: "Real-time", label: "Progress Updates", icon: BarChart3 },
  ];

  const testimonials = [
    {
      name: "Ademide Adedeji",
      role: "Computer Science Student",
      content: "The AI Tutor Assistant helped me understand complex algorithms. The auto-grading feature saved so much time!",
      avatar: "A"
    },
    {
      name: "Dr. Sarah Johnson",
      role: "Lecturer",
      content: "Creating quizzes and grading assignments has never been easier. My students love the instant feedback.",
      avatar: "S"
    },
    {
      name: "Michael Chen",
      role: "Engineering Student",
      content: "The progress tracking feature shows exactly where I need to improve. Highly recommended!",
      avatar: "M"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
      blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
      green: "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white",
      purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
      yellow: "bg-yellow-50 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white",
      pink: "bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white",
    };
    return colors[color] || colors.indigo;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-indigo-600">AI Tutor</span>
              <span className="text-sm text-gray-500 hidden sm:inline">| Learning Management System</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-indigo-600 transition-colors">Testimonials</a>
              <Link 
                to="/login" 
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <a href="#features" className="block px-3 py-2 text-gray-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <Link to="/login" className="block px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="block px-3 py-2 bg-indigo-600 text-white rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-indigo-700 font-medium">AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI Tutor Management System
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Smart Learning Platform for Students and Lecturers. 
            Get AI-powered assistance, track progress, and achieve your academic goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
            >
              Login
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A complete learning management system with AI-powered features designed for modern education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const colorClasses = getColorClasses(feature.color);
              return (
                <div 
                  key={idx} 
                  className="group p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${colorClasses}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Designed for Everyone</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you're a student or lecturer, AI Tutor adapts to your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Card */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Students</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">✓ AI-powered learning assistance</li>
                <li className="flex items-center gap-2">✓ Track your progress and grades</li>
                <li className="flex items-center gap-2">✓ Submit assignments online</li>
                <li className="flex items-center gap-2">✓ Get personalized recommendations</li>
                <li className="flex items-center gap-2">✓ Access resources anytime</li>
              </ul>
            </div>

            {/* Lecturer Card */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Lecturers</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">✓ Create and manage assignments</li>
                <li className="flex items-center gap-2">✓ Auto-grade multiple choice quizzes</li>
                <li className="flex items-center gap-2">✓ Upload learning resources</li>
                <li className="flex items-center gap-2">✓ Monitor student progress</li>
                <li className="flex items-center gap-2">✓ Provide feedback and grades</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Loved by Students and Lecturers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of users who are transforming their learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
                <div className="mt-3 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-indigo-100 mb-8">
            Join AI Tutor today and experience the future of education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-xl hover:bg-gray-100 transition-all"
            >
              Sign Up as Student
            </Link>
            <Link 
              to="/register" 
              className="px-6 py-3 border border-white text-white font-medium rounded-xl hover:bg-indigo-700 transition-all"
            >
              Sign Up as Lecturer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AI Tutor</span>
              </div>
              <p className="text-gray-400 text-sm">
                Smart Learning Platform for Students and Lecturers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-indigo-400">Features</a></li>
                <li><Link to="/login" className="hover:text-indigo-400">Login</Link></li>
                <li><Link to="/register" className="hover:text-indigo-400">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-indigo-400">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-400">Support</a></li>
                <li><a href="#" className="hover:text-indigo-400">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-indigo-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} AI Tutor Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}