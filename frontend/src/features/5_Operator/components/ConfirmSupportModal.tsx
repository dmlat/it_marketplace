import React, { useState, useContext } from 'react';
import Modal from '../../../shared/ui/Modal';
import { AuthContext } from '../../../app/App';
import './OperatorTabs.css';

interface ConfirmSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Grant {
    description: string;
    grant_year: number;
    grant_amount: string;
    confirmed_at: string;
}

const federalSupportMeasures = [
    'Получена ИТ-аккредитация Минцифры РФ',
    'Получен грант Фонда содействия инновациям (ФСИ)',
    'Получен грант Фонда "Сколково"',
    'Получен грант РФРИТ'
];

const ConfirmSupportModal: React.FC<ConfirmSupportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [inn, setInn] = useState('');
    const [foundCompany, setFoundCompany] = useState<{ id: number; name: string; inn: string } | null>(null);
    const [grantsHistory, setGrantsHistory] = useState<Grant[]>([]);
    const [isHistoryVisible, setIsHistoryVisible] = useState(true); // Состояние для сворачивания истории
    const [selectedMeasure, setSelectedMeasure] = useState<string>(''); // Был массив, стал строка
    const [grantYear, setGrantYear] = useState('');
    const [grantAmount, setGrantAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState(''); // Новая ошибка для валидации полей

    const auth = useContext(AuthContext);

    const resetState = () => {
        setInn('');
        setFoundCompany(null);
        setGrantsHistory([]); // Сбрасываем историю перед новым поиском
        setIsHistoryVisible(true);
        setSelectedMeasure(''); // Сбрасываем строку
        setGrantYear('');
        setGrantAmount('');
        setError('');
        setValidationError('');
        setLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSearch = async () => {
        if (!inn) {
            setError('Для поиска необходимо ввести ИНН компании.');
            return;
        };
        setLoading(true);
        setError('');
        setValidationError('');
        setFoundCompany(null);
        setGrantsHistory([]); // Сбрасываем историю перед новым поиском
        try {
            const response = await fetch(`http://localhost:8002/api/operator/company-by-inn/${inn}`, {
                headers: { 'Authorization': `Bearer ${auth?.token}` }
            });

            if (response.status === 403) {
                auth?.logout();
                throw new Error('Доступ запрещен. Пожалуйста, войдите в систему заново.');
            }
            
            if (!response.ok) {
                // Попытаемся прочитать тело ответа как JSON
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Ошибка ${response.status}`);
                } catch (e) {
                    // Если тело не JSON, показываем стандартную ошибку
                    throw new Error(`Ошибка сервера: ${response.status}`);
                }
            }

            const data = await response.json();
            setFoundCompany(data);

            // После нахождения компании, запрашиваем её историю грантов
            const grantsResponse = await fetch(`http://localhost:8002/api/operator/company/${data.id}/grants`, {
                 headers: { 'Authorization': `Bearer ${auth?.token}` }
            });
            if (!grantsResponse.ok) {
                // Не блокируем основной флоу, если гранты не загрузились, просто логируем
                console.error('Не удалось загрузить историю грантов');
                return;
            }
            const grantsData = await grantsResponse.json();
            setGrantsHistory(grantsData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRadioChange = (measure: string) => {
        setSelectedMeasure(measure);
    };

    const handleSubmit = async () => {
        if (!foundCompany || !selectedMeasure || !grantYear || !grantAmount) {
            setValidationError('Заполните все обязательные поля*');
            return;
        }
        setLoading(true);
        setError('');
        setValidationError('');

        // Формируем новый формат данных для бэкенда - один объект
        const measurePayload = {
            measureType: 'federal',
            description: selectedMeasure,
            grantAmount: grantAmount,
            grantYear: grantYear
        };

        try {
            const response = await fetch('http://localhost:8002/api/operator/confirm-support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth?.token}`
                },
                body: JSON.stringify({
                    companyId: foundCompany.id,
                    measure: measurePayload, // Отправляем один объект
                })
            });

            if (response.status === 403) {
                auth?.logout();
                throw new Error('Доступ запрещен. Пожалуйста, войдите в систему заново.');
            }
            
            if (!response.ok) {
                 try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Ошибка ${response.status}`);
                } catch (e) {
                    throw new Error(`Ошибка сервера: ${response.status}`);
                }
            }

            // Успех! Вызываем колбэк, который закроет модалку и обновит данные.
            onSuccess();
            resetState(); // Сбрасываем состояние модалки для следующего открытия
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="confirm-support-modal">
                <h2>Подтверждение мер поддержки</h2>
                
                {/* Сообщение об успехе больше не нужно, так как модалка закроется */}
                <div className="search-bar">
                    <input 
                        type="text" 
                        placeholder="Введите ИНН компании..." 
                        value={inn}
                        onChange={(e) => setInn(e.target.value)}
                        disabled={loading}
                    />
                    <button onClick={handleSearch} disabled={loading}>{loading ? 'Поиск...' : 'Найти'}</button>
                </div>
                
                {error && (
                    <div className="error-block">
                        <strong>Ошибка:</strong>
                        <p>{error}</p>
                    </div>
                )}

                {foundCompany && (
                    <div className="company-info-block widget">
                        <h3>{foundCompany.name} (ИНН: {foundCompany.inn})</h3>
                        
                        {/* Блок с историей грантов */}
                        <div className="grants-history">
                            <div className={`history-toggle ${isHistoryVisible ? 'open' : ''}`} onClick={() => setIsHistoryVisible(!isHistoryVisible)}>
                                <span className="arrow"></span>
                                <h4>История подтвержденных грантов:</h4>
                            </div>
                            {isHistoryVisible && (
                                grantsHistory.length > 0 ? (
                                    <ul>
                                        {grantsHistory.map((grant, index) => (
                                            <li key={index}>
                                                <strong>{grant.description}</strong> - {grant.grant_amount} руб. ({grant.grant_year} г.)
                                                <br/>
                                                <small>Подтверждено: {new Date(grant.confirmed_at).toLocaleDateString()}</small>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Ранее подтвержденных грантов не найдено.</p>
                                )
                            )}
                        </div>

                        <div className="form-group">
                            <h4>Выберите Федеральную меру поддержки <span className="required-star">*</span></h4>
                            {federalSupportMeasures.map(measure => (
                                <label key={measure} className="checkbox-label">
                                    <input 
                                        type="radio" 
                                        name="supportMeasure"
                                        checked={selectedMeasure === measure}
                                        onChange={() => handleRadioChange(measure)}
                                    /> {measure}
                                </label>
                            ))}
                        </div>
                        <div className="form-group">
                            <label>Год получения гранта <span className="required-star">*</span></label>
                            <input 
                                type="number" 
                                placeholder="2023" 
                                value={grantYear}
                                onChange={(e) => setGrantYear(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Сумма гранта <span className="required-star">*</span></label>
                            <input 
                                type="text" 
                                placeholder="1000000" 
                                value={grantAmount}
                                onChange={(e) => setGrantAmount(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Условное отображение кнопок и ошибки валидации */}
                {foundCompany && (
                    <>
                        {validationError && <p className="validation-error">{validationError}</p>}
                        <div className="modal-actions">
                            <button 
                                className="confirm-button" 
                                onClick={handleSubmit} 
                                disabled={loading}
                            >
                                {loading ? 'Сохранение...' : 'Подтвердить'}
                            </button>
                            <button className="cancel-button" onClick={handleClose} disabled={loading}>Отмена</button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ConfirmSupportModal;
