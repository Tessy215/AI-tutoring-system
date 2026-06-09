import { databases, ID } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./config";
import { Query } from "appwrite";

// Create a notification
export const createNotification = async (userId, title, message, type, link = null, relatedId = null) => {
  try {
    const notification = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      ID.unique(),
      {
        userId,
        title,
        message,
        type,
        read: false,
        link,
        relatedId,
        createdAt: new Date().toISOString(),
      }
    );
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Get user's notifications
export const getUserNotifications = async (userId, limit = 20) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit)
      ]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

// Get unread count
export const getUnreadCount = async (userId) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      [
        Query.equal("userId", userId),
        Query.equal("read", false),
        Query.limit(0) // Only get count, not documents
      ]
    );
    return response.total;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      notificationId,
      { read: true }
    );
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

// Mark all as read
export const markAllAsRead = async (userId) => {
  try {
    const notifications = await getUserNotifications(userId, 100);
    for (const notification of notifications) {
      if (!notification.read) {
        await markAsRead(notification.$id);
      }
    }
    return true;
  } catch (error) {
    console.error("Error marking all as read:", error);
    return false;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, notificationId);
    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
};

// Auto-generate notifications based on events
export const checkAndCreateNotifications = async (user, userProfile) => {
  const userId = user.$id;
  const today = new Date();
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(today.getDate() + 2);
  
  try {
    // Check for assignments due in 2 days
    const assignmentsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENTS,
      [
        Query.or([
          Query.equal("userId", userId),
          Query.equal("assignedTo", "all")
        ]),
        Query.isNotNull("dueDate"),
        Query.equal("status", "pending")
      ]
    );
    
    for (const assignment of assignmentsRes.documents) {
      const dueDate = new Date(assignment.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      // Check if due in 2 days and not already notified
      const existingNotif = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        [
          Query.equal("userId", userId),
          Query.equal("relatedId", assignment.$id),
          Query.equal("type", "assignment_due")
        ]
      );
      
      if (daysUntilDue === 2 && existingNotif.total === 0) {
        await createNotification(
          userId,
          "Assignment Due Soon",
          `${assignment.title} is due in 2 days`,
          "assignment_due",
          "/dashboard/assignments",
          assignment.$id
        );
      }
    }
  } catch (error) {
    console.error("Error checking notifications:", error);
  }
};