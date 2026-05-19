import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Award, Target } from "lucide-react";

const monthlyPerformance = [
  { month: "Oct", math: 78, science: 82, english: 85, history: 80 },
  { month: "Nov", math: 82, science: 85, english: 87, history: 83 },
  { month: "Dec", math: 85, science: 88, english: 86, history: 85 },
  { month: "Jan", math: 87, science: 90, english: 89, history: 87 },
  { month: "Feb", math: 89, science: 91, english: 90, history: 88 },
  { month: "Mar", math: 91, science: 92, english: 92, history: 90 },
];

const subjectRadar = [
  { subject: "Math", score: 91 },
  { subject: "Science", score: 92 },
  { subject: "English", score: 92 },
  { subject: "History", score: 90 },
  { subject: "Spanish", score: 85 },
  { subject: "Art", score: 88 },
];

const studyHoursData = [
  { week: "Week 1", hours: 18 },
  { week: "Week 2", hours: 22 },
  { week: "Week 3", hours: 20 },
  { week: "Week 4", hours: 25 },
  { week: "Week 5", hours: 23 },
  { week: "Week 6", hours: 28 },
];

const skills = [
  { name: "Problem Solving", level: 92, trend: "up" },
  { name: "Critical Thinking", level: 88, trend: "up" },
  { name: "Research", level: 85, trend: "up" },
  { name: "Writing", level: 90, trend: "stable" },
  { name: "Time Management", level: 78, trend: "up" },
  { name: "Collaboration", level: 82, trend: "down" },
];

export default function Progress() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Progress & Analytics</h1>
        <p className="text-gray-600 mt-1">Track your learning journey and performance insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-indigo-100">Overall Average</p>
            <Award className="w-6 h-6 text-indigo-200" />
          </div>
          <p className="text-4xl font-bold">89.5%</p>
          <p className="text-sm text-indigo-100 mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +3.2% from last month
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100">Assignments Done</p>
            <Target className="w-6 h-6 text-green-200" />
          </div>
          <p className="text-4xl font-bold">24/28</p>
          <p className="text-sm text-green-100 mt-2">85.7% completion rate</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100">Study Streak</p>
            <Award className="w-6 h-6 text-purple-200" />
          </div>
          <p className="text-4xl font-bold">12 days</p>
          <p className="text-sm text-purple-100 mt-2">Personal best!</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-100">Weekly Hours</p>
            <TrendingUp className="w-6 h-6 text-orange-200" />
          </div>
          <p className="text-4xl font-bold">28h</p>
          <p className="text-sm text-orange-100 mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +5h from last week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Over Time */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h2>
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 300}>
            <LineChart data={monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" domain={[70, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
              />
              <Legend />
              <Line type="monotone" dataKey="math" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="science" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="english" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="history" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance Radar */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={subjectRadar}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
              <PolarRadiusAxis domain={[0, 100]} stroke="#9ca3af" />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Study Hours */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Study Hours (6 Weeks)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={studyHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
              />
              <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Skills Progress */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Development</h2>
          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                    {skill.trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {skill.trend === "down" && <TrendingDown className="w-4 h-4 text-red-600" />}
                  </div>
                  <span className="text-sm text-gray-600">{skill.level}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      skill.level >= 90
                        ? "bg-green-600"
                        : skill.level >= 80
                        ? "bg-indigo-600"
                        : "bg-yellow-600"
                    }`}
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Perfect Score</h3>
                <p className="text-sm text-gray-600">Math Quiz - Apr 1</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Goal Achieved</h3>
                <p className="text-sm text-gray-600">90% Average - Mar</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Most Improved</h3>
                <p className="text-sm text-gray-600">Chemistry +15%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}