'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';

export default function NewCareerIntro() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('<p>Start writing your career intro section...</p>');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    setLoading(true);
    
    try {
      // Add career intro to Firestore
      await addDoc(collection(db, 'careerIntros'), {
        title,
        description,
        active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/career');
    } catch (error) {
      console.error('Error creating career intro:', error);
      alert('Failed to create career intro section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Career Intro Section</h1>
        <button
          onClick={() => router.back()}
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Examples from your website</h3>
        <p className="text-blue-700 mb-2">Based on your current site, you might want to create:</p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li><strong>"Our Career And Partnership Opportunities"</strong> - Main intro section</li>
          <li><strong>"Why Join Us?"</strong> - Benefits and advantages section</li>
          <li><strong>"Ready to Start Your Journey?"</strong> - Call-to-action section</li>
        </ul>
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
            placeholder="e.g., Our Career And Partnership Opportunities"
            required
          />
          <p className="mt-1 text-xs text-gray-500">This will be the main heading for this section</p>
        </div>
        
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Section Content
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <RichTextEditor content={description} onUpdate={setDescription} />
          </div>
          <p className="mt-1 text-xs text-gray-500">Use the editor to format your content with rich text, lists, and links</p>
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
          disabled={loading}
          className="rounded bg-black px-5 py-2.5 text-white hover:bg-gray-800 disabled:bg-gray-400 font-medium"
        >
          {loading ? 'Creating...' : 'Create Intro Section'}
        </button>
      </form>
    </div>
  );
} 