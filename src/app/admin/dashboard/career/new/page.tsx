'use client';

import { useState } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';

interface Document {
  file: File;
  name: string;
  type: string;
}

export default function NewCareer() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('<p>Start writing the career opportunity description...</p>');
  const [applyLink, setApplyLink] = useState('');
  const [active, setActive] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const router = useRouter();

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/rtf'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} not supported. Please upload PDF, PPT, DOC, XLS, TXT, or RTF files.`);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const document: Document = {
        file,
        name: file.name,
        type: fileExtension
      };

      setDocuments(prev => [...prev, document]);
    });

    // Reset input
    e.target.value = '';
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async () => {
    if (documents.length === 0) return [];

    const uploadedDocs = [];
    const totalFiles = documents.length;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const fileName = `careers/${Date.now()}-${doc.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `documents/${fileName}`);
      
      try {
        await uploadBytes(storageRef, doc.file);
        const downloadURL = await getDownloadURL(storageRef);
        
        uploadedDocs.push({
          name: doc.name,
          url: downloadURL,
          type: doc.type
        });

        setUploadProgress(((i + 1) / totalFiles) * 100);
      } catch (error) {
        console.error('Error uploading document:', error);
        throw new Error(`Failed to upload ${doc.name}`);
      }
    }

    return uploadedDocs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      // Upload documents first
      const uploadedDocuments = await uploadDocuments();
      
      // Add career to Firestore
      await addDoc(collection(db, 'careers'), {
        title,
        description,
        applyLink,
        documents: uploadedDocuments,
        active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/career');
    } catch (error) {
      console.error('Error creating career:', error);
      alert('Failed to create career opportunity. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create New Career Opportunity</h1>
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
            Career Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900"
            placeholder="e.g., Marketing Manager, Software Developer, Sustainability Specialist"
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
          <p className="mt-1 text-xs text-gray-500">Use the editor above to format your career opportunity description</p>
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
          <p className="mt-1 text-xs text-gray-500">Enter the URL where applicants can apply for this position</p>
        </div>

        {/* Document Upload Section */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Supporting Documents
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <label htmlFor="documents" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload documents (PDF, PPT, DOCX, XLS, TXT, RTF)
                  </span>
                  <input
                    id="documents"
                    type="file"
                    multiple
                    onChange={handleDocumentUpload}
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.rtf"
                    className="hidden"
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Click to select files or drag and drop. Max 10MB per file.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Document List */}
          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Selected Documents:</h4>
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {doc.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-900">{doc.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-sm text-gray-600 mt-1">Uploading documents... {Math.round(uploadProgress)}%</p>
          </div>
        )}
        
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
          {loading ? 'Creating...' : 'Create Career Opportunity'}
        </button>
      </form>
    </div>
  );
} 