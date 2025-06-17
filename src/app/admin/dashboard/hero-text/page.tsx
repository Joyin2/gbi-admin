'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

interface HeroText {
  id: string;
  pageName: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
  updatedAt?: { toDate: () => Date } | null;
}

// Hero Text Card Component
function HeroTextCard({ heroText, formatDate }: { heroText: HeroText; formatDate: (timestamp: { toDate: () => Date } | null) => string }) {
  return (
    <div className="group bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{heroText.pageName}</h3>
          <p className="text-xs text-gray-500">Last updated: {formatDate(heroText.updatedAt)}</p>
        </div>
        <Link
          href={`/admin/dashboard/hero-text/edit/${heroText.id}`}
          className="inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </Link>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Title</p>
          <p className="text-sm font-medium text-gray-900 line-clamp-2">{heroText.title}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Subtitle</p>
          <p className="text-sm text-gray-700 line-clamp-1">{heroText.subtitle}</p>
        </div>

        {heroText.buttonText && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Button</p>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                {heroText.buttonText}
              </span>
              {heroText.buttonLink && (
                <span className="text-xs text-gray-500">→ {heroText.buttonLink}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const defaultPages = [
  // Main Pages
  { id: 'home', pageName: 'Home Page', defaultTitle: 'Welcome to Green Business Initiative', defaultSubtitle: 'Building Sustainable Communities' },
  { id: 'about', pageName: 'About Us', defaultTitle: 'About Green Business Initiative', defaultSubtitle: 'Our Story & Mission' },
  { id: 'blogs', pageName: 'Blog', defaultTitle: 'Latest News & Updates', defaultSubtitle: 'Stay Informed' },
  { id: 'ecovillage', pageName: 'Ecovillage', defaultTitle: 'Our Ecovillage', defaultSubtitle: 'Sustainable Living Community' },
  { id: 'internships', pageName: 'Internships', defaultTitle: 'Join Our Team', defaultSubtitle: 'Internship Opportunities' },
  { id: 'investor', pageName: 'Investor', defaultTitle: 'Investor Information', defaultSubtitle: 'Business Documents & Resources' },
  { id: 'contact', pageName: 'Contact Us', defaultTitle: 'Get In Touch', defaultSubtitle: 'We\'d Love to Hear From You' },

  // Product Category Pages
  { id: 'products-pickle', pageName: 'Pickle', defaultTitle: 'Organic Pickles', defaultSubtitle: 'Traditional Flavors, Natural Ingredients' },
  { id: 'products-rice', pageName: 'Rice', defaultTitle: 'Premium Rice', defaultSubtitle: 'Farm Fresh & Organic' },
  { id: 'products-dry-bean', pageName: 'Dry Bean (Forash)', defaultTitle: 'Dry Bean (Forash)', defaultSubtitle: 'Premium Quality Beans' },
  { id: 'products-dry-hathkora', pageName: 'Dry Hathkora', defaultTitle: 'Dry Hathkora', defaultSubtitle: 'Traditional Citrus Delight' },
  { id: 'products-tezpatta', pageName: 'Tezpatta', defaultTitle: 'Tezpatta (Bay Leaves)', defaultSubtitle: 'Aromatic Spice Essential' },
  { id: 'products-plantation', pageName: 'Orange & Lemon Plantation', defaultTitle: 'Orange & Lemon Plantation', defaultSubtitle: 'Fresh Citrus from Our Farms' },
  { id: 'products-chaiwala', pageName: 'Sylethi Chaiwala', defaultTitle: 'Sylethi Chaiwala', defaultSubtitle: 'Authentic Tea Experience' },
];

export default function HeroTextPage() {
  const [heroTexts, setHeroTexts] = useState<HeroText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHeroTexts();
  }, []);

  const fetchHeroTexts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const querySnapshot = await getDocs(collection(db, 'heroTexts'));
      const existingTexts: HeroText[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        existingTexts.push({
          id: doc.id,
          pageName: data.pageName,
          title: data.title,
          subtitle: data.subtitle,
          buttonText: data.buttonText,
          buttonLink: data.buttonLink,
          updatedAt: data.updatedAt,
        });
      });

      // Create missing hero texts for default pages
      const existingIds = existingTexts.map(text => text.id);
      const missingPages = defaultPages.filter(page => !existingIds.includes(page.id));
      
      for (const page of missingPages) {
        const newHeroText = {
          pageName: page.pageName,
          title: page.defaultTitle,
          subtitle: page.defaultSubtitle,
          buttonText: '',
          buttonLink: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await setDoc(doc(db, 'heroTexts', page.id), newHeroText);
        existingTexts.push({
          id: page.id,
          ...newHeroText,
        });
      }
      
      // Sort by page name
      existingTexts.sort((a, b) => a.pageName.localeCompare(b.pageName));
      setHeroTexts(existingTexts);
      
    } catch (error) {
      console.error('Error fetching hero texts:', error);
      setError('Failed to load hero texts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: { toDate: () => Date } | null) => {
    if (!timestamp) return 'Not updated';
    try {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Not updated';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hero Text Management</h1>
            <p className="text-gray-600 mt-1">Manage hero sections for all pages across your website</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>All pages configured</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Hero Texts Grid */}
      <div className="space-y-8">
        {/* Main Pages Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Main Pages</h2>
            <p className="text-sm text-gray-600">Hero sections for primary website pages</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {heroTexts
              .filter(heroText => !heroText.id.startsWith('products-') && !heroText.id.startsWith('investor-') && heroText.id !== 'products' && heroText.id !== 'team')
              .map((heroText) => (
                <HeroTextCard key={heroText.id} heroText={heroText} formatDate={formatDate} />
              ))}
          </div>
        </div>

        {/* Product Pages Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Product Pages</h2>
            <p className="text-sm text-gray-600">Hero sections for product categories and catalogues</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {heroTexts
              .filter(heroText => heroText.id.startsWith('products-') && heroText.id !== 'investor-documents' && heroText.id !== 'products-pickles' && heroText.id !== 'products-catalogues' && heroText.id !== 'products-handicrafts')
              .map((heroText) => (
                <HeroTextCard key={heroText.id} heroText={heroText} formatDate={formatDate} />
              ))}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">About Hero Text Management</h3>
            <div className="text-blue-800 space-y-2 text-sm">
              <p>• <strong>Hero sections</strong> are the prominent banner areas at the top of each page</p>
              <p>• <strong>Main Pages</strong> include Home, About, Blog, Ecovillage, Internships, Investor, and Contact</p>
              <p>• <strong>Product Pages</strong> include Pickle, Rice, Dry Bean (Forash), Dry Hathkora, Tezpatta, Orange & Lemon Plantation, and Sylethi Chaiwala</p>
              <p>• <strong>Title</strong> is the main heading that captures attention</p>
              <p>• <strong>Subtitle</strong> provides additional context or tagline</p>
              <p>• <strong>Button</strong> (optional) provides a call-to-action with link</p>
              <p>• Changes are applied immediately across your website</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
