'use client';

import { useEffect, useState, use } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function EditIntern({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [about, setAbout] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchIntern() {
      try {
        const internDoc = await getDoc(doc(db, 'interns', id));
        if (internDoc.exists()) {
          const data = internDoc.data();
          setName(data.name);
          setDesignation(data.designation || '');
          setAbout(data.about || '');
          setCurrentImageUrl(data.imageUrl || '');
          setActive(data.active);
        } else {
          alert('Intern profile not found');
          router.push('/admin/dashboard/career');
        }
      } catch (error) {
        console.error('Error fetching intern:', error);
        alert('Failed to load intern profile');
      } finally {
        setLoading(false);
      }
    }

    fetchIntern();
  }, [id, router]);

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setNewImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeCurrentImage = () => {
    setCurrentImageUrl('');
  };

  const removeNewImage = () => {
    setNewImageFile(null);
    setNewImagePreview('');
  };

  const uploadNewImage = async (): Promise<string | null> => {
    if (!newImageFile) return null;

    const fileName = `interns/${Date.now()}-${newImageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `images/${fileName}`);
    
    try {
      setUploadProgress(50);
      await uploadBytes(storageRef, newImageFile);
      setUploadProgress(100);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter the intern name');
      return;
    }
    
    setSaving(true);
    setUploadProgress(0);
    
    try {
      // Upload new image if provided
      let finalImageUrl = currentImageUrl;
      if (newImageFile) {
        const uploadedUrl = await uploadNewImage();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }
      
      // Update intern in Firestore
      await updateDoc(doc(db, 'interns', id), {
        name,
        designation: designation || null,
        about: about || null,
        imageUrl: finalImageUrl || null,
        active,
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/career');
    } catch (error) {
      console.error('Error updating intern profile:', error);
      alert('Failed to update intern profile. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  const displayImage = newImagePreview || currentImageUrl;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Intern Profile</h1>
        <button
          onClick={() => router.back()}
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Image Display */}
        {currentImageUrl && !newImagePreview && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Current Profile Photo
            </label>
            <div className="flex items-center space-x-4">
              <img 
                src={currentImageUrl} 
                alt="Current profile" 
                className="w-20 h-20 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={removeCurrentImage}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove Current Image
              </button>
            </div>
          </div>
        )}

        {/* New Image Upload Section */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            {currentImageUrl ? 'Upload New Profile Photo (Optional)' : 'Profile Photo (Optional)'}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {newImagePreview ? (
              <div className="text-center">
                <img 
                  src={newImagePreview} 
                  alt="New preview" 
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <button
                  type="button"
                  onClick={removeNewImage}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove New Image
                </button>
              </div>
            ) : (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor="image" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload new profile photo
                    </span>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleNewImageUpload}
                      className="hidden"
                    />
                    <span className="mt-1 block text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">
            Intern Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900"
            required
          />
        </div>

        <div>
          <label htmlFor="designation" className="mb-2 block text-sm font-medium text-gray-900">
            Internship Designation (Optional)
          </label>
          <input
            id="designation"
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900"
            placeholder="e.g., Marketing Intern, Sustainability Researcher"
          />
        </div>

        <div>
          <label htmlFor="about" className="mb-2 block text-sm font-medium text-gray-900">
            About (Optional)
          </label>
          <textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900"
            placeholder="Brief description about the intern, their contributions, or achievements..."
          />
        </div>

        {/* Upload Progress */}
        {saving && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-sm text-gray-600 mt-1">Uploading image... {Math.round(uploadProgress)}%</p>
          </div>
        )}
        
        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
          <input
            id="active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <label htmlFor="active" className="ml-3 block text-sm font-medium text-gray-900">
            Active (visible on website)
          </label>
        </div>

        {/* Preview Section */}
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
          <div className="bg-white p-6 rounded-lg border max-w-sm mx-auto">
            {displayImage && (
              <div className="mb-4">
                <img 
                  src={displayImage} 
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover mx-auto"
                />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{name || 'Intern Name'}</h3>
            {designation && (
              <p className="text-blue-600 text-center font-medium mb-2">{designation}</p>
            )}
            {about && (
              <p className="text-gray-700 text-sm text-center">{about}</p>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-5 py-2.5 text-white hover:bg-gray-800 disabled:bg-gray-400 font-medium"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
} 