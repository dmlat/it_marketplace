import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../app/App';
import './OperatorTabs.css';

interface SupportStats {
    companiesAwareCount: number;
    topInterests: { interest: string; count: string; }[];
    confirmedGrantsStats: { description: string; company_count: string; }[];
}

const TabSupport = ({ onConfirmClick, refreshTrigger }: { onConfirmClick: () => void; refreshTrigger: number }) => {
    const [stats, setStats] = useState<SupportStats | null>(null);
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
                const response = await fetch('http://localhost:8002/api/operator/support-stats', {
                    headers: { 'Authorization': `Bearer ${auth.token}` },
                    cache: 'no-store' // Запрещаем кеширование для этого запроса
                });

                if (response.status === 403) {
                    auth.logout();
                    throw new Error('Доступ запрещен. Пожалуйста, войдите в систему заново.');
                }

                if (!response.ok) {
                    throw new Error('Не удалось загрузить статистику');
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
    }, [auth, refreshTrigger]);


    return (
        <div>
            <div className="content-area">
                {/* Блок со статистикой по анкетам */}
                <div className="dashboard-container">
                    {loading && <p>Загрузка статистики...</p>}
                    {error && <p className="error-message">{error}</p>}
                    
                    {!loading && !error && stats && (
                        <div className="dashboard-grid">
                            <div className="widget">
                                <h3>Осведомленность (по данным анкет)</h3>
                                <p><strong>{stats.companiesAwareCount || 0}</strong> компаний осведомлены о мерах поддержки</p>
                            </div>
                            <div className="widget">
                                <h3>Топ-3 запрашиваемых мер (по данным анкет)</h3>
                                {stats.topInterests && stats.topInterests.length > 0 ? (
                                    <ul className="interest-list">
                                        {stats.topInterests.map(item => (
                                            <li key={item.interest}>
                                                <span>{item.interest}</span>
                                                <span className="interest-count">{item.count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Нет данных для отображения.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Блок с действиями и статистикой по фактам */}
                <div className="actions-and-facts-container">
                    <div className="support-actions">
                        <h3>Подтверждение мер поддержки</h3>
                        <p>Найдите компанию по ИНН и укажите фактически полученные ею меры поддержки.</p>
                        <button onClick={onConfirmClick}>Подтвердить меры поддержки</button>
                    </div>

                    <div className="widget">
                        <h3>Статистика по выданным грантам</h3>
                        {!loading && !error && stats && (
                             <>
                                {stats.confirmedGrantsStats && stats.confirmedGrantsStats.length > 0 ? (
                                    <ul className="interest-list">
                                        {stats.confirmedGrantsStats.map(item => (
                                            <li key={item.description}>
                                                <span>{item.description}</span>
                                                <span className="interest-count">{item.company_count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Нет подтвержденных грантов.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TabSupport;
