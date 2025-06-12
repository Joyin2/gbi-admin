'use client';

import { useEffect, useState, use } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import Image from 'next/image';

export default function EditBlog({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          setCurrentImageUrl(data.imageUrl);
          setImagePreview(data.imageUrl);
        } else {
          alert('Blog not found');
          router.push('/admin/dashboard/blogs');
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
        alert('Failed to load blog');
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [id, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
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
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    setSaving(true);
    
    try {
      let imageUrl = currentImageUrl;
      
      // Upload new image if selected
      if (image) {
        const storageRef = ref(storage, `blog-images/${Date.now()}-${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Update blog in Firestore
      await updateDoc(doc(db, 'blogs', id), {
        title,
        content,
        imageUrl,
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/blogs');
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Failed to update blog. Please try again.');
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Blog</h1>
        <button
          onClick={() => router.back()}
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-900">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900"
            required
          />
        </div>
        
        <div>
          <label htmlFor="image" className="mb-2 block text-sm font-medium text-gray-900">
            Featured Image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900"
          />
          {imagePreview && (
            <div className="mt-2">
              <Image 
                src={imagePreview} 
                alt="Preview" 
                width={160}
                height={160}
                className="h-40 w-auto object-cover rounded border" 
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
        
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Content
          </label>
          <RichTextEditor content={content} onUpdate={setContent} />
        </div>
        
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}