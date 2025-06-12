'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';

export default function NewInternship() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('<p>Start writing the internship description...</p>');
  const [applyLink, setApplyLink] = useState(''); // Add apply link state
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
      // Add internship to Firestore
      await addDoc(collection(db, 'internships'), {
        title,
        description,
        applyLink, // Include apply link in new internship
        active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/internship');
    } catch (error) {
      console.error('Error creating internship:', error);
      alert('Failed to create internship. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create New Internship</h1>
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
            Internship Title
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
            Description
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <RichTextEditor content={description} onUpdate={setDescription} />
          </div>
          <p className="mt-1 text-xs text-gray-500">Use the editor above to format your internship description</p>
        </div>
        
        <div>
          <label htmlFor="applyLink" className="mb-2 block text-sm font-medium text-gray-900">
            Apply Link
          </label>
          <input
            id="applyLink"
            type="url"
            value={applyLink}
            onChange={(e) => setApplyLink(e.target.value)}
            placeholder="https://example.com/apply"
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">Enter the URL where applicants can apply for this internship</p>
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
        
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-5 py-2.5 text-white hover:bg-gray-800 disabled:bg-gray-400 font-medium"
        >
          {loading ? 'Creating...' : 'Create Internship'}
        </button>
      </form>
    </div>
  );
}