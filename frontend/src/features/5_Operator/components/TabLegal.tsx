import React, { useState } from 'react';
import './OperatorTabs.css';
import './TabLegal.css';

const mockAgreements = [
    { id: 1, name: 'Соглашение о конфиденциальности', company: 'ООО "Технопром"', inn: '7701234567' },
    { id: 2, name: 'Договор на разработку ПО', company: 'АО "Инновации"', inn: '7702345678' },
    { id: 3, name: 'Лицензионное соглашение', company: 'ООО "Ромашка"', inn: '5260123456' },
    { id: 4, name: 'Соглашение об уровне услуг (SLA)', company: 'ПАО "Газпром"', inn: '7736050003' },
    { id: 5, name: 'Договор поставки оборудования', company: 'ООО "Техно-трейд"', inn: '5001234567' },
    { id: 6, name: 'Соглашение о неразглашении', company: 'АО "Секьюр-софт"', inn: '7703456789' },
    { id: 7, name: 'Договор на техническую поддержку', company: 'ООО "Сервис Плюс"', inn: '5261234567' },
    { id: 8, name: 'Соглашение о партнерстве', company: 'ООО "Интегратор"', inn: '7704567890' },
];

const TabLegal = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAgreements = mockAgreements.filter(agreement =>
        agreement.inn.includes(searchTerm)
    );

    return (
        <div className="tab-content">
            <div className="registry-header">
                <h3>Поиск соглашений по ИНН</h3>
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Введите ИНН компании..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="legal-list">
                {filteredAgreements.map(agreement => (
                    <div key={agreement.id} className="legal-item">
                        <div className="legal-item-icon">📄</div>
                        <div className="legal-item-info">
                            <div className="legal-item-name">{agreement.name}</div>
                            <div className="legal-item-company">{agreement.company} (ИНН: {agreement.inn})</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TabLegal;
