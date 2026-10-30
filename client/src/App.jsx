import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import PromotionBanner from './components/PromotionBanner.jsx';
import CookieConsentBanner from './components/CookieConsentBanner.jsx';
import FestiveOfferBadge from './components/FestiveOfferBadge.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CustomerProtectedRoute from './components/CustomerProtectedRoute.jsx';

// Customer Pages
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import CategoryLanding from './pages/CategoryLanding.jsx';
import CartPage from './pages/CartPage.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import TrackOrder from './pages/TrackOrder.jsx';
import AboutCraft from './pages/AboutCraft.jsx';
import Contact from './pages/Contact.jsx';
import Offers from './pages/Offers.jsx';
import ShippingPolicy from './pages/policies/ShippingPolicy.jsx';
import ReturnPolicy from './pages/policies/ReturnPolicy.jsx';
import PrivacyPolicy from './pages/policies/PrivacyPolicy.jsx';
import TermsOfService from './pages/policies/TermsOfService.jsx';

// Customer Account Pages
import CustomerLogin from './pages/customer/CustomerLogin.jsx';
import CustomerAccount from './pages/customer/CustomerAccount.jsx';
import CustomerOrders from './pages/customer/CustomerOrders.jsx';
import CustomerAddresses from './pages/customer/CustomerAddresses.jsx';
import Wishlist from './pages/customer/Wishlist.jsx';

// Admin Pages - Code split via React.lazy for production bundle optimization
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts.jsx'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminOrderDetail = React.lazy(() => import('./pages/admin/AdminOrderDetail.jsx'));
const AdminInventory = React.lazy(() => import('./pages/admin/AdminInventory.jsx'));
const AdminCoupons = React.lazy(() => import('./pages/admin/AdminCoupons.jsx'));
const AdminPromotions = React.lazy(() => import('./pages/admin/AdminPromotions.jsx'));
const AdminAbandonedCarts = React.lazy(() => import('./pages/admin/AdminAbandonedCarts.jsx'));
const AdminDeliveryView = React.lazy(() => import('./pages/admin/AdminDeliveryView.jsx'));

// Customer Layout Wrapper
function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 font-sans text-burgundy-950">
      <PromotionBanner />
      <Navbar />
      <CartDrawer />
      <CookieConsentBanner />
      <FestiveOfferBadge />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// 404 Not Found Page
function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <span className="font-serif text-6xl font-extrabold text-gold-500">404</span>
      <h2 className="font-serif text-2xl font-bold text-burgundy-900">
        Page Lost in The Aroma
      </h2>
      <p className="text-xs text-burgundy-800/70 max-w-sm">
        The sanctum page you are searching for does not exist or has been shifted.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-950 transition-colors shadow-sm"
      >
        Return to Store Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Storefront Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path="/category/:slug" element={<CategoryLanding />} />
              <Route path="/collections/:slug" element={<CategoryLanding />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/festive-sale" element={<Offers />} />
              <Route path="/diwali-offer" element={<Offers />} />
              <Route path="/about" element={<AboutCraft />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Policies */}
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="/policies/shipping" element={<ShippingPolicy />} />
              <Route path="/return-policy" element={<ReturnPolicy />} />
              <Route path="/policies/returns" element={<ReturnPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/policies/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/policies/terms" element={<TermsOfService />} />
              
              {/* Customer Account Routes */}
              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/account/login" element={<CustomerLogin />} />
              <Route
                path="/account"
                element={
                  <CustomerProtectedRoute>
                    <CustomerAccount />
                  </CustomerProtectedRoute>
                }
              />
              <Route
                path="/account/orders"
                element={
                  <CustomerProtectedRoute>
                    <CustomerOrders />
                  </CustomerProtectedRoute>
                }
              />
              <Route
                path="/account/addresses"
                element={
                  <CustomerProtectedRoute>
                    <CustomerAddresses />
                  </CustomerProtectedRoute>
                }
              />
              <Route
                path="/account/wishlist"
                element={
                  <CustomerProtectedRoute>
                    <Wishlist />
                  </CustomerProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <CustomerProtectedRoute>
                    <Wishlist />
                  </CustomerProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin Login Route */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Console Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <React.Suspense
                    fallback={
                      <div className="min-h-screen bg-burgundy-950 flex flex-col items-center justify-center space-y-3">
                        <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                        <span className="font-serif text-gold-300 text-xs tracking-widest uppercase">Loading Admin Console...</span>
                      </div>
                    }
                  >
                    <AdminLayout />
                  </React.Suspense>
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="delivery" element={<AdminDeliveryView />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="promotions" element={<AdminPromotions />} />
              <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
