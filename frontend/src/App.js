import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { Footer } from './components';
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import { MyRecipes, Pantry, Search, AdminPanel } from './pages/index';
import { Login, Register } from './pages/Auth';
import './index.css';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.is_staff ? children : <Navigate to="/" replace />;
}
function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes/new" element={<PrivateRoute><CreateRecipe /></PrivateRoute>} />
        <Route path="/recipes/:id/edit" element={<PrivateRoute><CreateRecipe /></PrivateRoute>} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/my-recipes" element={<PrivateRoute><MyRecipes /></PrivateRoute>} />
        <Route path="/pantry" element={<PrivateRoute><Pantry /></PrivateRoute>} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-panel" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
