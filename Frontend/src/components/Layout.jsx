import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, LogOut, UserCircle, Globe } from 'lucide-react';
import AssistantWidget from './AssistantWidget';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'gu' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    
    // Set Google Translate Cookie
    const transVal = newLang === 'gu' ? '/en/gu' : '/en/en';
    document.cookie = `googtrans=${transVal}; path=/`;
    document.cookie = `googtrans=${transVal}; path=/; domain=${window.location.hostname}`;
    
    // Reload to apply Google Translate to DOM
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Government Aesthetic Top Strip */}
      <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-white to-green-500"></div>
      
      {/* Navbar */}
      <nav className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo / Brand */}
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-8 w-8 text-orange-400" />
              <div>
                <h1 className="text-xl font-bold tracking-wide">Kutumbsetu</h1>
                <p className="text-xs text-blue-200">Government of Gujarat</p>
              </div>
            </div>

            {/* Navigation / User Actions */}
            <div className="flex items-center space-x-6">
              
              <button 
                onClick={toggleLanguage} 
                className="flex items-center space-x-1 text-sm bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded transition border border-blue-700"
              >
                <Globe className="h-4 w-4" />
                <span className="font-bold">{lang === 'en' ? 'English' : 'ગુજરાતી'}</span>
              </button>

              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-4 mr-4">
                    {user.role === 'CITIZEN' && (
                      <>
                        <Link to="/citizen/dashboard" className="text-gray-300 hover:text-white text-sm font-medium">My Family</Link>
                        <Link to="/citizen/documents" className="text-gray-300 hover:text-white text-sm font-medium">My Documents</Link>
                        <Link to="/citizen/benefits" className="text-gray-300 hover:text-white text-sm font-medium">Explore Benefits</Link>
                        <Link to="/citizen/requests" className="text-gray-300 hover:text-white text-sm font-medium">My Applications</Link>
                      </>
                    )}
                    {user.role === 'OFFICER' && (
                      <>
                        <Link to="/officer/dashboard" className="text-gray-300 hover:text-white text-sm font-medium">Families</Link>
                        <Link to="/officer/requests" className="text-gray-300 hover:text-white text-sm font-medium">Applications</Link>
                      </>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link to="/admin/dashboard" className="text-gray-300 hover:text-white text-sm font-medium">Admin Portal</Link>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-sm border-l border-blue-700 pl-4">
                    <UserCircle className="h-5 w-5 text-gray-300" />
                    <span className="font-medium text-white">
                      {user.name} ({user.role === 'ADMIN' ? 'Admin' : (user.role === 'OFFICER' ? 'Officer' : 'Citizen')})
                    </span>
                  </div>
                  <button 
                    onClick={logout}
                    className="flex items-center space-x-1 bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="hover:text-gray-200 font-medium">Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      {/* Government Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          <p>© 2026 Government of Gujarat. All rights reserved.</p>
          <p className="mt-1">Designed for the Pravi Hackathon.</p>
        </div>
      </footer>

      {/* Global AI Assistant Widget (Only visible if logged in) */}
      {user && <AssistantWidget />}
    </div>
  );
};

export default Layout;
