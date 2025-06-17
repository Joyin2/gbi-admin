'use client';

import { useEffect, useState, use } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import Image from 'next/image';

export default function EditProduct({ params }: { params: { id: string } }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentMediaUrl, setCurrentMediaUrl] = useState('');
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video' | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const router = useRouter();
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  useEffect(() => {
    async function fetchProduct() {
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const data = productDoc.data();
          setName(data.name);
          setDescription(data.description);
          setPrice(data.price || '');
          setFeatured(data.featured || false);
          setCurrentImageUrl(data.imageUrl);
          setCurrentMediaUrl(data.mediaUrl || data.imageUrl);
          setCurrentMediaType(data.mediaType || (data.imageUrl ? 'image' : null));
          setImagePreview(data.mediaUrl || data.imageUrl);
          setMediaType(data.mediaType || (data.imageUrl ? 'image' : null));
        } else {
          alert('Product not found');
          router.push('/admin/dashboard/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        alert('Error loading product. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product name');
      return;
    }
    
    setSaving(true);
    
    try {
      let imageUrl = currentImageUrl;
      let mediaUrl = currentMediaUrl;
      let finalMediaType = currentMediaType;

      // Upload new media if selected
      if (image) {
        const isVideo = image.type.startsWith('video/');
        const filename = `product-${isVideo ? 'videos' : 'images'}/${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, image);
        const downloadURL = await getDownloadURL(storageRef);

        imageUrl = downloadURL; // For backward compatibility
        mediaUrl = downloadURL;
        finalMediaType = mediaType;
      }

      // Update product in Firestore
      await updateDoc(doc(db, 'products', id), {
        name,
        description,
        price: price.trim() || null,
        imageUrl,
        mediaUrl,
        mediaType: finalMediaType,
        featured,
        updatedAt: serverTimestamp()
      });
      
      setStatus({
        type: 'success',
        message: 'Product updated successfully!'
      });
      
      // Wait a moment to show success message
      setTimeout(() => {
        router.push('/admin/dashboard/products');
      }, 1500);
    } catch (error) {
      console.error('Error updating product:', error);
      setStatus({
        type: 'error',
        message: 'Failed to update product. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Edit Pickle Product</h1>
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
            : 'bg-red-50 text-red-700 border border-red-200'
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
                disabled={saving}
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
                disabled={saving}
              />
            </div>
            
            <div>
              <label htmlFor="image" className="mb-2 block text-sm font-medium text-gray-700">
                Product Media (Images: max 5MB, Videos: max 50MB)
              </label>
              <input
                id="image"
                type="file"
                accept="image/*,video/*"
                onChange={handleImageChange}
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)
              </p>
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">
                    {(mediaType || currentMediaType) === 'image' ? 'Image' : 'Video'} Preview:
                  </p>
                  {(mediaType || currentMediaType) === 'video' ? (
                    <video
                      src={imagePreview}
                      controls
                      className="h-40 w-auto object-cover rounded border"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={320}
                      height={160}
                      className="h-40 w-auto object-cover rounded border"
                      unoptimized
                    />
                  )}
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
                disabled={saving}
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