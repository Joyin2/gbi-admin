'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
  error?: string;
}

export default function NewBlog() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('<p>Start writing your blog...</p>');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
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

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return 'Please upload an image or video file';
    }

    // Check file size (max 50MB for videos, 5MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size should be less than ${isVideo ? '50MB' : '5MB'}`;
    }

    return null;
  };

  const createMediaFile = (file: File): MediaFile => {
    const isImage = file.type.startsWith('image/');
    const mediaFile: MediaFile = {
      id: generateId(),
      file,
      type: isImage ? 'image' : 'video',
      preview: '',
    };

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaFiles(prev => 
        prev.map(media => 
          media.id === mediaFile.id 
            ? { ...media, preview: e.target?.result as string }
            : media
        )
      );
    };
    reader.readAsDataURL(file);

    return mediaFile;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    // Reset input
    e.target.value = '';
  };

  const addFiles = (files: File[]) => {
    const newMediaFiles: MediaFile[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        setStatus({
          type: 'error',
          message: `${file.name}: ${error}`
        });
        return;
      }

      // Check if file already exists
      const exists = mediaFiles.some(media => 
        media.file.name === file.name && media.file.size === file.size
      );
      
      if (exists) {
        setStatus({
          type: 'error',
          message: `${file.name} is already added`
        });
        return;
      }

      newMediaFiles.push(createMediaFile(file));
    });

    if (newMediaFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...newMediaFiles]);
      setStatus({ type: null, message: '' });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => prev.filter(media => media.id !== id));
  };

  const uploadSingleFile = async (mediaFile: MediaFile): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }

      const filename = `${user.uid}/${Date.now()}-${mediaFile.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `blog-${mediaFile.type === 'video' ? 'videos' : 'images'}/${filename}`);
      
      const metadata = {
        customMetadata: {
          userId: user.uid,
          uploadedAt: new Date().toISOString(),
          contentType: mediaFile.file.type,
          userEmail: user.email || 'unknown',
          mediaType: mediaFile.type
        }
      };

      const snapshot = await uploadBytes(storageRef, mediaFile.file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload ${mediaFile.file.name}: ${error.message}`);
      } else {
        throw new Error(`Failed to upload ${mediaFile.file.name}: Unknown error occurred`);
      }
    }
  };

  const uploadAllFiles = async (): Promise<string[]> => {
    const uploadPromises = mediaFiles.map(async (mediaFile) => {
      try {
        // Update UI to show uploading state
        setMediaFiles(prev => 
          prev.map(media => 
            media.id === mediaFile.id 
              ? { ...media, uploading: true, error: undefined }
              : media
          )
        );

        const url = await uploadSingleFile(mediaFile);

        // Update UI to show success
        setMediaFiles(prev => 
          prev.map(media => 
            media.id === mediaFile.id 
              ? { ...media, uploading: false, uploaded: true, url }
              : media
          )
        );

        return url;
      } catch (error) {
        // Update UI to show error
        setMediaFiles(prev => 
          prev.map(media => 
            media.id === mediaFile.id 
              ? { ...media, uploading: false, error: error instanceof Error ? error.message : 'Upload failed' }
              : media
          )
        );
        throw error;
      }
    });

    return Promise.all(uploadPromises);
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

    console.log('Content before submission:', content);
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
      let mediaUrls: string[] = [];
      
      // Upload all media files if any
      if (mediaFiles.length > 0) {
        setStatus({
          type: null,
          message: `Uploading ${mediaFiles.length} media file(s)...`
        });

        try {
          mediaUrls = await uploadAllFiles();
          
          setStatus({
            type: null,
            message: 'Media files uploaded successfully. Creating blog post...'
          });
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('Error during media upload:', error);
            setStatus({
              type: 'error',
              message: `Failed to upload media files: ${error.message}`
            });
          } else {
            setStatus({
              type: 'error',
              message: 'Failed to upload media files: Unknown error occurred'
            });
          }
          setLoading(false);
          return;
        }
      }
      
      // Define the blog data object with media arrays
      const blogData = {
        title,
        content,
        // Legacy fields for backward compatibility
        imageUrl: mediaUrls.length > 0 ? mediaUrls[0] : null,
        mediaUrl: mediaUrls.length > 0 ? mediaUrls[0] : null,
        mediaType: mediaFiles.length > 0 ? mediaFiles[0].type : null,
        // New fields for multiple media support
        mediaUrls: mediaUrls,
        mediaFiles: mediaFiles.map((media, index) => ({
          url: mediaUrls[index],
          type: media.type,
          name: media.file.name,
          size: media.file.size
        })),
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
            
            {/* Multiple Media Upload Section */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Media Files (Images: max 5MB each, Videos: max 50MB each)
              </label>
              
              {/* Drag and Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div className="space-y-2">
                  <div className="text-4xl text-gray-400">📁</div>
                  <div className="text-lg font-medium text-gray-700">
                    Drop files here or click to browse
                  </div>
                  <div className="text-sm text-gray-500">
                    Supported formats: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)
                  </div>
                </div>
              </div>
              
              {/* Media Preview Gallery */}
              {mediaFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Selected Files ({mediaFiles.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mediaFiles.map((media) => (
                      <div key={media.id} className="relative border rounded-lg p-3 bg-gray-50">
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeMediaFile(media.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                          disabled={loading}
                        >
                          ×
                        </button>
                        
                        {/* Preview */}
                        <div className="mb-2">
                          {media.type === 'image' ? (
                            media.preview && (
                              <Image
                                src={media.preview}
                                alt="Preview"
                                width={200}
                                height={120}
                                className="w-full h-24 object-cover rounded border"
                                unoptimized
                              />
                            )
                          ) : (
                            media.preview && (
                              <video
                                src={media.preview}
                                className="w-full h-24 object-cover rounded border"
                                preload="metadata"
                              >
                                Your browser does not support the video tag.
                              </video>
                            )
                          )}
                        </div>
                        
                        {/* File info */}
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="font-medium truncate" title={media.file.name}>
                            {media.file.name}
                          </div>
                          <div className="flex justify-between">
                            <span className="capitalize">{media.type}</span>
                            <span>{(media.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                          </div>
                        </div>
                        
                        {/* Upload status */}
                        {media.uploading && (
                          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                              <div className="text-xs text-gray-600 mt-1">Uploading...</div>
                            </div>
                          </div>
                        )}
                        
                        {media.uploaded && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                        
                        {media.error && (
                          <div className="mt-1 text-xs text-red-600" title={media.error}>
                            Upload failed
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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