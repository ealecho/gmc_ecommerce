import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import AuthPage from './pages/AuthPage';
import Orders from './pages/Orders';
import AdminProducts from './pages/AdminProducts';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sign-in" element={<AuthPage />} />
            <Route path="/sign-up" element={<AuthPage />} />
            <Route path="/forgot-password" element={<AuthPage />} />
            <Route path="/auth/sign-in" element={<AuthPage />} />
            <Route path="/auth/sign-up" element={<AuthPage />} />
            <Route path="/auth/forgot-password" element={<AuthPage />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
