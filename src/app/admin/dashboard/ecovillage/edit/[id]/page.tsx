'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

interface EcovillageEditProps {
  params: Promise<{ id: string }>;
}

export default function EditEcovillageImage({ params }: EcovillageEditProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
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
      fetchEcovillageImage();
    }
  }, [authLoading, id, fetchEcovillageImage]);

  const fetchEcovillageImage = useCallback(async () => {
    try {
      setDataLoading(true);
      const imageDoc = await getDoc(doc(db, 'ecovillage', id));

      if (imageDoc.exists()) {
        const data = imageDoc.data();
        setName(data.name || '');
        setCurrentImageUrl(data.imageUrl || '');
        setImagePreview(data.imageUrl || '');
      } else {
        setStatus({
          type: 'error',
          message: 'Ecovillage image not found'
        });
        setTimeout(() => router.push('/admin/dashboard/ecovillage'), 2000);
      }
    } catch (error) {
      console.error('Error fetching ecovillage image:', error);
      setStatus({
        type: 'error',
        message: 'Failed to load image data'
      });
    } finally {
      setDataLoading(false);
    }
  }, [id, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setStatus({
          type: 'error',
          message: 'Image size must be less than 5MB'
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

      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous error
      setStatus({ type: null, message: '' });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      // Create a unique filename with user ID to prevent conflicts
      const filename = `${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `ecovillage-images/${filename}`);
      
      // Upload file with custom metadata
      const metadata = {
        customMetadata: {
          userId: user.uid,
          uploadedAt: new Date().toISOString(),
          contentType: file.type,
          userEmail: user.email || 'unknown'
        }
      };

      console.log('Uploading image to:', storageRef.fullPath);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Image uploaded successfully');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a name for the image'
      });
      return;
    }
    
    setLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      console.log('Starting ecovillage image update process...');
      
      let imageUrl = currentImageUrl;
      
      // Upload new image if one was selected
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // Update ecovillage image in Firestore
      const ecovillageData = {
        name: name.trim(),
        imageUrl,
        updatedAt: serverTimestamp(),
      };

      console.log('Updating ecovillage image in Firestore:', ecovillageData);
      await updateDoc(doc(db, 'ecovillage', id), ecovillageData);
      
      console.log('Ecovillage image updated successfully');
      setStatus({
        type: 'success',
        message: 'Ecovillage image updated successfully!'
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard/ecovillage');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating ecovillage image:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update image. Please try again.'
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Ecovillage Image</h1>
        <p className="text-gray-600 mt-2">Update the image name or replace the image.</p>
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
            Image Name/Title *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:border-gray-500 focus:outline-none"
            placeholder="Enter a descriptive name for the image"
            disabled={loading}
            required
          />
        </div>
        
        <div>
          <label htmlFor="image" className="mb-2 block text-sm font-medium text-gray-700">
            Ecovillage Image (max 5MB) - Leave empty to keep current image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
            disabled={loading}
          />
          {imagePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                {image ? 'New Image Preview:' : 'Current Image:'}
              </p>
              <Image 
                src={imagePreview} 
                alt="Ecovillage image preview" 
                width={400}
                height={300}
                className="w-full max-w-md h-64 object-cover rounded-lg border shadow-sm" 
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
            {loading ? 'Updating Image...' : 'Update Ecovillage Image'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard/ecovillage')}
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
