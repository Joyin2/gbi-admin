'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

// Default sections based on current gbillp.com/about page content
const defaultSections = [
  {
    title: "Our Mission",
    sectionType: "text",
    content: "<p>Green Business Initiative LLP is committed to fostering sustainable agriculture, empowering local farmers, and promoting eco-friendly products. We aim to create a greener, more prosperous future for all.</p>",
    order: 1,
    isActive: true
  },
  {
    title: "Sustainable Agriculture",
    sectionType: "values",
    content: "<p>Promoting eco-friendly farming practices that preserve natural resources and biodiversity while producing high-quality crops.</p>",
    icon: "🌱",
    order: 2,
    isActive: true
  },
  {
    title: "Community Empowerment",
    sectionType: "values",
    content: "<p>Supporting local farmers with fair trade practices, education, and resources to build self-sustaining communities.</p>",
    icon: "🤝",
    order: 3,
    isActive: true
  },
  {
    title: "Global Market Access",
    sectionType: "values",
    content: "<p>Creating pathways for premium local products to reach international markets while maintaining authenticity and quality.</p>",
    icon: "🌍",
    order: 4,
    isActive: true
  },
  {
    title: "Environmental Conservation",
    sectionType: "values",
    content: "<p>Implementing practices that reduce carbon footprint, minimize waste, and protect natural ecosystems.</p>",
    icon: "🌿",
    order: 5,
    isActive: true
  },
  {
    title: "Empowering Local Communities And Products",
    sectionType: "mixed",
    content: "<p>At Green Business Initiative LLP, we are dedicated to advancing sustainable agriculture and empowering local communities across India. Through strategic partnerships and innovative practices, we actively promote eco-friendly solutions and provide vital support to farmers' initiatives.</p><p>Our initiatives aim to contribute to the local economy by producing high-quality agricultural products while preserving the environment and biodiversity. Additionally, we support the lifestyle, culture, and heritage of local and tribal communities, fostering a positive environment that enhances social harmony and peace.</p>",
    order: 6,
    isActive: true
  },
  {
    title: "Making Our Local Agri-Treasures Global",
    sectionType: "mixed",
    content: "<p>Green Business Initiative LLP is engaged in agri-based and related commercial activities, including farming, production, sales, distribution, branding, marketing, and supply of grains, fruits, homemade pickles, and handicraft products.</p><p>We aim to transform these local agri-treasures into global commodities by leveraging branding, digital marketing, building robust networks and supply chains, and fostering local innovations. By partnering with individuals and initiatives, we seek to support and uplift local agro-based businesses and farmers, ensuring their products and innovations reach a global audience.</p>",
    order: 7,
    isActive: true
  },
  {
    title: "Moving Together With Ecology And Economy",
    sectionType: "mixed",
    content: "<p>Green Business Initiative LLP is committed to promoting sustainable and eco-friendly agricultural practices that balance economic growth with environmental preservation. Our products and services engage in activities supporting conservation efforts and biodiversity while promoting a greener future.</p><p>By harmonizing ecological and economic progress, we strive to cultivate a sustainable model for long-term development, creating a meaningful impact one harvest at a time.</p>",
    order: 8,
    isActive: true
  },
  {
    title: "Our Ethics And Compliances",
    sectionType: "list",
    content: "<p>We conduct our business by complying with applicable laws.</p>",
    listItems: [
      "Green Business Initiative LLP is incorporated as a partnership with the Ministry of Corporate Affairs, Government of India, and formed as a partnership business under the Limited Liability Partnership Act 2008.",
      "The Company is also registered with the Ministry of MSME.",
      "Licensed under the Assam Municipal Act 1956.",
      "Green Business Initiative LLP has also filed several Trademarks for operating its business."
    ],
    order: 9,
    isActive: true
  },
  {
    title: "Authorised By",
    subtitle: "Official certifications and authorizations",
    sectionType: "mixed",
    content: "<p>Green Business Initiative LLP operates under official recognition and authorization from multiple government bodies and certification agencies:</p><ul><li>Ashok Stambh</li><li>Assam Startup</li><li>FSSAI</li><li>Ministry of Corporate Affairs</li><li>MSME</li><li>Startup India</li></ul>",
    order: 10,
    isActive: true
  },
  {
    title: "Our Values",
    subtitle: "Core principles that guide our mission",
    sectionType: "text",
    content: "<h3>♻️ Sustainability</h3><p>We prioritize environmentally responsible practices in all aspects of our business, from farming to packaging.</p><h3>🤝 Community</h3><p>We believe in uplifting local communities through fair trade, education, and economic opportunities.</p><h3>⭐ Quality</h3><p>We maintain the highest standards in our products, ensuring premium quality from farm to table.</p><h3>💡 Innovation</h3><p>We continuously explore new methods and technologies to improve our sustainable agricultural practices.</p><h3>👁️ Transparency</h3><p>We believe in honest communication with our partners, customers, and communities about our practices and products.</p><h3>🌏 Global Vision</h3><p>We aim to connect local producers with global markets while preserving cultural heritage and traditional knowledge.</p>",
    order: 11,
    isActive: true
  },
  {
    title: "Join Our Mission",
    sectionType: "cta",
    content: "<p>Whether you're a farmer, investor, or consumer, there are many ways to be part of our sustainable journey. Together, we can create a greener future.</p>",
    buttonText: "Contact Us",
    buttonLink: "/contact",
    order: 12,
    isActive: true
  }
];

export default function SeedAboutSections() {
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [existingSections, setExistingSections] = useState(0);
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

  useEffect(() => {
    if (!authLoading) {
      checkExistingSections();
    }
  }, [authLoading]);

  const checkExistingSections = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'aboutSections'));
      setExistingSections(snapshot.size);
    } catch (error) {
      console.error('Error checking existing sections:', error);
    }
  };

  const handleSeed = async () => {
    if (existingSections > 0) {
      const confirmed = window.confirm(
        `You already have ${existingSections} about sections. This will add ${defaultSections.length} more sections. Do you want to continue?`
      );
      if (!confirmed) return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const promises = defaultSections.map(async (section) => {
        const sectionData = {
          ...section,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        return addDoc(collection(db, 'aboutSections'), sectionData);
      });

      await Promise.all(promises);

      setStatus({
        type: 'success',
        message: `Successfully added ${defaultSections.length} about sections!`
      });

      setTimeout(() => {
        router.push('/admin/dashboard/about');
      }, 2000);

    } catch (error) {
      console.error('Error seeding sections:', error);
      setStatus({
        type: 'error',
        message: 'Failed to add sections. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Seed About Page Sections</h1>
        <p className="text-gray-600">
          This will populate your About page with pre-defined sections based on the current Green Business Initiative content.
        </p>
      </div>

      {status.message && (
        <div className={`mb-6 p-4 rounded-lg ${
          status.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {status.message}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What will be added:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultSections.map((section, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600">#{section.order}</span>
                <h3 className="font-medium text-gray-900">{section.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  section.sectionType === 'text' ? 'bg-blue-100 text-blue-800' :
                  section.sectionType === 'values' ? 'bg-yellow-100 text-yellow-800' :
                  section.sectionType === 'list' ? 'bg-gray-100 text-gray-800' :
                  section.sectionType === 'cta' ? 'bg-pink-100 text-pink-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {section.sectionType}
                </span>
                {section.icon && (
                  <span className="text-sm">{section.icon}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Current Status</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You currently have <strong>{existingSections}</strong> about sections.</p>
              {existingSections > 0 && (
                <p className="mt-1">Seeding will add {defaultSections.length} more sections to your existing ones.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/admin/dashboard/about')}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSeed}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Adding Sections...' : `Add ${defaultSections.length} Sections`}
        </button>
      </div>
    </div>
  );
} 