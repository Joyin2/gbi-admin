'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

export default function NewEcovillageMedia() {
  const [name, setName] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Determine file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setStatus({
          type: 'error',
          message: 'Please select a valid image or video file'
        });
        return;
      }

      // Validate file size (max 50MB for videos, 5MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setStatus({
          type: 'error',
          message: `File size must be less than ${isVideo ? '50MB' : '5MB'}`
        });
        return;
      }

      setMedia(file);
      setMediaType(isImage ? 'image' : 'video');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous error
      setStatus({ type: null, message: '' });
    }
  };

  const uploadMedia = async (file: File): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to upload media');
      }

      // Create a unique filename with user ID to prevent conflicts
      const filename = `${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const isVideo = file.type.startsWith('video/');
      const storageRef = ref(storage, `ecovillage-${isVideo ? 'videos' : 'images'}/${filename}`);

      // Upload file with custom metadata
      const metadata = {
        customMetadata: {
          userId: user.uid,
          uploadedAt: new Date().toISOString(),
          contentType: file.type,
          userEmail: user.email || 'unknown',
          mediaType: isVideo ? 'video' : 'image'
        }
      };

      console.log('Uploading media to:', storageRef.fullPath);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Media uploaded successfully');

      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('Media upload error:', error);
      throw new Error(`Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a name for the media'
      });
      return;
    }

    if (!media) {
      setStatus({
        type: 'error',
        message: 'Please select an image or video'
      });
      return;
    }
    
    setLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      console.log('Starting ecovillage media upload process...');

      // Upload media first
      const mediaUrl = await uploadMedia(media);

      // Add ecovillage media to Firestore
      const ecovillageData = {
        name: name.trim(),
        mediaUrl,
        mediaType,
        imageUrl: mediaType === 'image' ? mediaUrl : null, // Keep backward compatibility
        videoUrl: mediaType === 'video' ? mediaUrl : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Adding ecovillage media to Firestore:', ecovillageData);
      await addDoc(collection(db, 'ecovillage'), ecovillageData);

      console.log('Ecovillage media added successfully');
      setStatus({
        type: 'success',
        message: `Ecovillage ${mediaType} added successfully!`
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard/ecovillage');
      }, 1500);
      
    } catch (error) {
      console.error('Error adding ecovillage image:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add ecovillage image. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Ecovillage Media</h1>
        <p className="text-gray-600 mt-2">Upload an image or video of the ecovillage with a descriptive name.</p>
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
            Media Name/Title *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:border-gray-500 focus:outline-none"
            placeholder="Enter a descriptive name for the media"
            disabled={loading}
            required
          />
        </div>
        
        <div>
          <label htmlFor="media" className="mb-2 block text-sm font-medium text-gray-700">
            Ecovillage Media * (Images: max 5MB, Videos: max 50MB)
          </label>
          <input
            id="media"
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
            disabled={loading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)
          </p>
          {mediaPreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                {mediaType === 'image' ? 'Image' : 'Video'} Preview:
              </p>
              {mediaType === 'image' ? (
                <Image
                  src={mediaPreview}
                  alt="Ecovillage media preview"
                  width={400}
                  height={300}
                  className="w-full max-w-md h-64 object-cover rounded-lg border shadow-sm"
                  unoptimized
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-w-md h-64 object-cover rounded-lg border shadow-sm"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-gray-900 px-4 py-3 text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? `Adding ${mediaType || 'Media'}...` : `Add Ecovillage ${mediaType === 'video' ? 'Video' : mediaType === 'image' ? 'Image' : 'Media'}`}
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
