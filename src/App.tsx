/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { BookOpen, MessageSquare, Upload } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import BookDetail from "./pages/BookDetail";
import QAInterface from "./pages/QAInterface";
import UploadBook from "./pages/UploadBook";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/"
                className="flex items-center gap-2 font-semibold text-xl text-indigo-600"
              >
                <BookOpen className="w-6 h-6" />
                DocuIntel
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-indigo-500 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  to="/qa"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-indigo-500 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Q&A
                </Link>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-indigo-500 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Upload
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/qa" element={<QAInterface />} />
          <Route path="/upload" element={<UploadBook />} />
        </Routes>
      </Layout>
    </Router>
  );
}
