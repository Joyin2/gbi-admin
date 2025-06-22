'use client';

import { useEffect, useState, use } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
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

interface ExistingMediaFile {
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
}

export default function EditBlog({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [existingMediaFiles, setExistingMediaFiles] = useState<ExistingMediaFile[]>([]);
  const [newMediaFiles, setNewMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const router = useRouter();
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  useEffect(() => {
    async function fetchBlog() {
      try {
        const blogDoc = await getDoc(doc(db, 'blogs', id));
        if (blogDoc.exists()) {
          const data = blogDoc.data();
          setTitle(data.title);
          setContent(data.content);
          
          // Handle existing media files
          if (data.mediaFiles && Array.isArray(data.mediaFiles)) {
            // New format with multiple files
            setExistingMediaFiles(data.mediaFiles);
          } else if (data.mediaUrl || data.imageUrl) {
            // Legacy format with single file
            const legacyMediaFile: ExistingMediaFile = {
              url: data.mediaUrl || data.imageUrl,
              type: data.mediaType || 'image',
              name: 'Legacy media file',
              size: 0
            };
            setExistingMediaFiles([legacyMediaFile]);
          }
        } else {
          setStatus({
            type: 'error',
            message: 'Blog not found'
          });
          router.push('/admin/dashboard/blogs');
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
        setStatus({
          type: 'error',
          message: 'Failed to load blog'
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [id, router]);

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
      setNewMediaFiles(prev => 
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
    const newFiles: MediaFile[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        setStatus({
          type: 'error',
          message: `${file.name}: ${error}`
        });
        return;
      }

      // Check if file already exists in new files
      const existsInNew = newMediaFiles.some(media => 
        media.file.name === file.name && media.file.size === file.size
      );
      
      if (existsInNew) {
        setStatus({
          type: 'error',
          message: `${file.name} is already added`
        });
        return;
      }

      newFiles.push(createMediaFile(file));
    });

    if (newFiles.length > 0) {
      setNewMediaFiles(prev => [...prev, ...newFiles]);
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

  const removeNewMediaFile = (id: string) => {
    setNewMediaFiles(prev => prev.filter(media => media.id !== id));
  };

  const removeExistingMediaFile = (index: number) => {
    setExistingMediaFiles(prev => prev.filter((_, i) => i !== index));
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

  const uploadAllNewFiles = async (): Promise<string[]> => {
    if (newMediaFiles.length === 0) return [];

    const uploadPromises = newMediaFiles.map(async (mediaFile) => {
      try {
        // Update UI to show uploading state
        setNewMediaFiles(prev => 
          prev.map(media => 
            media.id === mediaFile.id 
              ? { ...media, uploading: true, error: undefined }
              : media
          )
        );

        const url = await uploadSingleFile(mediaFile);

        // Update UI to show success
        setNewMediaFiles(prev => 
          prev.map(media => 
            media.id === mediaFile.id 
              ? { ...media, uploading: false, uploaded: true, url }
              : media
          )
        );

        return url;
      } catch (error) {
        // Update UI to show error
        setNewMediaFiles(prev => 
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
    
    setSaving(true);
    setStatus({ type: null, message: '' });
    
    try {
      let newUploadedUrls: string[] = [];
      
      // Upload new media files if any
      if (newMediaFiles.length > 0) {
        setStatus({
          type: null,
          message: `Uploading ${newMediaFiles.length} new media file(s)...`
        });

        try {
          newUploadedUrls = await uploadAllNewFiles();
          
          setStatus({
            type: null,
            message: 'New media files uploaded successfully. Updating blog...'
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
          setSaving(false);
          return;
        }
      }

      // Combine existing and new media files
      const allMediaFiles: ExistingMediaFile[] = [
        ...existingMediaFiles,
        ...newMediaFiles.map((media, index) => ({
          url: newUploadedUrls[index],
          type: media.type,
          name: media.file.name,
          size: media.file.size
        }))
      ];

      // Update blog in Firestore
      const updateData = {
        title,
        content,
        // Legacy fields for backward compatibility
        imageUrl: allMediaFiles.length > 0 ? allMediaFiles[0].url : null,
        mediaUrl: allMediaFiles.length > 0 ? allMediaFiles[0].url : null,
        mediaType: allMediaFiles.length > 0 ? allMediaFiles[0].type : null,
        // New fields for multiple media support
        mediaUrls: allMediaFiles.map(media => media.url),
        mediaFiles: allMediaFiles,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'blogs', id), updateData);
      
      setStatus({
        type: 'success',
        message: 'Blog updated successfully! Redirecting...'
      });

      setTimeout(() => {
        router.push('/admin/dashboard/blogs');
      }, 1500);
    } catch (error) {
      console.error('Error updating blog:', error);
      setStatus({
        type: 'error',
        message: 'Failed to update blog. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog</h1>
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
                disabled={saving}
              />
            </div>
            
            {/* Existing Media Files */}
            {existingMediaFiles.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  Current Media Files ({existingMediaFiles.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {existingMediaFiles.map((media, index) => (
                    <div key={index} className="relative border rounded-lg p-3 bg-gray-50">
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeExistingMediaFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                        disabled={saving}
                      >
                        ×
                      </button>
                      
                      {/* Preview */}
                      <div className="mb-2">
                        {media.type === 'image' ? (
                          <Image
                            src={media.url}
                            alt="Current media"
                            width={200}
                            height={120}
                            className="w-full h-24 object-cover rounded border"
                            unoptimized
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="w-full h-24 object-cover rounded border"
                            preload="metadata"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                      
                      {/* File info */}
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="font-medium truncate" title={media.name}>
                          {media.name}
                        </div>
                        <div className="flex justify-between">
                          <span className="capitalize">{media.type}</span>
                          {media.size > 0 && (
                            <span>{(media.size / (1024 * 1024)).toFixed(1)} MB</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Media Files */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Add New Media Files (Images: max 5MB each, Videos: max 50MB each)
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
                  disabled={saving}
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
              
              {/* New Media Preview Gallery */}
              {newMediaFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    New Files to Upload ({newMediaFiles.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newMediaFiles.map((media) => (
                      <div key={media.id} className="relative border rounded-lg p-3 bg-gray-50">
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeNewMediaFile(media.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                          disabled={saving}
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
            disabled={saving}
            className="rounded bg-gray-900 px-6 py-2 text-white hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            {saving && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}