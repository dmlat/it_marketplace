import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../app/App';
import './CompanyProfileForm.css';

const CompanyProfileForm = () => {
    const [companyData, setCompanyData] = useState({
        // Данные компании
        name: '',
        full_name: '',
        foundation_year: '',
        region: '',
        description: '',
        notify_on_new_orders: false,
        website_url: '',
        it_associations: [],
        logo_url: '',
        // Контактные данные
        contact_full_name: '',
        contact_position: '',
        contact_phone: '',
        contact_email: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const auth = useContext(AuthContext);

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!auth?.token) {
                setError('Вы не авторизованы');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:8003/api/companies/me', {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                });

                if (!response.ok) {
                    throw new Error('Не удалось загрузить данные компании');
                }
                const data = await response.json();
                setCompanyData({
                    name: data.name || '',
                    full_name: data.full_name || '',
                    foundation_year: data.foundation_year || '',
                    region: data.region || '',
                    description: data.description || '',
                    notify_on_new_orders: data.notify_on_new_orders || false,
                    website_url: data.website_url || '',
                    it_associations: data.it_associations || [],
                    logo_url: data.logo_url || '',
                    contact_full_name: data.contact_full_name || '',
                    contact_position: data.contact_position || '',
                    contact_phone: data.contact_phone || '',
                    contact_email: data.contact_email || '',
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [auth?.token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setCompanyData(prev => ({ ...prev, [name]: checked }));
        } else {
            setCompanyData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!auth?.token) return setError('Вы не авторизованы');

        try {
            const response = await fetch('http://localhost:8003/api/companies/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify(companyData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при сохранении данных');
            }
            alert('Данные успешно сохранены!');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <form onSubmit={handleSubmit} className="company-profile-form">
            <h2>Данные компании</h2>
            <div className="form-grid">
                <input name="name" value={companyData.name} onChange={handleChange} placeholder="Фирменное название" />
                <input name="full_name" value={companyData.full_name} onChange={handleChange} placeholder="Полное наименование" />
                <input name="foundation_year" value={companyData.foundation_year} onChange={handleChange} placeholder="Год основания" />
                <input name="region" value={companyData.region} onChange={handleChange} placeholder="Регион" />
                <input name="website_url" value={companyData.website_url} onChange={handleChange} placeholder="Сайт (https://...)" />
                <input name="logo_url" value={companyData.logo_url} onChange={handleChange} placeholder="URL логотипа" />
                <textarea name="description" value={companyData.description} onChange={handleChange} placeholder="Описание компании" />
                 <div>
                    <input
                        type="checkbox"
                        id="notify"
                        name="notify_on_new_orders"
                        checked={companyData.notify_on_new_orders}
                        onChange={handleChange}
                    />
                    <label htmlFor="notify">Получать уведомление о новых заказах</label>
                </div>
            </div>
            
            <h2>Контактные данные</h2>
             <div className="form-grid">
                <input name="contact_full_name" value={companyData.contact_full_name} onChange={handleChange} placeholder="ФИО сотрудника" />
                <input name="contact_position" value={companyData.contact_position} onChange={handleChange} placeholder="Должность" />
                <input name="contact_phone" value={companyData.contact_phone} onChange={handleChange} placeholder="Телефон" />
                <input name="contact_email" value={companyData.contact_email} onChange={handleChange} placeholder="E-mail" />
            </div>

            <button type="submit">Сохранить изменения</button>
        </form>
    );
};

export default CompanyProfileForm;
