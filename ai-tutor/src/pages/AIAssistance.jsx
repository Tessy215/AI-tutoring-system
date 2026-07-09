import { useState, useRef, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { 
  Send, Bot, User, Sparkles, FileText, Upload, 
  X, Paperclip, Loader2, MessageSquare, 
  Zap, BookOpen, Copy, Check, Trash2,
  Plus, Mic, Image, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { sendChatMessage } from "../lib/aiService.js";


export default function AIAssistant() {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI Tutor Assistant. I can help you with:\n\n• Answering academic questions\n• Explaining difficult concepts\n• Summarizing PDFs and documents\n• Generating practice questions\n• Creating flashcards\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickActions = [
    { icon: Sparkles, label: "Explain a concept", prompt: "Can you explain " },
    { icon: FileText, label: "Summarize this", prompt: "Can you summarize this for me:" },
    { icon: BookOpen, label: "Generate questions", prompt: "Generate 5 practice questions about " },
    { icon: Zap, label: "Study tips", prompt: "Give me study tips for " },
  ];


const handleQuickAction = (prompt) => {
  setInputMessage(prompt);
}
const handleSendMessage = async () => {
  if (!inputMessage.trim() && !uploadedFile) return

  const userMessage = {
    id: Date.now(),
    role: "user",
    content: inputMessage,
    timestamp: new Date(),
  }
  setMessages(prev => [...prev, userMessage])
  setInputMessage("")
  setIsLoading(true)

  if(uploadedFile) {
    setUploadedFile(null);
  }

  try {
    // Call the real AI backend
    const result = await sendChatMessage(
      inputMessage,
      user.$id,
      sessionId // You'll need to store this from previous responses
    )

    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: result.response,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMessage])

    if (result.sessionId) {
      setSessionId(result.sessionId);
    }

  } catch (error) {
    console.error("AI Error:", error)
    const errorMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "Sorry, I'm having trouble connecting. Please make sure the AI backend is running.",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, errorMessage])
  } finally {
    setIsLoading(false)
  }
}

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (validTypes.includes(file.type) || file.name.endsWith(".pdf") || file.name.endsWith(".docx") || file.name.endsWith(".txt")) {
        setUploadedFile(file);
      } else {
        alert("Please upload PDF, DOCX, or TXT files only");
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = async (content, messageId) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Lecturer view
  if (userProfile?.role === "lecturer") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Tutor Assistant</h1>
          <p className="text-gray-600 mt-1">AI-powered teaching assistant for creating content and helping students</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg"><FileText className="w-5 h-5 text-purple-600" /></div>
              <h2 className="font-semibold text-gray-900">Generate Quiz Questions</h2>
            </div>
            <p className="text-gray-600 mb-4">Upload your lecture notes or topic, and AI will generate practice questions.</p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Coming Soon
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg"><Sparkles className="w-5 h-5 text-green-600" /></div>
              <h2 className="font-semibold text-gray-900">Summarize Resources</h2>
            </div>
            <p className="text-gray-600 mb-4">Get AI-generated summaries of uploaded resources to share with students.</p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Coming Soon
            </button>
          </div>
        </div>

        <div className="mt-6 bg-indigo-50 p-6 rounded-xl border border-indigo-200">
          <div className="flex items-center gap-3 mb-3">
            <Bot className="w-6 h-6 text-indigo-600" />
            <h2 className="font-semibold text-indigo-900">Lecturer Tools Coming Soon</h2>
          </div>
          <p className="text-indigo-800">
            Lecturers will be able to generate quizzes from resources, create study guides, 
            and get AI-powered insights about student performance.
          </p>
        </div>
      </div>
    );
  }

  // Student view - Chat Interface
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Tutor Assistant</h1>
            <p className="text-gray-600 mt-1">Your personal AI learning companion</p>
          </div>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {showQuickActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Quick Actions
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                >
                  <Icon className="w-4 h-4 text-indigo-600" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50 rounded-xl p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "user" 
                  ? "bg-indigo-100" 
                  : "bg-gradient-to-r from-indigo-500 to-purple-500"
              }`}>
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`relative group ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-xl p-3 ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}>
                  {/* File attachment indicator */}
                  {message.file && (
                    <div className={`mb-2 text-xs flex items-center gap-1 ${
                      message.role === "user" ? "text-indigo-200" : "text-gray-500"
                    }`}>
                      <Paperclip className="w-3 h-3" />
                      {message.file.name}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
                
                {/* Message footer */}
                <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}>
                  <span>{formatTime(message.timestamp)}</span>
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded File Preview */}
      {uploadedFile && (
        <div className="mb-3 flex-shrink-0">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700">{uploadedFile.name}</span>
              <span className="text-xs text-gray-500">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={removeUploadedFile} className="p-1 hover:bg-indigo-100 rounded">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me anything... (Shift + Enter for new line)"
                className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-gray-700 placeholder-gray-400 max-h-32 min-h-[40px]"
                rows={1}
                style={{ height: "auto", overflow: "hidden" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
            </div>
            <div className="flex items-center gap-1">
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Upload file (PDF, DOCX, TXT)"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && !uploadedFile) || isLoading}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Info Text */}
          <div className="mt-2 text-xs text-gray-400 text-center">
            AI Tutor Assistant can answer questions, explain concepts, and summarize documents
          </div>
        </div>
      </div>
    </div>
  );
}