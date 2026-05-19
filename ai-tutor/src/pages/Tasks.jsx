import { useState } from "react";
import { Plus, CheckCircle, Circle, Trash2, Calendar } from "lucide-react";

const initialTasks = [
  { id: 1, title: "Complete Chapter 7 Review", subject: "Mathematics", dueDate: "Apr 5, 2026", completed: false, priority: "high" },
  { id: 2, title: "Read Pages 45-60", subject: "History", dueDate: "Apr 6, 2026", completed: false, priority: "medium" },
  { id: 3, title: "Practice Spanish Verbs", subject: "Spanish", dueDate: "Apr 4, 2026", completed: true, priority: "low" },
  { id: 4, title: "Lab Report Draft", subject: "Chemistry", dueDate: "Apr 3, 2026", completed: false, priority: "high" },
  { id: 5, title: "Research for Presentation", subject: "Biology", dueDate: "Apr 8, 2026", completed: false, priority: "medium" },
];

export default function Tasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "medium"
  });

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const addTask = () => {
    if (newTask.title && newTask.subject && newTask.dueDate) {
      setTasks([
        ...tasks,
        { ...newTask, id: Date.now(), completed: false }
      ]);

      setNewTask({
        title: "",
        subject: "",
        dueDate: "",
        priority: "medium"
      });

      setShowAddForm(false);
    }
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {activeTasks.length} active, {completedTasks.length} completed
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border mb-6">
          <h3 className="font-semibold mb-4">Add New Task</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring:indigo-500 "
            />

            <input
              placeholder="Subject"
              value={newTask.subject}
              onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring:indigo-500 "
            />

            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring:indigo-500 "
            />

            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring:indigo-500 "
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={addTask} className="px-4 py-2 bg-indigo-600 text-white rounded">
              Add
            </button>

            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Tasks */}
      <div className="space-y-3 mb-8">
        {activeTasks.map(task => (
          <div key={task.id} className="bg-white p-4 border rounded-xl flex justify-between">
            <div className="flex gap-3 items-center">
              <button onClick={() => toggleTask(task.id)}>
                <Circle className="w-5 h-5" />
              </button>

              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-gray-500">{task.subject}</p>
              </div>
            </div>

            <button onClick={() => deleteTask(task.id)}>
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        ))}
      </div>

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          {completedTasks.map(task => (
            <div key={task.id} className="bg-white p-4 border rounded-xl opacity-60 flex justify-between">
              <div className="flex gap-3 items-center">
                <CheckCircle className="w-5 h-5 text-green-600" />

                <div>
                  <p className="line-through">{task.title}</p>
                  <p className="text-sm text-gray-500">{task.subject}</p>
                </div>
              </div>

              <button onClick={() => deleteTask(task.id)}>
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}