
import type { TimeEvent, Goal, Tag } from './types';
import { getDb } from './firebase-admin';

export const getEvents = async (): Promise<TimeEvent[]> => {
  try {
    const db = getDb();
    const snapshot = await db.collection('events').orderBy('startTime', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        // Firestore Timestamps need to be converted to serializable format (ISO string)
        startTime: data.startTime.toDate().toISOString(),
        endTime: data.endTime.toDate().toISOString(),
      } as TimeEvent;
    });
  } catch (error) {
    console.error("getEvents: Error fetching events:", error);
    // Return an empty array on error to allow the app to load.
    return [];
  }
};

export const getGoals = async (): Promise<Goal[]> => {
  try {
    const db = getDb();
    const snapshot = await db.collection('goals').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        comparison: data.comparison || 'at-least', // Default for old goals
      } as Goal;
    });
  } catch (error) {
    console.error("getGoals: Error fetching goals:", error);
    return [];
  }
};

export const getTags = async (): Promise<Tag[]> => {
    try {
      const db = getDb();
      const snapshot = await db.collection('tags').get();
      if (snapshot.empty) {
        // If no tags, create a default one to get the user started
        const defaultTag = { name: 'General', color: '#84cc16' };
        const docRef = await db.collection('tags').add(defaultTag);
        return [{...defaultTag, id: docRef.id}];
      }
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Tag));
    } catch (error: any) {
      console.error('Error fetching tags:', error.message);
      // Return empty array on error to prevent app crash
      return [];
    }
  };
