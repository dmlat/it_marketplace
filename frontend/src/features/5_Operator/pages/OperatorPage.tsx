import React, { useState } from 'react';
import './OperatorPage.css';
import TabRegistry from '../components/TabRegistry';
import TabCases from '../components/TabCases';
import TabSupport from '../components/TabSupport';
import TabLegal from '../components/TabLegal';
import ConfirmSupportModal from '../components/ConfirmSupportModal';

// Определяем типы для вкладок
type OperatorTab = 'registry' | 'cases' | 'support' | 'legal';

const OperatorPage = () => {
    const [activeTab, setActiveTab] = useState<OperatorTab>('registry');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSuccess = () => {
        setIsModalOpen(false); // Закрываем модалку
        setRefreshTrigger(prev => prev + 1); // "Дергаем" триггер
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'registry':
                return <TabRegistry />;
            case 'cases':
                return <TabCases />;
            case 'support':
                return <TabSupport onConfirmClick={() => setIsModalOpen(true)} refreshTrigger={refreshTrigger} />;
            case 'legal':
                return <TabLegal />;
            default:
                return null;
        }
    };

    return (
        <div className="operator-page-container">
            <h1>Панель Оператора</h1>
            <div className="operator-content">
                <aside className="operator-sidebar">
                    <nav>
                        <ul>
                            <li 
                                className={activeTab === 'registry' ? 'active' : ''}
                                onClick={() => setActiveTab('registry')}
                            >
                                Реестр Компаний
                            </li>
                            <li 
                                className={activeTab === 'cases' ? 'active' : ''}
                                onClick={() => setActiveTab('cases')}
                            >
                                Управление кейсами
                            </li>
                            <li 
                                className={activeTab === 'support' ? 'active' : ''}
                                onClick={() => setActiveTab('support')}
                            >
                                Меры поддержки
                            </li>
                            <li 
                                className={activeTab === 'legal' ? 'active' : ''}
                                onClick={() => setActiveTab('legal')}
                            >
                                Нормативная база
                            </li>
                        </ul>
                    </nav>
                </aside>
                <main className="operator-main-content">
                    {renderContent()}
                </main>
            </div>
            <ConfirmSupportModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default OperatorPage;
