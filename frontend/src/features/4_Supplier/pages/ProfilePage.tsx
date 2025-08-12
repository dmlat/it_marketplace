import React from 'react';
import './ProfilePage.css';
import CompanyProfileForm from '../components/CompanyProfileForm';

const ProfilePage = () => {
    // В будущем здесь будет состояние для переключения вкладок
    const activeTab = 'my-company';

    return (
        <div className="profile-page-container">
            <h1>Личный кабинет</h1>
            <div className="profile-content">
                <aside className="profile-sidebar">
                    <nav>
                        <ul>
                            <li className={activeTab === 'my-company' ? 'active' : ''}>Моя компания</li>
                            {/* Остальные вкладки пока неактивны */}
                            <li>Мои продукты</li>
                            <li>Заказы</li>
                            <li>Портфолио</li>
                            <li>Избранное</li>
                            <li>Взаимодействие с ЦА</li>
                        </ul>
                    </nav>
                </aside>
                <main className="profile-main-content">
                    {activeTab === 'my-company' && (
                        <CompanyProfileForm />
                    )}
                    {/* Здесь будет рендеринг других компонентов вкладок */}
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;
