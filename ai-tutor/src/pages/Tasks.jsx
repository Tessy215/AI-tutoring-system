import { useState, useEffect } from "react";
import { Plus, CheckCircle, Circle, Trash2, Calendar, Edit2, X, Save } from "lucide-react";
import { databases, ID } from "../lib/appwrite";
import { Query } from "appwrite";
import { DATABASE_ID, COLLECTIONS } from "../lib/config";
import { useAuth } from "../Contexts/AuthContext";

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    category: "",
    dueDate: "",
    priority: "medium"
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt")
        ]
      );
      setTasks(response.documents);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async () => {
    if (newTask.title && newTask.category) {
      try {
        const task = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.TASKS,
          ID.unique(),
          {
            userId: user.$id,
            title: newTask.title,
            category: newTask.category,
            dueDate: newTask.dueDate,
            priority: newTask.priority,
            completed: false,
          }
        );
        setTasks([...tasks, task]);
        setNewTask({ title: "", category: "", dueDate: "", priority: "medium" });
        setShowAddForm(false);
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  const toggleTask = async (id, currentStatus) => {
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        id,
        { completed: !currentStatus }
      );
      setTasks(tasks.map(task => task.$id === id ? updated : task));
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        id
      );
      setTasks(tasks.filter(task => task.$id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const saveEdit = async () => {
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        editingTask.$id,
        {
          title: editingTask.title,
          category: editingTask.category,
          dueDate: editingTask.dueDate,
          priority: editingTask.priority,
        }
      );
      setTasks(tasks.map(task => task.$id === editingTask.$id ? updated : task));
      setEditingTask(null);
    } catch (error) {
      console.error("Error editing task:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-600";
      case "medium": return "bg-yellow-100 text-yellow-600";
      case "low": return "bg-green-100 text-green-600";
      default: return "bg-gray-100 text-gray-600";
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
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Category (e.g. Work, School, Personal)"
              value={newTask.category}
              onChange={e => setNewTask({ ...newTask, category: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={newTask.dueDate}
              onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={newTask.priority}
              onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTask}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingTask && (
        <div className="bg-white p-6 rounded-xl border mb-6 border-indigo-200">
          <h3 className="font-semibold mb-4">Edit Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Task title"
              value={editingTask.title}
              onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Category"
              value={editingTask.category}
              onChange={e => setEditingTask({ ...editingTask, category: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={editingTask.dueDate}
              onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={editingTask.priority}
              onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => setEditingTask(null)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading tasks...</div>
      ) : (
        <>
          {/* Active Tasks */}
          <div className="space-y-3 mb-8">
            {activeTasks.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active tasks yet!</p>
            ) : (
              activeTasks.map(task => (
                <div
                  key={task.$id}
                  className="bg-white p-4 border rounded-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 items-start flex-1">
                      <button
                        onClick={() => toggleTask(task.$id, task.completed)}
                        className="mt-1"
                      >
                        <Circle className="w-5 h-5 text-gray-400" />
                      </button>
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        {/* CHANGED: category and date on same line */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-gray-500">{task.category}</span>
                          {task.dueDate && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* CHANGED: priority + edit + delete on right side */}
                    <div className="flex items-center gap-2">
                      {task.priority && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      )}

                      <button onClick={() => setEditingTask(task)}>
                        <Edit2 className="w-4 h-4 text-indigo-500 hover:text-indigo-700" />
                      </button>

                      <button onClick={() => deleteTask(task.$id)}>
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Completed</h2>
              {completedTasks.map(task => (
                <div
                  key={task.$id}
                  className="bg-white p-4 border rounded-xl opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 items-start">
                      <button
                        onClick={() => toggleTask(task.$id, task.completed)}
                        className="mt-1"
                      >
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </button>
                      <div>
                        <p className="line-through text-gray-500">{task.title}</p>
                        <p className="text-sm text-gray-400">{task.category}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                          )}
                          {task.priority && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteTask(task.$id)}>
                      <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}