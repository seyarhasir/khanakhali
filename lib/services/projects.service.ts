import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDbInstance } from '../firebase/config';
import { Project, CreateProjectInput, UpdateProjectInput } from '../types/project.types';

const getDb = () => getDbInstance();

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date();
};

// Remove undefined values from object (Firestore doesn't accept undefined)
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      }
    }
    return cleaned;
  }
  
  return obj;
};

// Convert Firestore document to Project
const convertDocToProject = (doc: any): Project => {
  const data = doc.data();
  return {
    id: doc.id,
    projectId: data.projectId,
    name: data.name,
    description: data.description,
    developer: data.developer,
    location: data.location,
    imageUrls: data.imageUrls || [],
    coverImageIndex: data.coverImageIndex,
    projectTypes: data.projectTypes || [],
    priceRange: data.priceRange,
    priceInDollarRange: data.priceInDollarRange,
    features: data.features || {},
    developmentUpdates: data.developmentUpdates?.map((update: any) => ({
      ...update,
      date: convertTimestamp(update.date),
    })) || [],
    paymentPlans: data.paymentPlans || [],
    floorPlans: data.floorPlans || [],
    walkthrough3DUrl: data.walkthrough3DUrl,
    contactPhone: data.contactPhone,
    contactWhatsApp: data.contactWhatsApp,
    contactEmail: data.contactEmail,
    marketedBy: data.marketedBy,
    developedBy: data.developedBy,
    status: data.status || 'upcoming',
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const projectsService = {
  // Fetch all projects
  fetchProjects: async (): Promise<Project[]> => {
    try {
      const db = getDb();
      const q = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];
      
      querySnapshot.forEach((doc) => {
        projects.push(convertDocToProject(doc));
      });
      
      console.log(`✅ Fetched ${projects.length} projects`);
      return projects;
    } catch (error: any) {
      // Handle permission errors gracefully (collection might not exist or rules not set)
      if (error?.code === 'permission-denied' || error?.code === 'permissions-denied') {
        console.log('⚠️ Permission denied for projects collection - returning empty array');
        return [];
      }
      console.error('❌ Fetch projects error:', error);
      throw new Error(error.message || 'Failed to fetch projects');
    }
  },

  // Fetch single project by ID
  fetchProjectById: async (id: string): Promise<Project | null> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'projects', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ Fetched project:', id);
        return convertDocToProject(docSnap);
      }
      
      console.log('⚠️ Project not found:', id);
      return null;
    } catch (error: any) {
      console.error('❌ Fetch project error:', error);
      throw new Error(error.message || 'Failed to fetch project');
    }
  },

  // Fetch single project by projectId (P1000, P1001, etc.)
  fetchProjectByProjectId: async (projectId: string): Promise<Project | null> => {
    try {
      const db = getDb();
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        console.log('✅ Fetched project by projectId:', projectId);
        return convertDocToProject(docSnap);
      }
      
      console.log('⚠️ Project not found by projectId:', projectId);
      return null;
    } catch (error: any) {
      console.error('❌ Fetch project by projectId error:', error);
      throw new Error(error.message || 'Failed to fetch project by projectId');
    }
  },

  // Generate next project ID (P1000, P1001, etc.)
  generateNextProjectId: async (): Promise<string> => {
    try {
      const db = getDb();
      const projectsRef = collection(db, 'projects');
      const snapshot = await getDocs(projectsRef);
      
      let maxNumber = 999; // Start from 1000, so base is 999
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.projectId && typeof data.projectId === 'string') {
          // Extract number from projectId (e.g., "P1000" -> 1000)
          const match = data.projectId.match(/^P(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            // Only consider numbers >= 1000
            if (num >= 1000 && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      });
      
      // Always ensure we start from at least 1000
      const nextNumber = Math.max(maxNumber + 1, 1000);
      const projectId = `P${nextNumber}`;
      console.log(`✅ Generated project ID: ${projectId}`);
      return projectId;
    } catch (error: any) {
      console.error('❌ Generate project ID error:', error);
      // Fallback to P1000 if there's an error
      return 'P1000';
    }
  },

  // Create new project (admin only)
  createProject: async (data: CreateProjectInput, userId: string, images: string[] = []): Promise<Project> => {
    try {
      // Always generate project ID if not provided
      let projectId = data.projectId;
      if (!projectId || !projectId.match(/^P\d{4,}$/)) {
        // Generate new project ID if not provided or invalid format
        projectId = await projectsService.generateNextProjectId();
        console.log(`✅ Using generated project ID: ${projectId}`);
      }
      
      const projectData = {
        ...data,
        projectId,
        imageUrls: images,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Remove all undefined values (Firestore doesn't accept undefined)
      const cleanedData = removeUndefined(projectData);
      
      const db = getDb();
      const docRef = await addDoc(collection(db, 'projects'), cleanedData);
      console.log('✅ Project created:', docRef.id);
      
      // Fetch the created project to return it with timestamps
      const project = await projectsService.fetchProjectById(docRef.id);
      if (!project) {
        throw new Error('Failed to fetch created project');
      }
      
      return project;
    } catch (error: any) {
      console.error('❌ Create project error:', error);
      throw new Error(error.message || 'Failed to create project');
    }
  },

  // Update existing project (admin only)
  updateProject: async (id: string, data: UpdateProjectInput, images?: string[]): Promise<void> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'projects', id);
      
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      
      // Only update images if provided
      if (images !== undefined) {
        updateData.imageUrls = images;
      }
      
      // Remove id from update data
      delete updateData.id;
      
      // Remove all undefined values (Firestore doesn't accept undefined)
      const cleanedData = removeUndefined(updateData);
      
      await updateDoc(docRef, cleanedData);
      console.log('✅ Project updated:', id);
    } catch (error: any) {
      console.error('❌ Update project error:', error);
      throw new Error(error.message || 'Failed to update project');
    }
  },

  // Delete project (admin only)
  deleteProject: async (id: string): Promise<void> => {
    try {
      // Delete the Firestore document
      const db = getDb();
      const docRef = doc(db, 'projects', id);
      await deleteDoc(docRef);
      console.log('✅ Project deleted:', id);
    } catch (error: any) {
      console.error('❌ Delete project error:', error);
      throw new Error(error.message || 'Failed to delete project');
    }
  },

  // Fetch projects created by specific user (admin view)
  fetchAdminProjects: async (userId: string): Promise<Project[]> => {
    try {
      const db = getDb();
      const q = query(
        collection(db, 'projects'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];
      
      querySnapshot.forEach((doc) => {
        projects.push(convertDocToProject(doc));
      });
      
      console.log(`✅ Fetched ${projects.length} admin projects`);
      return projects;
    } catch (error: any) {
      // Handle permission errors gracefully (collection might not exist or rules not set)
      if (error?.code === 'permission-denied' || error?.code === 'permissions-denied') {
        console.log('⚠️ Permission denied for projects collection - returning empty array');
        return [];
      }
      console.error('❌ Fetch admin projects error:', error);
      throw new Error(error.message || 'Failed to fetch admin projects');
    }
  },
};

