import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Flame,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  TrendingUp,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Tag,
  Megaphone,
  Truck,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isRider = admin?.role === 'DELIVERY';

  const navLinks = isRider
    ? [
        { to: '/admin/delivery', label: 'My Deliveries', icon: Truck },
        { to: '/admin/orders', label: 'All Orders', icon: ShoppingBag }
      ]
    : [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
        { to: '/admin/delivery', label: 'Delivery Management', icon: Truck },
        { to: '/admin/products', label: 'Product Catalog', icon: Package },
        { to: '/admin/inventory', label: 'Inventory & Logs', icon: Boxes },
        { to: '/admin/coupons', label: 'Coupons & Promos', icon: Tag },
        { to: '/admin/promotions', label: 'Campaigns & Banners', icon: Megaphone },
        { to: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: RotateCcw }
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-burgundy-950 text-cream-50 flex flex-col justify-between border-r border-gold-500/20 shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-gold-500/20 flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-burgundy-900 border border-gold-500/50 flex items-center justify-center">
                <Flame className="w-5 h-5 text-gold-400 animate-flame" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-wider text-cream-50">
                  Di<span className="text-gold-500 font-cinzel">Glow</span>
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-gold-400 font-semibold -mt-1">
                  Executive Suite
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs font-semibold">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-burgundy-950 font-bold shadow-sm'
                      : 'text-cream-200/80 hover:bg-burgundy-900 hover:text-gold-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar / Admin User & Logout */}
        <div className="p-4 border-t border-gold-500/20 space-y-3">
          <div className="p-3 bg-burgundy-900/60 rounded-xl border border-gold-500/20 text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-gold-400" />
              <span className="font-bold text-cream-100 truncate">{admin?.name || 'Administrator'}</span>
            </div>
            <span className="text-[10px] text-cream-200/60 block mt-0.5 truncate">
              {admin?.email}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Link
              to="/"
              target="_blank"
              className="text-[11px] text-gold-300 hover:text-gold-400 flex items-center space-x-1"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] text-red-300 hover:text-red-200 flex items-center space-x-1 font-semibold"
            >
              <LogOut className="w-3 h-3" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
