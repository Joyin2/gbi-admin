'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import Link from 'next/link';

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
}

export default function Footer() {
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const q = query(collection(db, 'footerData'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        setFooterData({
          id: doc.id,
          ...data as FooterData
        });
      }
    } catch (error) {
      console.error('Error fetching footer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  if (!footerData) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-400">Footer data not available</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Social Networks Header */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold mb-6">{footerData.socialHeading}</h2>
          <div className="flex justify-center space-x-6">
            {footerData.socialLinks.facebook && (
              <a
                href={footerData.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
            {footerData.socialLinks.twitter && (
              <a
                href={footerData.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            )}
            {footerData.socialLinks.linkedin && (
              <a
                href={footerData.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">LinkedIn</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            )}
            {footerData.socialLinks.instagram && (
              <a
                href={footerData.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-2.508 0-4.541-2.033-4.541-4.54s2.033-4.541 4.541-4.541c2.508 0 4.54 2.034 4.54 4.541s-2.032 4.54-4.54 4.54zm7.119 0c-2.508 0-4.54-2.033-4.54-4.54s2.032-4.541 4.54-4.541c2.508 0 4.541 2.034 4.541 4.541s-2.033 4.54-4.541 4.54z"/>
                </svg>
              </a>
            )}
            {footerData.socialLinks.youtube && (
              <a
                href={footerData.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">YouTube</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Information */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">{footerData.companyName}</h3>
            <p className="text-gray-400 mb-4 leading-relaxed">
              {footerData.companyDescription}
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{footerData.productsSection.title}</h4>
            <ul className="space-y-2">
              {footerData.productsSection.items.map((product, index) => (
                <li key={index}>
                  <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                    {product}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{footerData.usefulLinksSection.title}</h4>
            <ul className="space-y-2">
              {footerData.usefulLinksSection.items.map((linkItem, index) => (
                <li key={index}>
                  <Link
                    href={linkItem.link}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {linkItem.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-800 pt-8">
          <h4 className="text-lg font-semibold mb-4">{footerData.contactSection.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-400">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{footerData.contactSection.address}</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a
                href={`mailto:${footerData.contactSection.email}`}
                className="hover:text-white transition-colors"
              >
                {footerData.contactSection.email}
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a
                href={`tel:${footerData.contactSection.phone}`}
                className="hover:text-white transition-colors"
              >
                {footerData.contactSection.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {footerData.companyName}. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 