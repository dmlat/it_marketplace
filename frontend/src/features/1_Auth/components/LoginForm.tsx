import React, { useState } from 'react';
import './RegisterForm.css'; // Используем те же стили для консистентности

interface LoginFormProps {
  onLoginSuccess: (token: string, user: { id: number; role: string }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ошибка входа');
            }
            
            // Вызываем колбэк при успешном входе
            onLoginSuccess(data.token, data.user);

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="register-form-container">
            <h3>Найдите it-продукт, подрядчика или заказчиков.</h3>
            <form onSubmit={handleSubmit} className="form-container">
                <input 
                    type="text" // Изменяем тип с 'email' на 'text'
                    placeholder="E-mail или логин" // Обновляем плейсхолдер для ясности
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Пароль" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <a href="/forgot-password" className="forgot-password-link">Забыли пароль?</a>
                <button type="submit">Войти</button>
            </form>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default LoginForm;
