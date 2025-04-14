import React, { useState } from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  Users,
  Building2,
  Shield,
  FileText,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Bell
} from 'lucide-react';

const MENU_ITEMS = [
  { 
    path: '/users', 
    icon: Users, 
    label: 'Users',
    permissions: ['users_read']
  },
  { 
    path: '/companies', 
    icon: Building2, 
    label: 'Companies',
    permissions: ['companies_read']
  },
  { 
    path: '/roles', 
    icon: Shield, 
    label: 'Roles',
    permissions: ['roles_read']
  },
  { 
    path: '/content', 
    icon: FileText, 
    label: 'Content',
    permissions: ['content_read']
  }
];

function SidebarLink({ 
  path, 
  icon: Icon, 
  label, 
  permissions,
  collapsed 
}: { 
  path: string; 
  icon: any; 
  label: string; 
  permissions: string[];
  collapsed: boolean;
}) {
  const location = useLocation();
  const { hasAnyPermission } = usePermissions();
  const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  if (!hasAnyPermission(permissions)) {
    return null;
  }

  return (
    <Link
      to={path}
      className={`
        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
        ${collapsed ? "justify-center" : "justify-start"}
        ${isActive 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }
      `}
    >
      <Icon className={`h-5 w-5 ${!collapsed && "mr-3"} ${isActive ? "text-indigo-600" : ""}`} />
      <span className={`transition-all duration-200 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
        {label}
      </span>
    </Link>
  );
}

export default function Layout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isMenuCollapsed ? "w-16" : "w-64"}
          md:relative md:translate-x-0
        `}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <h1 className={`font-semibold text-xl text-gray-800 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isMenuCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}>
              TeamApp2
            </h1>
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
            >
              {isMenuCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto pt-5 pb-4">
            <div className="px-2 space-y-1">
              {MENU_ITEMS.map((item) => (
                <SidebarLink 
                  key={item.path} 
                  {...item} 
                  collapsed={isMenuCollapsed}
                />
              ))}
            </div>
          </nav>

          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className={`flex items-center ${isMenuCollapsed ? "justify-center" : "justify-start"}`}>
              <img
                className="h-8 w-8 rounded-full bg-gray-300"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || '')}&background=random`}
                alt={user?.email || ''}
              />
              <div className={`ml-3 transition-all duration-200 ${isMenuCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm z-10">
          <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  type="button"
                  className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-6 w-6" />
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="p-4">
                      <p className="text-sm text-gray-500">No new notifications</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}