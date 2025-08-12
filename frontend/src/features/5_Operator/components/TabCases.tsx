import React from 'react';
import './OperatorTabs.css';

const TabCases = () => {
    // Mock-данные
    const cases = [
        { id: 1, name: 'Внедрение CRM для "Газпром"', company: 'ООО "Интегратор-Плюс"', contact: 'Иванов И.И., ivanov@gazprom.mock' },
        { id: 2, name: 'Разработка HR-портала для "Сбер"', company: 'АО "Софт-Девелопмент"', contact: 'Петров П.П., petrov@sber.mock' },
        { id: 3, name: 'Миграция в облако для "Ростелеком"', company: 'ООО "Облачные Решения"', contact: 'Сидоров С.С., sidorov@rt.mock' }
    ];

    return (
        <div>
            <p>Здесь будет содержимое для управления кейсами.</p>
            <div className="widget">
                <h3>Кейсы, ожидающие верификации</h3>
                <ul className="case-list">
                    {cases.map(c => (
                        <li key={c.id}>
                            <div className="case-name">{c.name}</div>
                            <div className="case-details">
                                <span><strong>Поставщик:</strong> {c.company}</span>
                                <span><strong>Контакт:</strong> {c.contact}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TabCases;
