'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

export default function NewRiceProduct() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('<p>Enter product description...</p>');
  const [price, setPrice] = useState('');
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Removed unused mediaType state
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
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setStatus({
          type: 'error',
          message: 'Image size should be less than 5MB'
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setStatus({
          type: 'error',
          message: 'Please upload an image file'
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
      const storageRef = ref(storage, `rice-products/${filename}`);
      
      // Upload file with custom metadata
      const metadata = {
        customMetadata: {
          userId: user.uid,
          uploadedAt: new Date().toISOString(),
          contentType: file.type,
          userEmail: user.email || 'unknown'
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      } else {
        throw new Error('Failed to upload image: Unknown error occurred');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a product name'
      });
      return;
    }

    if (!description || description === '<p>Enter product description...</p>' || description === '<p></p>') {
      setStatus({
        type: 'error',
        message: 'Please add a description for your product'
      });
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      setStatus({
        type: 'error',
        message: 'You must be logged in to create a product'
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
            message: 'Uploading image...'
          });
          
          imageUrl = await uploadImage(image);
          
          setStatus({
            type: null,
            message: 'Image uploaded successfully. Creating product...'
          });
        } catch (error: unknown) {
          if (error instanceof Error) {
            setStatus({
              type: 'error',
              message: `Failed to upload image: ${error.message || 'Unknown error occurred'}`
            });
          } else {
            setStatus({
              type: 'error',
              message: 'Failed to upload image: Unknown error occurred'
            });
          }
          setLoading(false);
          return;
        }
      }
      
      // Define the product data object
      const productData = {
        name,
        description,
        price: price.trim() || null,
        imageUrl,
        featured,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        createdByEmail: user.email
      };
  
      // Add product to Firestore
      await addDoc(collection(db, 'riceProducts'), productData);
      
      setStatus({
        type: 'success',
        message: 'Rice product created successfully! Redirecting...'
      });
  
      // Wait a moment to show success message before redirecting
      setTimeout(() => {
        router.push('/admin/dashboard/rice');
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatus({
          type: 'error',
          message: error.message || 'Failed to create rice product. Please try again.'
        });
      } else {
        setStatus({
          type: 'error',
          message: 'Failed to create rice product. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Add New Rice Product</h1>
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
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="price" className="mb-2 block text-sm font-medium text-gray-700">
                Price (Optional)
              </label>
              <input
                id="price"
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="image" className="mb-2 block text-sm font-medium text-gray-700">
                Product Image (max 5MB)
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
                <div className="mt-2">
                  <Image 
                    src={imagePreview} 
                    alt="Preview" 
                    width={320}
                    height={160}
                    className="h-40 w-auto object-cover rounded border" 
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                disabled={loading}
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                Featured Product
              </label>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product Description
              </label>
              <div className="rounded-md border border-gray-300">
                <RichTextEditor content={description} onUpdate={setDescription} />
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
            <span>{loading ? 'Creating...' : 'Create Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}