export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'agent' | 'admin';
  createdAt: Date;
  profileImageUrl?: string;
  // Detailed profile
  phone?: string;
  whatsApp?: string;
  bio?: string;
  company?: string;
  experience?: string;
  specialties?: string[];
}

