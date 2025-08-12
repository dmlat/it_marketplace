import React, { useState } from 'react';

interface RegisterCustomerFormProps {
    onRegisterSuccess: () => void;
}

const RegisterCustomerForm: React.FC<RegisterCustomerFormProps> = ({ onRegisterSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            return setError('Пароли не совпадают');
        }
        if (!agreed) {
            return setError('Необходимо принять условия');
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8001/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'customer' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка регистрации');
            }
            
            // Здесь можно сразу авторизовать пользователя или показать сообщение
            onRegisterSuccess();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="register-form">
            <input
                type="email"
                placeholder="Email"
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
            <input
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            <div className="form-agreement">
                <input 
                    type="checkbox" 
                    id="customer-agree" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)}
                />
                <label htmlFor="customer-agree">
                    Я согласен на обработку персональных данных и подтверждаю согласие с политикой конфиденциальности.
                </label>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" disabled={loading}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
        </form>
    );
};

export default RegisterCustomerForm;
