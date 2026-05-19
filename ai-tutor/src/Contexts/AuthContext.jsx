import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const onboardingStatus = localStorage.getItem("hasCompletedOnboarding");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setHasCompletedOnboarding(onboardingStatus === "true");
    }

    setIsLoading(false);
  }, []);

  const login = (email, _password) => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return Promise.reject("User not found");
    }

    const parsedUser = JSON.parse(storedUser);

    if (parsedUser.email.trim().toLowerCase() === email.trim().toLowerCase()) {
      setUser(parsedUser);
      return Promise.resolve(parsedUser);
    }

    return Promise.reject("User not found");
  };

  const register = (name, email, _password) => {
    const mockUser = {
      id: Date.now().toString(),
      name: name,
      email: email,
      role: "student",
      grade: "Not Set",
      avatar: null,
      field: null,
      courses: [],
      goals: [],
    };

    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
    setHasCompletedOnboarding(false);

    return Promise.resolve(mockUser);
  };

  const logout = () => {
    setUser(null);
    setHasCompletedOnboarding(false);
    localStorage.removeItem("hasCompletedOnboarding");
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const completeOnboarding = (field, courses, goals) => {
    const updatedUser = { ...user, field, courses, goals };
    setUser(updatedUser);
    setHasCompletedOnboarding(true);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("hasCompletedOnboarding", "true");
  };

  const value = {
    user,
    isLoading,
    hasCompletedOnboarding,
    login,
    register,
    logout,
    updateProfile,
    completeOnboarding,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}