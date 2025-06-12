'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

export default function EditInvestorDocument() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const type = searchParams.get('type') || 'documents';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchDocument() {
      try {
        const collectionName = type === 'documents' ? 'investorDocuments' : 'productCatalogues';
        const docRef = await getDoc(doc(db, collectionName, id));
        if (docRef.exists()) {
          const data = docRef.data();
          setTitle(data.title);
          setDescription(data.description || '');
          setFileUrl(data.fileUrl);
          setFileName(data.fileName || '');
        } else {
          alert('Document not found');
          router.push('/admin/dashboard/investor');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        alert('Failed to load document');
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [id, router, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    setSaving(true);
    
    try {
      const collectionName = type === 'documents' ? 'investorDocuments' : 'productCatalogues';
      // Update document in Firestore
      await updateDoc(doc(db, collectionName, id), {
        title,
        description,
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/investor');
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document. Please try again.');
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
        <h1 className="text-2xl font-bold text-gray-900">
          Edit {type === 'documents' ? 'Investor Document' : 'Product Catalogue'}
        </h1>
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
            {type === 'documents' ? 'Document' : 'Catalogue'} Title
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
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-900">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900"
            rows={4}
          />
        </div>
        
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Current File
          </label>
          <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
            <span className="text-gray-700 mr-3">{fileName}</span>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded bg-green-500 px-3 py-1.5 text-white hover:bg-green-600 font-medium ml-auto"
            >
              View File
            </a>
          </div>
          <p className="mt-1 text-xs text-gray-500">To replace the file, please delete this item and upload a new one</p>
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