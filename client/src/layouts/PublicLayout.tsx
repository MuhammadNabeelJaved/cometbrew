/**
 * Public Layout
 * Wraps all public facing pages
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Chatbot } from '../components/Chatbot';
import { ScrollToTop } from '../components/ScrollToTop';

export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />

      <Chatbot />
      <ScrollToTop />
    </div>
  );
}