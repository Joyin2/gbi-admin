'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, limit, query } from 'firebase/firestore';

interface FooterData {
  id?: string;
  socialHeading: string;
  companyName: string;
  companyDescription: string;
  productsSection: {
    title: string;
    items: string[];
  };
  usefulLinksSection: {
    title: string;
    items: { name: string; link: string; }[];
  };
  contactSection: {
    title: string;
    address: string;
    email: string;
    phone: string;
  };
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export default function FooterManagement() {
  const [footerData, setFooterData] = useState<FooterData>({
    socialHeading: "Get connected with us on social networks:",
    companyName: "Green Business Initiative LLP",
    companyDescription: "Green Business Initiative LLP (GBI) is an American Indian partnership, that is currently in the business that encompasses agriculture, animal husbandry, and related commercial activities.",
    productsSection: {
      title: "Products",
      items: [
        "Eco-Village",
        "Pickles",
        "Aromatic Rice",
        "Dry Bean",
        "Dry Hathkora",
        "Tezpatta",
        "Arts & Crafts",
        "Orange Plantation"
      ]
    },
    usefulLinksSection: {
      title: "Useful Links",
      items: [
        { name: "About GBI", link: "/about" },
        { name: "Eco-tourism", link: "/eco-tourism" },
        { name: "Blogs", link: "/blogs" },
        { name: "Contact Us", link: "/contact" },
        { name: "Privacy Policy", link: "/privacy-policy" }
      ]
    },
    contactSection: {
      title: "Contact",
      address: "Paikan, Gumra, Assam 788815",
      email: "info@gbillp.com",
      phone: "+91 99571 16126"
    },
    socialLinks: {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
      youtube: ""
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = query(collection(db, 'footerData'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        const data = docData.data();
        setFooterData({
          id: docData.id,
          ...data as FooterData
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching footer data:', error);
      setError('Failed to load footer data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSave = {
        ...footerData,
        updatedAt: serverTimestamp()
      };

      if (footerData.id) {
        await updateDoc(doc(db, 'footerData', footerData.id), dataToSave);
        setSuccess('Footer data updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'footerData'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
        setFooterData({ ...footerData, id: docRef.id });
        setSuccess('Footer data saved successfully!');
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (error: unknown) {
      console.error('Error saving footer data:', error);
      setError('Failed to save footer data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProductsChange = (index: number, value: string) => {
    const newProducts = [...footerData.productsSection.items];
    newProducts[index] = value;
    setFooterData({
      ...footerData,
      productsSection: {
        ...footerData.productsSection,
        items: newProducts
      }
    });
  };

  const addProduct = () => {
    setFooterData({
      ...footerData,
      productsSection: {
        ...footerData.productsSection,
        items: [...footerData.productsSection.items, ""]
      }
    });
  };

  const removeProduct = (index: number) => {
    const newProducts = footerData.productsSection.items.filter((_, i) => i !== index);
    setFooterData({
      ...footerData,
      productsSection: {
        ...footerData.productsSection,
        items: newProducts
      }
    });
  };

  const handleUsefulLinksChange = (index: number, field: 'name' | 'link', value: string) => {
    const newLinks = [...footerData.usefulLinksSection.items];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFooterData({
      ...footerData,
      usefulLinksSection: {
        ...footerData.usefulLinksSection,
        items: newLinks
      }
    });
  };

  const addUsefulLink = () => {
    setFooterData({
      ...footerData,
      usefulLinksSection: {
        ...footerData.usefulLinksSection,
        items: [...footerData.usefulLinksSection.items, { name: "", link: "" }]
      }
    });
  };

  const removeUsefulLink = (index: number) => {
    const newLinks = footerData.usefulLinksSection.items.filter((_, i) => i !== index);
    setFooterData({
      ...footerData,
      usefulLinksSection: {
        ...footerData.usefulLinksSection,
        items: newLinks
      }
    });
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFooterData({
      ...footerData,
      socialLinks: {
        ...footerData.socialLinks,
        [platform]: value
      }
    });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Footer Management</h1>
        <p className="text-gray-600 mt-1">Manage your website footer content and links</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Social Networks Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Social Networks
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social Networks Heading
            </label>
            <input
              type="text"
              value={footerData.socialHeading}
              onChange={(e) => setFooterData({ ...footerData, socialHeading: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Get connected with us on social networks:"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
              <input
                type="url"
                value={footerData.socialLinks.facebook || ''}
                onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://facebook.com/your-page"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter URL</label>
              <input
                type="url"
                value={footerData.socialLinks.twitter || ''}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/your-handle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
              <input
                type="url"
                value={footerData.socialLinks.linkedin || ''}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/company/your-company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
              <input
                type="url"
                value={footerData.socialLinks.instagram || ''}
                onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://instagram.com/your-handle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
              <input
                type="url"
                value={footerData.socialLinks.youtube || ''}
                onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://youtube.com/channel/your-channel"
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Company Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={footerData.companyName}
                onChange={(e) => setFooterData({ ...footerData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
              <textarea
                value={footerData.companyDescription}
                onChange={(e) => setFooterData({ ...footerData, companyDescription: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of your company..."
                required
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products Section
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
            <input
              type="text"
              value={footerData.productsSection.title}
              onChange={(e) => setFooterData({
                ...footerData,
                productsSection: { ...footerData.productsSection, title: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Products</label>
            {footerData.productsSection.items.map((product, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={product}
                  onChange={(e) => handleProductsChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product name"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                  disabled={footerData.productsSection.items.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addProduct}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Product
            </button>
          </div>
        </div>

        {/* Useful Links Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Useful Links Section
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
            <input
              type="text"
              value={footerData.usefulLinksSection.title}
              onChange={(e) => setFooterData({
                ...footerData,
                usefulLinksSection: { ...footerData.usefulLinksSection, title: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Links</label>
            {footerData.usefulLinksSection.items.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={link.name}
                  onChange={(e) => handleUsefulLinksChange(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Link name"
                  required
                />
                <input
                  type="text"
                  value={link.link}
                  onChange={(e) => handleUsefulLinksChange(index, 'link', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Link URL (e.g., /about)"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeUsefulLink(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                  disabled={footerData.usefulLinksSection.items.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addUsefulLink}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Link
            </button>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
              <input
                type="text"
                value={footerData.contactSection.title}
                onChange={(e) => setFooterData({
                  ...footerData,
                  contactSection: { ...footerData.contactSection, title: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={footerData.contactSection.address}
                onChange={(e) => setFooterData({
                  ...footerData,
                  contactSection: { ...footerData.contactSection, address: e.target.value }
                })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={footerData.contactSection.email}
                onChange={(e) => setFooterData({
                  ...footerData,
                  contactSection: { ...footerData.contactSection, email: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={footerData.contactSection.phone}
                onChange={(e) => setFooterData({
                  ...footerData,
                  contactSection: { ...footerData.contactSection, phone: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Footer Data'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 