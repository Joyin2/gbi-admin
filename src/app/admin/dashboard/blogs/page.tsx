'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

interface Blog {
  id: string;
  title: string;
  imageUrl: string;
  content: string;
  authorEmail?: string;
  createdAt: {
    toDate: () => Date;
  };
}

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
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
    async function fetchBlogs() {
      try {
        const blogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(blogsQuery);
        const blogsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Blog[];
        setBlogs(blogsData);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setError('Failed to load blogs. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchBlogs();
    }
  }, [authLoading]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'blogs', id));
      setBlogs(blogs.filter(blog => blog.id !== id));
    } catch (error) {
      console.error('Error deleting blog:', error);
      setError('Failed to delete blog. Please try again.');
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
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your blog posts and content
          </p>
        </div>
        <Link
          href="/admin/dashboard/blogs/new"
          className="rounded-lg bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
        >
          Create New Blog
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {blogs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-900">No blog posts yet</h3>
          <p className="mb-6 text-gray-600">Get started by creating your first blog post</p>
          <Link
            href="/admin/dashboard/blogs/new"
            className="rounded-lg bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
          >
            Create Your First Blog
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md"
            >
              {blog.imageUrl && (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={blog.imageUrl}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="mb-2 text-xl font-semibold text-gray-900 line-clamp-2">
                  {blog.title}
                </h2>
                <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                  <span>{blog.createdAt.toDate().toLocaleDateString()}</span>
                  {blog.authorEmail && (
                    <span className="text-gray-400">by {blog.authorEmail}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/admin/dashboard/blogs/edit/${blog.id}`)}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
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