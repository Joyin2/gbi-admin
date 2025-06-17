'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

interface RiceProduct {
  id: string;
  name: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  description: string;
  price?: string;
  featured: boolean;
  createdAt: {
    toDate: () => Date;
  };
}

export default function RiceProducts() {
  const [products, setProducts] = useState<RiceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    async function fetchProducts() {
      try {
        const productsQuery = query(collection(db, 'riceProducts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(productsQuery);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RiceProduct[];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching rice products:', error);
        setError('Failed to load rice products. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchProducts();
    }
  }, [authLoading]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rice product? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'riceProducts', id));
      setProducts(products.filter(product => product.id !== id));
    } catch (error) {
      console.error('Error deleting rice product:', error);
      setError('Failed to delete rice product. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rice Products</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your rice products and descriptions
          </p>
        </div>
        <Link
          href="/admin/dashboard/rice/new"
          className="rounded-lg bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
        >
          Add New Rice Product
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-md">
          <p className="text-gray-600">No rice products found. Create your first rice product!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg bg-white shadow-md overflow-hidden group">
              <div className="relative h-48 w-full">
                {(product.mediaUrl || product.imageUrl) ? (
                  <>
                    {product.mediaType === 'video' ? (
                      <video
                        src={product.mediaUrl || product.imageUrl}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        preload="metadata"
                        muted
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <Image
                        src={product.mediaUrl || product.imageUrl || ''}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                    {product.mediaType === 'video' && (
                      <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-70 px-2 py-1 text-xs text-white">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <span className="text-gray-400">No media</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                  {product.featured && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Featured
                    </span>
                  )}
                </div>
                {product.price && (
                  <p className="mt-1 text-sm text-gray-600">Price: {product.price}</p>
                )}
                <div className="mt-4 flex justify-between">
                  <Link
                    href={`/admin/dashboard/rice/edit/${product.id}`}
                    className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}