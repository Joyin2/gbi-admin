'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';



interface AboutSection {
  id: string;
  title: string;
  subtitle?: string;
  sectionType: 'heading' | 'text' | 'image' | 'video' | 'mixed' | 'list' | 'values' | 'mission';
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaFiles?: { url: string; type: 'image' | 'video'; filename: string; }[];
  order: number;
  isActive: boolean;
  icon?: string;
  buttonText?: string;
  buttonLink?: string;
  listItems?: string[];
  valueCards?: { icon: string; title: string; description: string; }[];
  missionCards?: { title: string; description: string; }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function AboutSectionsPage() {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = query(collection(db, 'aboutSections'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const aboutSections: AboutSection[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        aboutSections.push({
          id: doc.id,
          title: data.title || '',
          subtitle: data.subtitle || '',
          sectionType: data.sectionType || 'text',
          content: data.content || '',
          mediaUrl: data.mediaUrl || '',
          mediaType: data.mediaType || 'image',
          mediaFiles: data.mediaFiles || [],
          order: data.order || 0,
          isActive: data.isActive !== false,
          icon: data.icon || '',
          buttonText: data.buttonText || '',
          buttonLink: data.buttonLink || '',
          listItems: data.listItems || [],
          valueCards: data.valueCards || [],
          missionCards: data.missionCards || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      setSections(aboutSections);
    } catch (error) {
      console.error('Error fetching about sections:', error);
      setError('Failed to load about sections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'aboutSections', id));
        setSections(sections.filter(section => section.id !== id));
      } catch (error) {
        console.error('Error deleting about section:', error);
        setError('Failed to delete section. Please try again.');
      }
    }
  };

  const getSectionTypeIcon = (type: string) => {
    switch (type) {
      case 'heading':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'text':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'mixed':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'list':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'values':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cta':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'mission':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getSectionTypeColor = (type: string) => {
    switch (type) {
      case 'heading': return 'bg-purple-100 text-purple-800';
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'mixed': return 'bg-orange-100 text-orange-800';
      case 'list': return 'bg-gray-100 text-gray-800';
      case 'values': return 'bg-yellow-100 text-yellow-800';
      case 'cta': return 'bg-pink-100 text-pink-800';
      case 'mission': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Page Sections</h1>
          <p className="text-gray-600 mt-1">Manage sections for your About page content</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/admin/dashboard/about/setup-guide" 
            className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 transition-colors"
          >
            📱 Setup Guide
          </Link>
          <Link 
            href="/admin/dashboard/about/key-sections" 
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            ⭐ Key Sections
          </Link>
          {sections.length === 0 && (
            <Link 
              href="/admin/dashboard/about/seed" 
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
            >
              Quick Start
            </Link>
          )}
          <Link 
            href="/admin/dashboard/about/new" 
            className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 transition-colors"
          >
            Add New Section
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Quick Access to Key Sections
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Need to edit the main About page sections like &quot;Empowering Local Communities&quot;, &quot;Our Values&quot;, or &quot;Ethics &amp; Compliances&quot;? 
                Use the <strong>⭐ Key Sections</strong> button above for quick access to these important sections with photo and video upload support.
              </p>
            </div>
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No about sections yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first about page section or use our Quick Start to populate with default content.</p>
          <div className="flex gap-2 justify-center">
            <Link 
              href="/admin/dashboard/about/seed"
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
            >
              Quick Start (Recommended)
            </Link>
            <Link 
              href="/admin/dashboard/about/new"
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 transition-colors"
            >
              Add First Section
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSectionTypeColor(section.sectionType)}`}>
                      <div className="mr-1.5">
                        {getSectionTypeIcon(section.sectionType)}
                      </div>
                      {section.sectionType.charAt(0).toUpperCase() + section.sectionType.slice(1)}
                    </div>
                    <span className="text-sm text-gray-500">Order: {section.order}</span>
                    {!section.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                  
                  {section.subtitle && (
                    <p className="text-sm text-gray-600 mb-2">{section.subtitle}</p>
                  )}
                  
                  {section.content && (
                    <div className="text-sm text-gray-700 mb-3 line-clamp-3" 
                         dangerouslySetInnerHTML={{ __html: section.content.substring(0, 200) + (section.content.length > 200 ? '...' : '') }} />
                  )}
                  
                  {section.listItems && section.listItems.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      {section.listItems.length} list items
                    </div>
                  )}
                  
                  {section.valueCards && section.valueCards.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="mr-2">🏆</span>
                      <span>{section.valueCards.length} value cards:</span>
                      {section.valueCards.slice(0, 3).map((card, index) => (
                        <span key={index} className="block ml-4 truncate">
                          • {card.title}
                        </span>
                      ))}
                      {section.valueCards.length > 3 && (
                        <span className="text-xs text-gray-500">+{section.valueCards.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  {section.missionCards && section.missionCards.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="mr-2">🎯</span>
                      <span>{section.missionCards.length} mission cards:</span>
                      {section.missionCards.slice(0, 3).map((card, index) => (
                        <span key={index} className="block ml-4 truncate">
                          • {card.title}
                        </span>
                      ))}
                      {section.missionCards.length > 3 && (
                        <span className="text-xs text-gray-500">+{section.missionCards.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  {section.buttonText && (
                    <div className="text-sm text-gray-600 mb-2">
                      Button: &quot;{section.buttonText}&quot;
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Created: {section.createdAt.toDate().toLocaleDateString()}
                  </div>
                </div>
                
                {/* Show multiple media files for image sections */}
                {section.sectionType === 'image' && section.mediaFiles && section.mediaFiles.length > 0 && (
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex flex-wrap gap-2 max-w-40">
                      {section.mediaFiles.slice(0, 3).map((mediaFile, index) => (
                        <div key={index} className="relative">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                            {mediaFile.type === 'video' ? (
                              <video
                                src={mediaFile.url}
                                className="w-full h-full object-cover"
                                preload="metadata"
                                muted
                              />
                            ) : (
                              <Image
                                src={mediaFile.url}
                                alt={`${section.title} ${index + 1}`}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          {mediaFile.type === 'video' && (
                            <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                              🎥
                            </div>
                          )}
                        </div>
                      ))}
                      {section.mediaFiles.length > 3 && (
                        <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                          +{section.mediaFiles.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {section.mediaFiles.length} file{section.mediaFiles.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                
                {/* Show single media file for other section types */}
                {section.sectionType !== 'image' && section.mediaUrl && (
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      {section.mediaType === 'video' ? (
                        <video
                          src={section.mediaUrl}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                        />
                      ) : (
                        <Image
                          src={section.mediaUrl}
                          alt={section.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/admin/dashboard/about/edit/${section.id}`}
                  className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(section.id, section.title)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sections.length > 0 && (
        <div className="mt-8 text-center text-gray-600">
          <p>Total sections: {sections.length}</p>
        </div>
      )}
    </div>
  );
} 