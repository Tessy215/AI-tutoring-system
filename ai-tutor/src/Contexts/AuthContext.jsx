import { Query } from "appwrite";
import { createContext, useContext, useState, useEffect } from "react";
import { account, databases, ID } from "../lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "../lib/config";

const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);

      const profile = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal("userId", currentUser.$id)]
      );

      if (profile.documents.length > 0) {
        setUserProfile(profile.documents[0]);
      }

      console.log("Role:", profile.documents[0].role)
      console.log(profile.documents[0])

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
    const profile = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal("userId", currentUser.$id)]
    );

    if (profile.documents.length > 0) {
      setUserProfile(profile.documents[0]);
    }

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
    setUserProfile(null);
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

  const completeOnboarding = async (field, courses, goals, role = "student") => {
    try{
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        ID.unique(),
        {
          userId: user.$id,
          name: user.name,
          email: user.email,
          field,
          courses,
          goals,
          grade: "Not Set",
          role,
        }
      );
       const profile = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
         Query.equal("userId", user.$id),
       ])

       if (profile.documents.length > 0) {
         setUserProfile(profile.documents[0])
       }
      localStorage.setItem("onboarding_data", JSON.stringify({ field, courses, goals}))
      localStorage.setItem("hasCompletedOnboarding", "true");
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error("Onboarding error:", error);
    }
  };

 

  const getOnboardingData = () => {
    const data = localStorage.getItem("onboarding_data");
    return data ? JSON.parse(data) : null;
  };

  const value = {
    user,
    userProfile,
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