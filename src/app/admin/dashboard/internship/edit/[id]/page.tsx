'use client';

import { useEffect, useState, use } from 'react'; // Add 'use' import
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';

// Remove the generateStaticParams function

export default function EditInternship({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchInternship() {
      try {
        const internshipDoc = await getDoc(doc(db, 'internships', id));
        if (internshipDoc.exists()) {
          const data = internshipDoc.data();
          setTitle(data.title);
          setDescription(data.description);
          setActive(data.active);
          setApplyLink(data.applyLink || ''); // Set apply link from data
        } else {
          alert('Internship not found');
          router.push('/admin/dashboard/internship');
        }
      } catch (error) {
        console.error('Error fetching internship:', error);
        alert('Failed to load internship');
      } finally {
        setLoading(false);
      }
    }

    fetchInternship();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    setSaving(true);
    
    try {
      // Update internship in Firestore
      await updateDoc(doc(db, 'internships', id), {
        title,
        description,
        applyLink, // Include apply link in update
        active,
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/internship');
    } catch (error) {
      console.error('Error updating internship:', error);
      alert('Failed to update internship. Please try again.');
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Internship</h1>
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
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900"
            required
          />
        </div>
        
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Description
          </label>
          <RichTextEditor content={description} onUpdate={setDescription} />
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
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-600">Enter the URL where applicants can apply for this internship</p>
        </div>
        
        <div className="flex items-center">
          <input
            id="active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-900">
            Active (visible on website)
          </label>
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