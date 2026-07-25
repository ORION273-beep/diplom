import { type ReactNode, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { CartProvider } from '@/lib/CartContext';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Footer } from '@/components/layout/Footer';
import AdminLayout from '@/pages/admin/AdminLayout';
import HomePage from '@/pages/HomePage';
import CatalogPage from '@/pages/CatalogPage';
import CurrencyPage from '@/pages/CurrencyPage';
import SubscriptionsPage from '@/pages/SubscriptionsPage';
import GamesPage from '@/pages/GamesPage';
import GameSlugPage from '@/pages/GameSlugPage';
import ProductPage from '@/pages/ProductPage';
import CartPage from '@/pages/CartPage';
import FavoritesPage from '@/pages/FavoritesPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CheckoutPage from '@/pages/CheckoutPage';
import CheckoutSuccessPage from '@/pages/CheckoutSuccessPage';
import ProfilePage from '@/pages/ProfilePage';
import ProfileOrdersPage from '@/pages/ProfileOrdersPage';
import ProfileOrderDetailPage from '@/pages/ProfileOrderDetailPage';
import FaqPage from '@/pages/FaqPage';
import ReviewsPage from '@/pages/ReviewsPage';
import PromotionsPage from '@/pages/PromotionsPage';
import ContactsPage from '@/pages/ContactsPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import RulesPage from '@/pages/RulesPage';
import RefundPolicyPage from '@/pages/RefundPolicyPage';
import UserAgreementPage from '@/pages/UserAgreementPage';
import AdminHomePage from '@/pages/admin/AdminHomePage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
import AdminGamesPage from '@/pages/admin/AdminGamesPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminReviewsPage from '@/pages/admin/AdminReviewsPage';
import AdminFaqPage from '@/pages/admin/AdminFaqPage';

function CatalogCategoryRedirect() {
  const { category } = useParams();
  return <Navigate to={`/catalog?category=${category || ''}`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <SiteHeader />}
      <main className="app-bg min-h-screen">{children}</main>
      {!isAdmin && <Footer />}
    </>
  );
}

function AppRoutes() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/currency" element={<CurrencyPage />} />
        <Route path="/catalog/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/catalog/:category" element={<CatalogCategoryRedirect />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:slug" element={<GameSlugPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/orders" element={<ProfileOrdersPage />} />
        <Route path="/profile/orders/:id" element={<ProfileOrderDetailPage />} />
        <Route path="/orders" element={<Navigate to="/profile/orders" replace />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/user-agreement" element={<UserAgreementPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="games" element={<AdminGamesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="faq" element={<AdminFaqPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}
