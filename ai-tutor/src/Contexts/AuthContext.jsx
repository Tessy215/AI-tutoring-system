import { createContext, useContext, useState, useEffect } from "react";
import { account, ID } from "../lib/appwrite";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);

      const onboardingStatus = localStorage.getItem("hasCompletedOnboarding");
      setHasCompletedOnboarding(onboardingStatus === "true");
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const currentUser = await account.get();
    setUser(currentUser);
    return currentUser;
  };

  const register = async (name, email, password) => {
    await account.create(ID.unique(), email, password, name);
    await login(email, password);

    const newUser = await account.get();
    setUser(newUser);
    setHasCompletedOnboarding(false);
    return newUser;
  };

  const logout = async () => {
    await account.deleteSession("current");
    setUser(null);
    setHasCompletedOnboarding(false);
    localStorage.removeItem("hasCompletedOnboarding");
  };

  const updateProfile = async (update) => {
    if (update.name && update.name !== user.name) {
      await account.updateName(update.name);
    }

    if (update.email && update.email !== user.email) {
      await account.updateEmail(update.email, update.currentPassword);
    }

    const updatedUser = await account.get();
    setUser(updatedUser);
  };

  const completeOnboarding = (field, courses, goals) => {
    const onboardingData = { field, courses, goals };
    localStorage.setItem("onboarding_data", JSON.stringify(onboardingData));
    localStorage.setItem("hasCompletedOnboarding", "true");
    setHasCompletedOnboarding(true);
  };

  const getOnboardingData = () => {
    const data = localStorage.getItem("onboarding_data");
    return data ? JSON.parse(data) : null;
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
    getOnboardingData,
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