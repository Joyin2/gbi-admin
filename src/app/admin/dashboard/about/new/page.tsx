'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import Image from 'next/image';

interface MediaFile {
  url: string;
  type: 'image' | 'video';
  filename: string;
}

interface ValueCard {
  icon: string;
  title: string;
  description: string;
}

interface MissionCard {
  title: string;
  description: string;
}

export default function NewAboutSection() {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sectionType, setSectionType] = useState<'heading' | 'text' | 'image' | 'video' | 'mixed' | 'list' | 'values' | 'mission'>('text');
  const [content, setContent] = useState('<p>Start writing your content...</p>');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaFilePreviews, setMediaFilePreviews] = useState<string[]>([]);
  const [mediaFileTypes, setMediaFileTypes] = useState<('image' | 'video')[]>([]);
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [icon] = useState('');
  const [buttonText] = useState('');
  const [buttonLink] = useState('');
  const [listItems, setListItems] = useState<string[]>(['']);
  const [valueCards, setValueCards] = useState<ValueCard[]>([{ icon: '', title: '', description: '' }]);
  const [missionCards, setMissionCards] = useState<MissionCard[]>([{ title: '', description: '' }]);
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
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setStatus({
          type: 'error',
          message: 'Please select a valid image or video file'
        });
        return;
      }

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

      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setStatus({ type: null, message: '' });
    }
  };

  // New function to handle multiple media files for image section type
  const handleMultipleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];
    const validTypes: ('image' | 'video')[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        errors.push(`File ${index + 1}: Invalid file type`);
        return;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: Size exceeds ${isVideo ? '50MB' : '5MB'}`);
        return;
      }

      validFiles.push(file);
      validTypes.push(isImage ? 'image' : 'video');

      const reader = new FileReader();
      reader.onload = (e) => {
        validPreviews.push(e.target?.result as string);
        
        // Update state when all files are processed
        if (validPreviews.length === validFiles.length) {
          setMediaFiles(prev => [...prev, ...validFiles]);
          setMediaFilePreviews(prev => [...prev, ...validPreviews]);
          setMediaFileTypes(prev => [...prev, ...validTypes]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (errors.length > 0) {
      setStatus({
        type: 'error',
        message: errors.join(', ')
      });
    } else {
      setStatus({ type: null, message: '' });
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaFilePreviews(prev => prev.filter((_, i) => i !== index));
    setMediaFileTypes(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (file: File): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to upload media');
      }

      const filename = `${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const isVideo = file.type.startsWith('video/');
      const storageRef = ref(storage, `about-${isVideo ? 'videos' : 'images'}/${filename}`);

      const metadata = {
        customMetadata: {
          userId: user.uid,
          uploadedAt: new Date().toISOString(),
          contentType: file.type,
          userEmail: user.email || 'unknown',
          mediaType: isVideo ? 'video' : 'image'
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Media upload error:', error);
      throw new Error(`Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const uploadMultipleMedia = async (files: File[]): Promise<MediaFile[]> => {
    try {
      const uploadPromises = files.map(async (file) => {
        const url = await uploadMedia(file);
        return {
          url,
          type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
          filename: file.name
        };
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple media upload error:', error);
      throw new Error(`Failed to upload media files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleListItemChange = (index: number, value: string) => {
    const newListItems = [...listItems];
    newListItems[index] = value;
    setListItems(newListItems);
  };

  const addListItem = () => {
    setListItems([...listItems, '']);
  };

  const removeListItem = (index: number) => {
    if (listItems.length > 1) {
      const newListItems = listItems.filter((_, i) => i !== index);
      setListItems(newListItems);
    }
  };

  // Value Cards handlers
  const handleValueCardChange = (index: number, field: keyof ValueCard, value: string) => {
    const newValueCards = [...valueCards];
    newValueCards[index][field] = value;
    setValueCards(newValueCards);
  };

  const addValueCard = () => {
    setValueCards([...valueCards, { icon: '', title: '', description: '' }]);
  };

  const removeValueCard = (index: number) => {
    if (valueCards.length > 1) {
      const newValueCards = valueCards.filter((_, i) => i !== index);
      setValueCards(newValueCards);
    }
  };

  const handleMissionCardChange = (index: number, field: keyof MissionCard, value: string) => {
    const newMissionCards = [...missionCards];
    newMissionCards[index][field] = value;
    setMissionCards(newMissionCards);
  };

  const addMissionCard = () => {
    setMissionCards([...missionCards, { title: '', description: '' }]);
  };

  const removeMissionCard = (index: number) => {
    if (missionCards.length > 1) {
      const newMissionCards = missionCards.filter((_, i) => i !== index);
      setMissionCards(newMissionCards);
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

    if (sectionType === 'list' && listItems.every(item => !item.trim())) {
      setStatus({
        type: 'error',
        message: 'Please add at least one list item'
      });
      return;
    }

    if (sectionType === 'values' && valueCards.every(card => !card.title.trim() || !card.description.trim())) {
      setStatus({
        type: 'error',
        message: 'Please add at least one value with title and description'
      });
      return;
    }

    if (sectionType === 'mission' && missionCards.every(card => !card.title.trim() || !card.description.trim())) {
      setStatus({
        type: 'error',
        message: 'Please add at least one mission card with title and description'
      });
      return;
    }

    // Validation for single media sections
    if (sectionType === 'video' && !media) {
      setStatus({
        type: 'error',
        message: 'Please select a video file for this section type'
      });
      return;
    }

    // Validation for image sections (can have single or multiple media)
    if (sectionType === 'image' && !media && mediaFiles.length === 0) {
      setStatus({
        type: 'error',
        message: 'Please select at least one image or video file for this section type'
      });
      return;
    }
    
    setLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      let mediaUrl = '';
      let uploadedMediaFiles: MediaFile[] = [];
      
      // Handle single media upload (for backward compatibility and other section types)
      if (media) {
        mediaUrl = await uploadMedia(media);
      }

      // Handle multiple media upload for image sections
      if (mediaFiles.length > 0) {
        uploadedMediaFiles = await uploadMultipleMedia(mediaFiles);
      }

      const sectionData = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        sectionType,
        content: content,
        mediaUrl,
        mediaType,
        // New field for multiple media files
        mediaFiles: uploadedMediaFiles,
        order,
        isActive,
        icon: icon.trim(),
        buttonText: buttonText.trim(),
        buttonLink: buttonLink.trim(),
        listItems: listItems.filter(item => item.trim()),
        // New field for value cards
        valueCards: valueCards.filter(card => card.title.trim() && card.description.trim()),
        // New field for mission cards
        missionCards: missionCards.filter(card => card.title.trim() && card.description.trim()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'aboutSections'), sectionData);
      
      setStatus({
        type: 'success',
        message: 'About section added successfully!'
      });
      
      setTimeout(() => {
        router.push('/admin/dashboard/about');
      }, 1500);
      
    } catch (error) {
      console.error('Error adding about section:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add about section. Please try again.'
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New About Section</h1>
        <p className="text-gray-600 mt-2">Create a new section for your About page with various content types.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Section Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Our Mission, Our Values"
              required
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle (Optional)
            </label>
            <input
              type="text"
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Building a sustainable future"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="sectionType" className="block text-sm font-medium text-gray-700 mb-2">
              Section Type *
            </label>
            <select
              id="sectionType"
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="heading">Heading Only</option>
              <option value="text">Text Content</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="mixed">Text + Media</option>
              <option value="list">List</option>
              <option value="values">Values/Features</option>
              <option value="mission">Mission Cards</option>
            </select>
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
              Display Order *
            </label>
            <input
              type="number"
              id="order"
              value={order || ''}
              onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (visible on website)
              </label>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        {(sectionType === 'text' || sectionType === 'mixed') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <RichTextEditor
              content={content}
              onUpdate={setContent}
            />
          </div>
        )}

        {/* List Items */}
        {sectionType === 'list' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              List Items *
            </label>
            <div className="space-y-2">
              {listItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleListItemChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`List item ${index + 1}`}
                  />
                  {listItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addListItem}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add List Item
              </button>
            </div>
          </div>
        )}

        {/* Value Cards */}
        {sectionType === 'values' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value Cards *
            </label>
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                💡 <strong>Value Cards:</strong> Create individual value cards like "Sustainability", "Quality", etc. Each card should have an icon/emoji, title, and description.
              </p>
            </div>
            <div className="space-y-4">
              {valueCards.map((card, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Value Card {index + 1}</h4>
                    {valueCards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeValueCard(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon *
                      </label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-2 p-3 border border-gray-300 rounded-md bg-gray-50 max-h-40 overflow-y-auto">
                          {[
                            // Sustainability & Environment
                            { id: 'leaf', name: 'Leaf', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg> },
                            { id: 'globe', name: 'Globe', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h4.59l-2.1 1.95a.75.75 0 001.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 10-1.02 1.1l2.1 1.95H6.75z" clipRule="evenodd" /></svg> },
                            { id: 'recycle', name: 'Recycle', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 00-1.115-1.004A27.396 27.396 0 013.105 2.289z" /></svg> },
                            { id: 'shield', name: 'Shield', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.162 2 7c0-.539.035-1.07.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.749zm4.196 5.954a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 9.992a.75.75 0 00-1.06 1.061l2.592 2.592a.75.75 0 001.137-.089l3.638-5.365z" clipRule="evenodd" /></svg> },
                            
                            // Community & Partnership
                            { id: 'users', name: 'Users', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" /></svg> },
                            { id: 'handshake', name: 'Handshake', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 001 4.5v4A1.5 1.5 0 002.5 10h6A1.5 1.5 0 0010 8.5v-4A1.5 1.5 0 008.5 3h-6zm11 2A1.5 1.5 0 0112 6.5v7a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0017.5 5h-4zm-10 7A1.5 1.5 0 002 13.5v2A1.5 1.5 0 003.5 17h6a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 009.5 12h-6z" clipRule="evenodd" /></svg> },
                            { id: 'heart', name: 'Heart', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> },
                            { id: 'building', name: 'Building', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm2-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM6.5 9a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zm-.5 3.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM10.5 5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zm-.5 3.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 2.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z" clipRule="evenodd" /></svg> },
                            
                            // Quality & Excellence
                            { id: 'star', name: 'Star', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" /></svg> },
                            { id: 'trophy', name: 'Trophy', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.5 3a2.5 2.5 0 00-2.4 1.8L2.8 6.2a1.5 1.5 0 001.45 1.8H5v1.5a5.5 5.5 0 0010 0V8h.75a1.5 1.5 0 001.45-1.8L16.9 4.8A2.5 2.5 0 0014.5 3h-9zM10 16a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 16z" clipRule="evenodd" /></svg> },
                            { id: 'award', name: 'Award', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 1a3 3 0 00-3 3v2.5l2 1 2-1V4a3 3 0 00-3-3zm6 3a3 3 0 00-3-3v2.5l2 1 2-1V4a3 3 0 00-1 0zM7 8l-2 1v2.5a3 3 0 003 3h4a3 3 0 003-3V9l-2-1-3 1.5L7 8z" clipRule="evenodd" /></svg> },
                            { id: 'target', name: 'Target', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h4.59l-2.1 1.95a.75.75 0 001.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 10-1.02 1.1l2.1 1.95H6.75z" clipRule="evenodd" /></svg> },
                            
                            // Innovation & Technology
                            { id: 'lightbulb', name: 'Lightbulb', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.91 32.91 0 003.256.508 3.5 3.5 0 006.972 0 32.903 32.903 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6zM8.05 14.943a33.54 33.54 0 003.9 0 2 2 0 01-3.9 0z" /></svg> },
                            { id: 'rocket', name: 'Rocket', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.967 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2 11.033 2.744A1 1 0 0112 2z" clipRule="evenodd" /></svg> },
                            { id: 'cog', name: 'Cog', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg> },
                            { id: 'eye', name: 'Eye', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> },
                            { id: 'chart', name: 'Chart', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 001 4.5v4A1.5 1.5 0 002.5 10h6A1.5 1.5 0 0010 8.5v-4A1.5 1.5 0 008.5 3h-6zm11 2A1.5 1.5 0 0112 6.5v7a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0017.5 5h-4zm-10 7A1.5 1.5 0 002 13.5v2A1.5 1.5 0 003.5 17h6a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 009.5 12h-6z" clipRule="evenodd" /></svg> },
                            { id: 'check', name: 'Check', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg> },
                            { id: 'document', name: 'Document', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> },
                            
                            // Global Vision & Growth  
                            { id: 'globe-alt', name: 'Globe Alt', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" /></svg> },
                            { id: 'trending-up', name: 'Trending Up', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg> },
                            { id: 'map', name: 'Map', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.157 2.175a1.5 1.5 0 00-1.147 0l-4.084 1.69A1.5 1.5 0 002 5.251v10.877a1.5 1.5 0 002.074 1.386l3.51-1.453 4.26 1.763a1.5 1.5 0 001.146 0l4.083-1.69A1.5 1.5 0 0018 14.748V3.873a1.5 1.5 0 00-2.073-1.386l-3.51 1.452-4.26-1.763zM7.58 5a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 017.58 5zm5.59 2.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5z" clipRule="evenodd" /></svg> },
                            { id: 'truck', name: 'Truck', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M1 2.75A.75.75 0 011.75 2h10.5a.75.75 0 01.75.75v8.5a.75.75 0 01-.75.75h-2.123l.004-.014a2.25 2.25 0 10-3.505 0l.004.014H4.25a.75.75 0 01-.75-.75V8.5H2A.75.75 0 011.25 8V2.75A.75.75 0 011 2.75zM15 8.5v3.25a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75v-1.5a2 2 0 00-2-2h-1v.5z" /></svg> },
                          ].map((icon, iconIndex) => (
                            <button
                              key={iconIndex}
                              type="button"
                              onClick={() => handleValueCardChange(index, 'icon', icon.id)}
                              className={`w-10 h-10 flex items-center justify-center rounded border hover:bg-gray-200 transition-colors ${
                                card.icon === icon.id ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-600'
                              }`}
                              title={icon.name}
                            >
                              {icon.svg}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={card.icon}
                          onChange={(e) => handleValueCardChange(index, 'icon', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Selected icon ID will appear here..."
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleValueCardChange(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Sustainability, Quality"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        value={card.description}
                        onChange={(e) => handleValueCardChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe this value..."
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  {/* Preview Card */}
                  {(card.icon || card.title || card.description) && (
                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
                      <div className="text-center">
                        {card.icon && <div className="text-2xl mb-2">{card.icon}</div>}
                        {card.title && <h5 className="font-medium text-gray-900 mb-1">{card.title}</h5>}
                        {card.description && <p className="text-sm text-gray-600">{card.description}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addValueCard}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Value Card
              </button>
            </div>
          </div>
        )}

        {/* Mission Cards */}
        {sectionType === 'mission' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission Cards *
            </label>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                🎯 <strong>Mission Cards:</strong> Create mission cards that represent your organization's core mission areas. Based on your website, these include things like "Sustainable Agriculture", "Community Empowerment", etc.
              </p>
            </div>
            <div className="space-y-4">
              {missionCards.map((card, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Mission Card {index + 1}</h4>
                    {missionCards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMissionCard(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleMissionCardChange(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Sustainable Agriculture, Community Empowerment"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        value={card.description}
                        onChange={(e) => handleMissionCardChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe this mission area..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {/* Preview Card */}
                  {(card.title || card.description) && (
                    <div className="mt-3 p-4 bg-white border border-gray-200 rounded-md">
                      <div className="text-left">
                        {card.title && <h5 className="font-semibold text-gray-900 mb-2">{card.title}</h5>}
                        {card.description && <p className="text-sm text-gray-600">{card.description}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addMissionCard}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Mission Card
              </button>
            </div>
          </div>
        )}

        {/* Media Upload - Available for Most Section Types (excluding values and mission) */}
        {sectionType !== 'values' && sectionType !== 'mission' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📷 Photo & Video Upload
            {sectionType === 'image' && <span className="text-red-600"> - Required for Image sections</span>}
            {sectionType === 'video' && <span className="text-red-600"> - Required for Video sections</span>}
            {sectionType === 'image' && <span className="text-green-600"> (Multiple files supported!)</span>}
          </label>
          
          {sectionType === 'image' && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                🎉 <strong>Multiple Media Support:</strong> For image sections, you can upload multiple images and videos to create a gallery!
              </p>
            </div>
          )}
          
          {sectionType !== 'image' && sectionType !== 'video' && sectionType !== 'mixed' && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> You can add photos or videos to any section! Media will be displayed alongside your content.
              </p>
            </div>
          )}

          {/* Multiple Media Upload for Image Sections */}
          {sectionType === 'image' && (
            <div className="space-y-4">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="multiple-media-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload multiple files</span>
                      <input
                        id="multiple-media-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        accept="image/*,video/*"
                        onChange={handleMultipleMediaChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Select multiple images and videos (Images up to 5MB each, Videos up to 50MB each)
                  </p>
                </div>
              </div>

              {/* Preview Multiple Media Files */}
              {mediaFilePreviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Media Files ({mediaFilePreviews.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaFilePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          {mediaFileTypes[index] === 'video' ? (
                            <video
                              src={preview}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMediaFile(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <div className="mt-1 text-xs text-gray-600 text-center">
                          {mediaFileTypes[index] === 'video' ? '🎥' : '📷'} {mediaFiles[index]?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Single Media Upload for Other Section Types */}
          {sectionType !== 'image' && (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {mediaPreview ? (
                  <div className="mb-4">
                    {mediaType === 'video' ? (
                      <video
                        src={mediaPreview}
                        className="mx-auto h-32 w-auto rounded-lg"
                        controls
                      />
                    ) : (
                      <Image
                        src={mediaPreview}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="mx-auto h-32 w-auto rounded-lg object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="media-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="media-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*,video/*"
                      onChange={handleMediaChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  Images up to 5MB, Videos up to 50MB
                </p>
              </div>
            </div>
          )}
        </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard/about')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Section'}
          </button>
        </div>
      </form>
    </div>
  );
} 