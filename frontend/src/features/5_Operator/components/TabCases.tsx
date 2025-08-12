import React from 'react';
import './OperatorTabs.css';
import './TabCases.css';

const TabCases = () => {
    // Mock-данные
    const cases = [
        { id: 1, name: 'Внедрение CRM для "Газпром"', company: 'ООО "Интегратор-Плюс"', contact: 'Иванов И.И., ivanov@gazprom.mock' },
        { id: 2, name: 'Разработка HR-портала для "Сбер"', company: 'АО "Софт-Девелопмент"', contact: 'Петров П.П., petrov@sber.mock' },
        { id: 3, name: 'Миграция в облако для "Ростелеком"', company: 'ООО "Облачные Решения"', contact: 'Сидоров С.С., sidorov@rt.mock' }
    ];

    return (
        <div className="tab-content">
            <div className="cases-header">
                <h3>Кейсы, ожидающие верификации</h3>
            </div>
            <div className="cases-list">
                {cases.map(c => (
                    <div key={c.id} className="case-item">
                        <div className="case-item-info">
                            <div className="case-item-name">{c.name}</div>
                            <div className="case-item-details">
                                <strong>Поставщик:</strong> {c.company} <br />
                                <strong>Контакт:</strong> {c.contact}
                            </div>
                        </div>
                        <div className="case-item-actions">
                            <button className="action-button approve">
                                <span className="icon">✔</span> Подтвердить
                            </button>
                            <button className="action-button reject">
                                <span className="icon">✖</span> Отклонить
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TabCases;
