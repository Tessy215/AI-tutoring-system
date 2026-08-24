import { databases, ID } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./config";
import { Query } from "appwrite";

// Create a log entry
export const createLog = async (userId, userName, action, details = null, type = "system") => {
  try {
    const log = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.LOGS,
      ID.unique(),
      {
        userId,
        userName,
        action,
        details,
        type,
      }
    );
    return log;
  } catch (error) {
    console.error("Error creating log:", error);
    return null;
  }
};

// Get all logs (admin)
export const getLogs = async (limit = 100) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LOGS,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(limit)
      ]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};

// Get logs by user
export const getLogsByUser = async (userId, limit = 50) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LOGS,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit)
      ]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return [];
  }
};

// Get logs by type
export const getLogsByType = async (type, limit = 50) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LOGS,
      [
        Query.equal("type", type),
        Query.orderDesc("$createdAt"),
        Query.limit(limit)
      ]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching logs by type:", error);
    return [];
  }
};

// Delete old logs (admin)
export const deleteOldLogs = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const logs = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LOGS,
      [
        Query.lessThan("$createdAt", cutoffDate.toISOString()),
        Query.limit(100)
      ]
    );
    
    for (const log of logs.documents) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.LOGS, log.$id);
    }
    
    return logs.documents.length;
  } catch (error) {
    console.error("Error deleting old logs:", error);
    return 0;
  }
};