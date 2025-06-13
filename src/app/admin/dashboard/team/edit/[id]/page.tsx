'use client';

import { useEffect, useState, use } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

interface TeamMemberEditProps {
  params: Promise<{ id: string }>;
}

export default function EditTeamMember({ params }: TeamMemberEditProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthLoading(false);
      if (!user) {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!authLoading) {
      fetchTeamMember();
    }
  }, [authLoading, id]);

  const fetchTeamMember = async () => {
    try {
      setDataLoading(true);
      const teamMemberDoc = await getDoc(doc(db, 'team', id));
      
      if (teamMemberDoc.exists()) {
        const data = teamMemberDoc.data();
        setName(data.name || '');
        setDesignation(data.designation || '');
        setCurrentPhotoUrl(data.photoUrl || '');
        setPhotoPreview(data.photoUrl || '');
      } else {
        setStatus({
          type: 'error',
          message: 'Team member not found'
        });
        setTimeout(() => router.push('/admin/dashboard/team'), 2000);
      }
    } catch (error) {
      console.error('Error fetching team member:', error);
      setStatus({
        type: 'error',
        message: 'Failed to load team member data'
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setStatus({
          type: 'error',
          message: 'Photo size must be less than 5MB'
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setStatus({
          type: 'error',
          message: 'Please select a valid image file'
        });
        return;
      }

      setPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous error
      setStatus({ type: null, message: '' });
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to upload photos');
      }

      // Create a unique filename with user ID to prevent conflicts
      const filename = `${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `team-photos/${filename}`);
      
      // Upload file with custom metadata
      const metadata = {
        customMetadata: {
          userId: user.uid,
          uploadedAt: new Date().toISOString(),
          contentType: file.type,
          userEmail: user.email || 'unknown'
        }
      };

      console.log('Uploading photo to:', storageRef.fullPath);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Photo uploaded successfully');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a name'
      });
      return;
    }
    
    if (!designation.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a designation'
      });
      return;
    }
    
    setLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      console.log('Starting team member update process...');
      
      let photoUrl = currentPhotoUrl;
      
      // Upload new photo if one was selected
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }
      
      // Update team member in Firestore
      const teamMemberData = {
        name: name.trim(),
        designation: designation.trim(),
        photoUrl,
        updatedAt: serverTimestamp(),
      };

      console.log('Updating team member in Firestore:', teamMemberData);
      await updateDoc(doc(db, 'team', id), teamMemberData);
      
      console.log('Team member updated successfully');
      setStatus({
        type: 'success',
        message: 'Team member updated successfully!'
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard/team');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating team member:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update team member. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Team Member</h1>
        <p className="text-gray-600 mt-2">Update team member information.</p>
      </div>

      {status.message && (
        <div className={`mb-6 p-4 rounded-lg ${
          status.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:border-gray-500 focus:outline-none"
            placeholder="Enter team member's full name"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="designation" className="mb-2 block text-sm font-medium text-gray-700">
            Designation *
          </label>
          <input
            id="designation"
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:border-gray-500 focus:outline-none"
            placeholder="Enter job title or role"
            disabled={loading}
            required
          />
        </div>
        
        <div>
          <label htmlFor="photo" className="mb-2 block text-sm font-medium text-gray-700">
            Photo (max 5MB) - Leave empty to keep current photo
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
            disabled={loading}
          />
          {photoPreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                {photo ? 'New Photo Preview:' : 'Current Photo:'}
              </p>
              <Image 
                src={photoPreview} 
                alt="Team member preview" 
                width={200}
                height={200}
                className="h-48 w-48 object-cover rounded-lg border shadow-sm" 
                unoptimized
              />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-gray-900 px-4 py-3 text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Updating Team Member...' : 'Update Team Member'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard/team')}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
