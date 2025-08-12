import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Modal from '../shared/ui/Modal';
import Auth from '../features/1_Auth/components/Auth';
import HomePage from '../features/2_Marketplace/pages/HomePage';
import OperatorPage from '../features/5_Operator/pages/OperatorPage';
import ProfilePage from '../features/4_Supplier/pages/ProfilePage';
import ProductsPage from '../features/2_Marketplace/pages/ProductsPage';
import CompaniesPage from '../features/2_Marketplace/pages/CompaniesPage';
import EquipmentPage from '../features/2_Marketplace/pages/EquipmentPage';
import OutstaffPage from '../features/2_Marketplace/pages/OutstaffPage';
import Header from '../shared/ui/Header';
import './App.css';

// 1. Создаем контекст для аутентификации
export const AuthContext = React.createContext<{
  token: string | null;
  user: { id: number; role: string } | null;
  login: (token: string, user: { id: number; role: string }) => void;
  logout: () => void;
} | null>(null);


// 2. Компонент-обертка для навигации
const AppContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const auth = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSuccess = (token: string, user: { id: number; role: string }) => {
    auth?.login(token, user);
    setIsModalOpen(false);
    if (user.role === 'operator') {
      navigate('/operator');
    } else {
      navigate('/profile');
    }
  };
  
  const handleLogout = () => {
    auth?.logout();
    navigate('/');
  };


  return (
    <div className="app-container">
      <Header onLoginClick={() => setIsModalOpen(true)} onLogout={handleLogout} />
      
      <main className="app-main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Страницы login/register теперь являются частью модального окна */}
          <Route path="/operator" element={<OperatorPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/outstaff" element={<OutstaffPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Auth onLoginSuccess={handleLoginSuccess} />
      </Modal>
    </div>
  )
}


function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);

  useEffect(() => {
    // 3. При загрузке приложения проверяем наличие токена
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (newToken: string, newUser: { id: number; role: string }) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
