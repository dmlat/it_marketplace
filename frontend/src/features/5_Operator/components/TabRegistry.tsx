import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../app/App';
import './OperatorTabs.css';

interface RegistryStats {
    totalCompanies: number;
    nnCompanies: number;
    newTotalCompanies: number;
    newNnCompanies: number;
}

const TabRegistry = () => {
    const [stats, setStats] = useState<RegistryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const auth = useContext(AuthContext);

    useEffect(() => {
        const fetchStats = async () => {
            if (!auth?.token) {
                setLoading(false);
                setError('Требуется авторизация');
                return;
            }
            try {
                const response = await fetch('http://localhost:8002/api/operator/registry-stats', {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                });

                if (response.status === 403) {
                    auth.logout();
                    throw new Error('Доступ запрещен. Пожалуйста, войдите в систему заново.');
                }

                if (!response.ok) {
                    throw new Error('Не удалось загрузить статистику по реестру');
                }
                const data = await response.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [auth]);

    return (
        <div>
            <div className="search-bar">
                <input type="text" placeholder="Поиск по ИНН..." />
                <button>Найти</button>
            </div>

            <div className="dashboard-grid">
                <div className="widget">
                    <h3>Общая сводка</h3>
                    {loading && <p>Загрузка...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {stats && (
                        <>
                            <p><strong>Всего компаний на портале:</strong> {stats.totalCompanies}</p>
                            <p><strong>Из Нижегородской области:</strong> {stats.nnCompanies}</p>
                            <p><strong>Новых за месяц (всего):</strong> {stats.newTotalCompanies}</p>
                            <p><strong>Новых за месяц (НН):</strong> {stats.newNnCompanies}</p>
                        </>
                    )}
                </div>
                <div className="widget">
                    <h3>Категории компаний</h3>
                    <p><strong>Вендоры:</strong> 350</p>
                    <p><strong>Интеграторы:</strong> 450</p>
                    <p><strong>Digital-агентства:</strong> 254</p>
                    <p><strong>Другие:</strong> 200</p>
                </div>
            </div>
        </div>
    );
};

export default TabRegistry;
