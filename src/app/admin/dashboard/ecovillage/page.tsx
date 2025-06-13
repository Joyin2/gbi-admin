'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, Timestamp, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

interface EcovillageImage {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: Timestamp;
}

export default function EcovillagePage() {
  const [images, setImages] = useState<EcovillageImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = query(collection(db, 'ecovillage'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ecovillageImages: EcovillageImage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ecovillageImages.push({
          id: doc.id,
          name: data.name,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt,
        });
      });
      
      setImages(ecovillageImages);
    } catch (error) {
      console.error('Error fetching ecovillage images:', error);
      setError('Failed to load ecovillage images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'ecovillage', id));
        setImages(images.filter(image => image.id !== id));
      } catch (error) {
        console.error('Error deleting ecovillage image:', error);
        setError('Failed to delete image. Please try again.');
      }
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ecovillage Gallery</h1>
          <p className="text-gray-600 mt-1">Manage ecovillage images and photos</p>
        </div>
        <Link 
          href="/admin/dashboard/ecovillage/new" 
          className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 transition-colors"
        >
          Add New Image
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ecovillage images yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first ecovillage image.</p>
          <Link 
            href="/admin/dashboard/ecovillage/new"
            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 transition-colors"
          >
            Add First Image
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <Image
                  src={image.imageUrl}
                  alt={image.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2" title={image.name}>
                  {image.name}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Added: {formatDate(image.createdAt)}
                </p>
                
                <div className="flex gap-2">
                  <Link
                    href={`/admin/dashboard/ecovillage/edit/${image.id}`}
                    className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(image.id, image.name)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-8 text-center text-gray-600">
          <p>Total images: {images.length}</p>
        </div>
      )}
    </div>
  );
}
