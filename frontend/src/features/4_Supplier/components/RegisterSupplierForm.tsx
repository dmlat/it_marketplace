import React, { useState, useContext } from 'react';
import SupportSurvey from './SupportSurvey';
import { AuthContext } from '../../../app/App';
import '../../1_Auth/components/RegisterForm.css';

interface RegisterSupplierFormProps {
    onLoginSuccess: (token: string, user: { id: number; role: string }) => void;
}

interface Company {
    id: number;
    name: string;
    // ... другие поля
}

const RegisterSupplierForm: React.FC<RegisterSupplierFormProps> = ({ onLoginSuccess }) => {
    const [step, setStep] = useState(1);
    const [createdCompany, setCreatedCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        inn: '',
        agreed: false,
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.passwordConfirm) return setError('Пароли не совпадают');
        if (!formData.agreed) return setError('Необходимо принять условия');

        try {
            // 1. Регистрируем пользователя
            const userResponse = await fetch('http://localhost:8001/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password, role: 'supplier' }),
            });
            const userData = await userResponse.json();
            if (!userResponse.ok) throw new Error(userData.message || 'Ошибка регистрации пользователя');

            // 2. Создаем компанию, привязанную к пользователю
            const companyResponse = await fetch('http://localhost:8003/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: userData.user.id, 
                    // Простое имя, пользователь заполнит полное в ЛК
                    name: `Компания ${formData.inn}`, 
                    inn: formData.inn,
                    // Для компаний не из 52 региона, регион и ФИО пока не заполняем
                    full_name: formData.inn.startsWith('52') ? 'ООО "АСД СОФТ"' : null,
                    region: formData.inn.startsWith('52') ? 'Нижегородская область' : null,
                }),
            });
            const companyData = await companyResponse.json();
            if (!companyResponse.ok) {
                // Если создание компании не удалось, откатываем регистрацию пользователя
                await fetch(`http://localhost:8001/users/${userData.user.id}`, { method: 'DELETE' });
                throw new Error(companyData.message || 'Ошибка создания компании');
            }
            
            setCreatedCompany(companyData);
            
            // 3. Решаем, показывать ли опросник
            if (formData.inn.startsWith('52')) {
                setStep(2); // Переходим к опроснику для 52 региона
            } else {
                // Для остальных регионов - автоматический логин
                try {
                    const loginResponse = await fetch('http://localhost:8001/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: formData.email, password: formData.password }),
                    });
                    const loginData = await loginResponse.json();
                    if (!loginResponse.ok) throw new Error(loginData.message || 'Ошибка автоматического входа');

                    // Используем AuthContext для логина, но вызываем onLoginSuccess из пропсов
                    // для корректного закрытия модалки и редиректа
                    onLoginSuccess(loginData.token, loginData.user);

                } catch (loginErr: any) {
                    setError(`Регистрация прошла, но не удалось автоматически войти: ${loginErr.message}`);
                }
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (step === 2 && createdCompany) {
        return <SupportSurvey 
            company={createdCompany} 
            email={formData.email} 
            password={formData.password}
            onLoginSuccess={onLoginSuccess}
        />;
    }

    return (
        <div className="register-form-container">
            <h3>Регистрация Поставщика</h3>
            <form onSubmit={handleSubmit} className="form-container">
                <input name="email" type="email" placeholder="E-mail" value={formData.email} onChange={handleChange} required />
                <input name="password" type="password" placeholder="Придумайте пароль" value={formData.password} onChange={handleChange} required />
                <input name="passwordConfirm" type="password" placeholder="Повторите пароль" value={formData.passwordConfirm} onChange={handleChange} required />
                <input name="inn" type="text" placeholder="ИНН" value={formData.inn} onChange={handleChange} required />
                <div className="checkbox-container">
                    <input name="agreed" type="checkbox" id="agree-checkbox-supplier" checked={formData.agreed} onChange={handleChange} />
                    <label htmlFor="agree-checkbox-supplier">Я согласен на обработку персональных данных и с политикой конфиденциальности.</label>
                </div>
                <button type="submit">Зарегистрироваться</button>
            </form>
            {error && (
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <div className="support-contacts">
                        <p>Если у вас возникли проблемы, свяжитесь с нами:</p>
                        <span>E-mail: support@marketplace.mock</span>
                        <span>Телефон: +7 (999) 123-45-67</span>
                        <span>Telegram: @MarketplaceSupportMock</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterSupplierForm;
