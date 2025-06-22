'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';

export default function EditCareerIntro({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchCareerIntro() {
      try {
        const introDoc = await getDoc(doc(db, 'careerIntros', id));
        if (introDoc.exists()) {
          const data = introDoc.data();
          setTitle(data.title);
          setDescription(data.description);
          setActive(data.active);
        } else {
          alert('Career intro section not found');
          router.push('/admin/dashboard/career');
        }
      } catch (error) {
        console.error('Error fetching career intro:', error);
        alert('Failed to load career intro section');
      } finally {
        setLoading(false);
      }
    }

    fetchCareerIntro();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    setSaving(true);
    
    try {
      // Update career intro in Firestore
      await updateDoc(doc(db, 'careerIntros', id), {
        title,
        description,
        active,
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/career');
    } catch (error) {
      console.error('Error updating career intro:', error);
      alert('Failed to update career intro section. Please try again.');
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Career Intro Section</h1>
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
            Section Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900"
            required
          />
        </div>
        
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Section Content
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <RichTextEditor content={description} onUpdate={setDescription} />
          </div>
        </div>
        
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
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{title || 'Section Title'}</h2>
            <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: description }} />
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