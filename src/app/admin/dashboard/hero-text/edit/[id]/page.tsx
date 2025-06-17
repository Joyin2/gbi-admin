'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

interface HeroTextEditProps {
  params: Promise<{ id: string }>;
}

export default function EditHeroText({ params }: HeroTextEditProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [pageName, setPageName] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
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

  const fetchHeroText = useCallback(async () => {
    try {
      setDataLoading(true);
      const heroTextDoc = await getDoc(doc(db, 'heroTexts', id));
      
      if (heroTextDoc.exists()) {
        const data = heroTextDoc.data();
        setPageName(data.pageName || '');
        setTitle(data.title || '');
        setSubtitle(data.subtitle || '');
        setButtonText(data.buttonText || '');
        setButtonLink(data.buttonLink || '');
      } else {
        setStatus({
          type: 'error',
          message: 'Hero text not found'
        });
        setTimeout(() => router.push('/admin/dashboard/hero-text'), 2000);
      }
    } catch (error) {
      console.error('Error fetching hero text:', error);
      setStatus({
        type: 'error',
        message: 'Failed to load hero text data'
      });
    } finally {
      setDataLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!authLoading) {
      fetchHeroText();
    }
  }, [authLoading, fetchHeroText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a title'
      });
      return;
    }
    
    if (!subtitle.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a subtitle'
      });
      return;
    }


    
    setLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      console.log('Starting hero text update process...');
      
      // Update hero text in Firestore
      const heroTextData = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        buttonText: buttonText.trim(),
        buttonLink: buttonLink.trim(),
        updatedAt: serverTimestamp(),
      };

      console.log('Updating hero text in Firestore:', heroTextData);
      await updateDoc(doc(db, 'heroTexts', id), heroTextData);
      
      console.log('Hero text updated successfully');
      setStatus({
        type: 'success',
        message: 'Hero text updated successfully!'
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard/hero-text');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating hero text:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update hero text. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Hero Text</h1>
            <p className="text-gray-600 mt-1">Update hero section for <span className="font-medium">{pageName}</span></p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard/hero-text')}
            className="btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hero Texts
          </button>
        </div>
      </div>

      {status.message && (
        <div className={`p-4 rounded-xl ${
          status.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={status.type === 'success' ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
            {status.message}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Hero Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              placeholder="Enter the main hero title"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">This is the main heading that visitors will see first</p>
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
              Hero Subtitle *
            </label>
            <input
              id="subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              placeholder="Enter a compelling subtitle"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">A short tagline or secondary heading</p>
          </div>



          {/* Button Text (Optional) */}
          <div>
            <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
              Button Text (Optional)
            </label>
            <input
              id="buttonText"
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              placeholder="e.g., Learn More, Get Started, Contact Us"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Text for the call-to-action button (leave empty if no button needed)</p>
          </div>

          {/* Button Link (Optional) */}
          <div>
            <label htmlFor="buttonLink" className="block text-sm font-medium text-gray-700 mb-2">
              Button Link (Optional)
            </label>
            <input
              id="buttonLink"
              type="text"
              value={buttonLink}
              onChange={(e) => setButtonLink(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              placeholder="e.g., /about, /contact, https://example.com"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Where the button should link to (internal path or external URL)</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Hero Text
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard/hero-text')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="text-center">
          <h2 className="text-sm font-medium text-blue-100 mb-2">PREVIEW</h2>
          <h1 className="text-3xl font-bold mb-4">{title || 'Your Hero Title'}</h1>
          <p className="text-xl text-blue-100 mb-6">{subtitle || 'Your Hero Subtitle'}</p>
          {buttonText && (
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
