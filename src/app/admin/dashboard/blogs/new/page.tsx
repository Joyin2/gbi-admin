'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

export default function NewBlog() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('<p>Start writing your blog...</p>');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  // Add loading state check
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Determine file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setStatus({
          type: 'error',
          message: 'Please upload an image or video file'
        });
        return;
      }

      // Check file size (max 50MB for videos, 5MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setStatus({
          type: 'error',
          message: `File size should be less than ${isVideo ? '50MB' : '5MB'}`
        });
        return;
      }

      setImage(file);
      setMediaType(isImage ? 'image' : 'video');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('You must be logged in to upload images');
      }

      // Verify authentication state
      console.log('Current auth state:', {
        uid: user.uid,
        email: user.email,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified
      });

      // Create a unique filename with user ID to prevent conflicts
      const filename = `${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const isVideo = file.type.startsWith('video/');
      const storageRef = ref(storage, `blog-${isVideo ? 'videos' : 'images'}/${filename}`);
      
      // Log upload attempt with more details
      console.log('Upload attempt details:', {
        filename,
        size: file.size,
        type: file.type,
        userId: user.uid,
        storagePath: storageRef.fullPath,
        bucket: storageRef.bucket,
        authState: {
          uid: user.uid,
          email: user.email
        }
      });

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

      try {
        const snapshot = await uploadBytes(storageRef, file, metadata);
        console.log('Upload successful:', {
          ref: snapshot.ref.fullPath,
          metadata: snapshot.metadata,
          authState: {
            uid: user.uid,
            email: user.email
          }
        });

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Download URL obtained:', downloadURL);

        return downloadURL;
      } catch (uploadError: unknown) {
        if (uploadError instanceof Error) {
          console.error('Upload operation failed:', uploadError);
          throw uploadError;
        } else {
          throw new Error('Unknown upload error');
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Enhanced error logging
        const errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
        console.error('Detailed upload error:', errorDetails);
        throw new Error(`Failed to upload image: ${error.message}`);
      } else {
        throw new Error('Failed to upload image: Unknown error occurred');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a title'
      });
      return;
    }

    // Add this validation and logging
    console.log('Content before submission:', content);
    console.log('Content length:', content.length);
    if (!content || content === '<p>Start writing your blog...</p>' || content === '<p></p>') {
      setStatus({
        type: 'error',
        message: 'Please add some content to your blog'
      });
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      setStatus({
        type: 'error',
        message: 'You must be logged in to create a blog post'
      });
      return;
    }
    
    setLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (image) {
        try {
          setStatus({
            type: null,
            message: `Uploading ${mediaType}...`
          });

          console.log(`Starting ${mediaType} upload process...`);
          imageUrl = await uploadImage(image);
          console.log(`${mediaType} upload completed successfully`);

          setStatus({
            type: null,
            message: `${mediaType} uploaded successfully. Creating blog post...`
          });
        } catch (error: unknown) {
          // Enhanced error logging
          if (error instanceof Error) {
            console.error('Error in handleSubmit during image upload:', error);
            setStatus({
              type: 'error',
              message: `Failed to upload ${mediaType}: ${error.message || 'Unknown error occurred'}`
            });
          } else {
            setStatus({
              type: 'error',
              message: `Failed to upload ${mediaType}: Unknown error occurred`
            });
          }
          setLoading(false);
          return;
        }
      }
      
      // Define the blog data object
      const blogData = {
        title,
        content,
        imageUrl,
        mediaUrl: imageUrl, // New field for consistency
        mediaType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authorId: user.uid,
        authorEmail: user.email
      };
  
      console.log('Creating blog with data:', blogData);
      
      // Add blog to Firestore with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      
      while (!success && retryCount < maxRetries) {
        try {
          const docRef = await addDoc(collection(db, 'blogs'), blogData);
          console.log('Blog created with ID:', docRef.id);
          success = true;
        } catch (firestoreError: unknown) {
          retryCount++;
          if (firestoreError instanceof Error) {
            console.error(`Firestore write attempt ${retryCount} failed:`, firestoreError);
          } else {
            console.error(`Firestore write attempt ${retryCount} failed: Unknown error`);
          }
          if (retryCount >= maxRetries) {
            throw firestoreError;
          }
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
      
      setStatus({
        type: 'success',
        message: 'Blog created successfully! Redirecting...'
      });
  
      // Wait a moment to show success message before redirecting
      setTimeout(() => {
        router.push('/admin/dashboard/blogs');
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error in handleSubmit:', error);
        setStatus({
          type: 'error',
          message: error.message || 'Failed to create blog. Please try again.'
        });
      } else {
        setStatus({
          type: 'error',
          message: 'Failed to create blog. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create New Blog</h1>
        <button
          onClick={() => router.back()}
          className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
      
      {status.message && (
        <div className={`rounded-lg p-4 ${
          status.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : status.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {status.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="image" className="mb-2 block text-sm font-medium text-gray-700">
                Featured Media (Images: max 5MB, Videos: max 50MB)
              </label>
              <input
                id="image"
                type="file"
                accept="image/*,video/*"
                onChange={handleImageChange}
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)
              </p>
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">
                    {mediaType === 'image' ? 'Image' : 'Video'} Preview:
                  </p>
                  {mediaType === 'image' ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={320}
                      height={160}
                      className="h-40 w-auto object-cover rounded border"
                      unoptimized
                    />
                  ) : (
                    <video
                      src={imagePreview}
                      controls
                      className="h-40 w-auto object-cover rounded border"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Content
              </label>
              <div className="rounded-md border border-gray-300">
                <RichTextEditor content={content} onUpdate={setContent} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-gray-900 px-6 py-2 text-white hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{loading ? 'Creating...' : 'Create Blog'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}