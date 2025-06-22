'use client';

import { useEffect, useState, use } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/app/admin/components/RichTextEditor';

interface ExistingDocument {
  name: string;
  url: string;
  type: string;
}

interface NewDocument {
  file: File;
  name: string;
  type: string;
}

export default function EditCareer({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [active, setActive] = useState(true);
  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([]);
  const [newDocuments, setNewDocuments] = useState<NewDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchCareer() {
      try {
        const careerDoc = await getDoc(doc(db, 'careers', id));
        if (careerDoc.exists()) {
          const data = careerDoc.data();
          setTitle(data.title);
          setDescription(data.description);
          setActive(data.active);
          setApplyLink(data.applyLink || '');
          setExistingDocuments(data.documents || []);
        } else {
          alert('Career opportunity not found');
          router.push('/admin/dashboard/career');
        }
      } catch (error) {
        console.error('Error fetching career:', error);
        alert('Failed to load career opportunity');
      } finally {
        setLoading(false);
      }
    }

    fetchCareer();
  }, [id, router]);

  const handleNewDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const document: NewDocument = {
        file,
        name: file.name,
        type: fileExtension
      };

      setNewDocuments(prev => [...prev, document]);
    });

    // Reset input
    e.target.value = '';
  };

  const removeExistingDocument = (index: number) => {
    setExistingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewDocument = (index: number) => {
    setNewDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewDocuments = async () => {
    if (newDocuments.length === 0) return [];

    const uploadedDocs = [];
    const totalFiles = newDocuments.length;

    for (let i = 0; i < newDocuments.length; i++) {
      const doc = newDocuments[i];
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
    
    setSaving(true);
    setUploadProgress(0);
    
    try {
      // Upload new documents
      const uploadedNewDocuments = await uploadNewDocuments();
      
      // Combine existing and new documents
      const allDocuments = [...existingDocuments, ...uploadedNewDocuments];
      
      // Update career in Firestore
      await updateDoc(doc(db, 'careers', id), {
        title,
        description,
        applyLink,
        documents: allDocuments,
        active,
        updatedAt: serverTimestamp(),
      });
      
      router.push('/admin/dashboard/career');
    } catch (error) {
      console.error('Error updating career:', error);
      alert('Failed to update career opportunity. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Career Opportunity</h1>
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

        {/* Existing Documents */}
        {existingDocuments.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Current Documents
            </label>
            <div className="space-y-2">
              {existingDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {doc.type.toUpperCase()}
                    </span>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {doc.name}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingDocument(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Documents */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Add New Documents
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
                    onChange={handleNewDocumentUpload}
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

          {/* New Document List */}
          {newDocuments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-900">New Documents to Upload:</h4>
              {newDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-md">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {doc.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-900">{doc.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewDocument(index)}
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
        {saving && uploadProgress > 0 && (
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
          disabled={saving}
          className="rounded bg-black px-5 py-2.5 text-white hover:bg-gray-800 disabled:bg-gray-400 font-medium"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
} 