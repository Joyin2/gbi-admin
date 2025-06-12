'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewInvestorDocument() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'documents' | 'catalogues'>('documents');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'catalogues') {
      setType('catalogues');
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!file) {
      alert('Please select a file');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Starting document upload process...');
      // Upload file to Firebase Storage
      const storagePath = type === 'documents' ? 'investor-documents' : 'product-catalogues';
      const storageRef = ref(storage, `${storagePath}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
      console.log('File uploaded successfully, URL:', fileUrl);
      
      // Add document to Firestore
      const documentData = {
        title,
        description,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        createdAt: serverTimestamp(),
      };
      
      const collectionName = type === 'documents' ? 'investorDocuments' : 'productCatalogues';
      console.log('Attempting to add document to Firestore:', documentData);
      const docRef = await addDoc(collection(db, collectionName), documentData);
      console.log('Document added successfully with ID:', docRef.id);
      
      router.push('/admin/dashboard/investor');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error creating document:', error);
        alert('Failed to upload document. Please try again. Error: ' + error.message);
      } else {
        alert('Failed to upload document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Add New {type === 'documents' ? 'Investor Document' : 'Product Catalogue'}
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
          <label htmlFor="file" className="mb-2 block text-sm font-medium text-gray-900">
            {type === 'documents' ? 'Document' : 'Catalogue'} File (PDF, DOCX, etc.)
          </label>
          <input
            id="file"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            onChange={handleFileChange}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900"
            required
          />
          {file && (
            <p className="mt-2 text-sm text-gray-700">
              Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:bg-gray-400"
        >
          {loading ? 'Uploading...' : `Upload ${type === 'documents' ? 'Document' : 'Catalogue'}`}
        </button>
      </form>
    </div>
  );
}