import React, { useState } from 'react';
import AuthChoice from './AuthChoice';
import RegisterCustomerForm from '../../3_Customer/components/RegisterCustomerForm';
import RegisterSupplierForm from '../../4_Supplier/components/RegisterSupplierForm';
import LoginForm from './LoginForm';
import './Auth.css';

interface AuthProps {
  onLoginSuccess: (token: string, user: { id: number; role: string }) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [registerView, setRegisterView] = useState<'choice' | 'customer' | 'supplier'>('choice');

    const handleRoleSelect = (role: 'customer' | 'supplier') => {
        if (role === 'customer') {
            setRegisterView('customer');
        } else {
            setRegisterView('supplier');
        }
    };
    
    const handleRegisterSuccess = () => {
        setRegisterView('choice'); // Сбрасываем к выбору роли после успешной регистрации
    };

    const renderRegisterContent = () => {
        switch (registerView) {
            case 'choice':
                return <AuthChoice onRoleSelect={handleRoleSelect} />;
            case 'customer':
                // Для Заказчика пока оставляем старую логику, так как у него нет авто-входа
                return <RegisterCustomerForm onRegisterSuccess={handleRegisterSuccess} />;
            case 'supplier':
                // Передаем onLoginSuccess в форму регистрации поставщика
                return <RegisterSupplierForm onLoginSuccess={onLoginSuccess} />;
            default:
                return <AuthChoice onRoleSelect={handleRoleSelect} />;
        }
    }

    return (
        <div>
            <div className="auth-tabs">
                <button 
                    className={`tab-button ${authMode === 'login' ? 'active' : ''}`} 
                    onClick={() => setAuthMode('login')}
                >
                    Вход
                </button>
                <button 
                    className={`tab-button ${authMode === 'register' ? 'active' : ''}`}
                    onClick={() => {
                        setAuthMode('register');
                        setRegisterView('choice'); // Сбрасываем к выбору роли при переключении на регистрацию
                    }}
                >
                    Регистрация
                </button>
            </div>
            <div className="auth-content">
                {authMode === 'login' ? <LoginForm onLoginSuccess={onLoginSuccess} /> : renderRegisterContent()}
            </div>
        </div>
    );
};

export default Auth;
