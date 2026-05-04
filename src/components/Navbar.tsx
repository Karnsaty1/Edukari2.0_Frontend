import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../modules/auth';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthed, user, profile, api } = useAuth();
  const navItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Courses', to: '/courses' },
    { label: 'Classroom', to: '/classroom' },
    { label: 'Library', to: '/library' },
    { label: 'Resources', to: '/resources' },
  ];

  return (
    <header className="sticky top-0 z-[9999] w-full border-b border-white/10 bg-blue-500 shadow-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link to="/" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Edu<span className="text-yellow-300">kari</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-white' : 'text-white/90 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <button className="relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg text-white/90 hover:bg-white/10 transition-colors">
            <NotificationsIcon fontSize="small" />
            <div className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></div>
          </button>

          {!isAuthed ? (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-yellow-300 transition-colors"
            >
              Login
            </Link>
          ) : null}

          {/* Profile Dropdown */}
          <div className="group relative hidden sm:block">
            <button className="flex items-center hover:opacity-80 transition-opacity">
              <div
                className="h-9 w-9 rounded-full bg-cover bg-center ring-2 ring-white/20 hover:ring-white/40 transition-all"
                style={{
                  backgroundImage:
                    isAuthed && profile?.avatarUrl
                      ? `url("${profile.avatarUrl}")`
                      : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDGUJYGQLSfB2p6rQHWwfKsRWnviZXIWwfaND8beqZb96-zS4lueYI2EXiScFVc1J7wVMPOJ-GnbCSTVHUC1Z08Ce2iHW5-1Zh97IY3DbJ1HBuFLG8WWh1xBLTjLLp0zc3oTZrC8X4JkHkDExn8uVVOHzzANYSPPlalu9FbHyER4Okf54UT2C2jaYWjwuWgHe16lU7QYYsVZdAmHKCeH12nRVvzzDrrDlnZnizOH3QNM2qPou2owcHGceZ2pgjOyis9gQOarCm01Zs")',
                }}
              ></div>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white border border-blue-100 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {!isAuthed ? (
                <Link to="/login" className="block px-4 py-2.5 text-sm text-blue-900 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors">
                  Login
                </Link>
              ) : (
                <>
                  <a className="block px-4 py-2.5 text-sm text-blue-900 hover:bg-blue-50 cursor-pointer rounded-t-lg transition-colors">Profile</a>
                  <div className="px-4 py-2.5 border-b border-blue-50">
                    <div className="text-sm font-semibold text-blue-900">{profile?.firstname || 'User'} {profile?.lastname || ''}</div>
                    <div className="text-xs text-blue-700">{profile?.email || user?.email || ''}</div>
                  </div>
                  <a className="block px-4 py-2.5 text-sm text-blue-900 hover:bg-blue-50 cursor-pointer transition-colors">My Learning</a>
                  <a className="block px-4 py-2.5 text-sm text-blue-900 hover:bg-blue-50 cursor-pointer transition-colors">Account Settings</a>
                  <button
                    type="button"
                    onClick={api.logout}
                    className="w-full text-left block px-4 py-2.5 text-sm text-blue-900 hover:bg-blue-50 cursor-pointer rounded-b-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-blue-600">
          <nav className="flex flex-col px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/90 hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="sm:hidden border-t border-white/10 pt-3 mt-2">
              {!isAuthed ? (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer block"
                >
                  Login
                </Link>
              ) : (
                <>
                  <div className="px-4 py-3 text-white/90 border-b border-white/10">
                    <div className="text-sm font-semibold">{profile?.firstname || 'User'} {profile?.lastname || ''}</div>
                    <div className="text-xs text-white/70">{profile?.email || user?.email || ''}</div>
                  </div>
                  <a className="px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer block">Profile</a>
                  <a className="px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer block">My Learning</a>
                  <a className="px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer block">Account Settings</a>
                  <button
                    type="button"
                    onClick={() => {
                      api.logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer block"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
