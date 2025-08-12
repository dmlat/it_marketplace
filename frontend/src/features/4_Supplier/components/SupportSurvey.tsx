import React, { useState } from 'react';
import './SupportSurvey.css';

interface Company {
    id: number;
    name: string;
}

interface SupportSurveyProps {
    company: Company;
    email: string;
    password: string;
    onLoginSuccess: (token: string, user: { id: number; role: string }) => void;
}

const SupportSurvey: React.FC<SupportSurveyProps> = ({ company, email, password, onLoginSuccess }) => {
    const [isAware, setIsAware] = useState<boolean | null>(null);
    const [mainInterests, setMainInterests] = useState<string[]>([]);
    const [startupPlans, setStartupPlans] = useState<string>('');
    const [attractingSpecialists, setAttractingSpecialists] = useState<boolean | null>(null);
    const [usedSupport, setUsedSupport] = useState<boolean | null>(null);
    const [usedFederal, setUsedFederal] = useState<string[]>([]);
    const [usedRegional, setUsedRegional] = useState<string[]>([]);
    
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => 
            prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const surveyData = {
            is_aware: isAware,
            main_interest: mainInterests,
            startup_plans: startupPlans,
            attracting_specialists: attractingSpecialists,
            used_federal: usedFederal,
            used_regional: usedRegional
        };

        try {
            const response = await fetch(`http://localhost:8003/companies/${company.id}/support-survey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(surveyData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ошибка сохранения данных');
            
            // Автоматический логин после успешной отправки опросника
            const loginResponse = await fetch('http://localhost:8001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const loginData = await loginResponse.json();
            if (!loginResponse.ok) throw new Error(loginData.message || 'Ошибка автоматического входа');

            // Вызываем onLoginSuccess вместо перезагрузки страницы
            onLoginSuccess(loginData.token, loginData.user);

        } catch (err: any) {
            setError(err.message);
        }
    };

    if (message) {
        return <div className="survey-container"><h2>{message}</h2></div>;
    }

    return (
        <div className="survey-container">
            <h2>Опрос о мерах поддержки для компании "{company.name}"</h2>
            <form onSubmit={handleSubmit} className="survey-form">
                
                {/* --- Question 1 --- */}
                <div className="survey-question">
                    <h4>1. Вы осведомлены об актуальных региональных и/или федеральных мерах поддержки бизнеса?</h4>
                    <div className="radio-group">
                        <label><input type="radio" name="is_aware" onChange={() => setIsAware(true)} checked={isAware === true} /> Осведомлен</label>
                        <label><input type="radio" name="is_aware" onChange={() => setIsAware(false)} checked={isAware === false} /> Не осведомлен</label>
                    </div>
                </div>

                {/* --- Question 2 --- */}
                <div className="survey-question">
                    <h4>2. Какие меры поддержки, представляющие наибольший интерес для компании?</h4>
                    <div className="checkbox-group">
                        <label><input type="checkbox" onChange={() => handleCheckboxChange(setMainInterests, 'Возмещение з/п')} /> Возмещение з/п</label>
                        <label><input type="checkbox" onChange={() => handleCheckboxChange(setMainInterests, 'Возмещение НДФЛ')} /> Возмещение НДФЛ</label>
                        <label><input type="checkbox" onChange={() => handleCheckboxChange(setMainInterests, 'Возмещение НДФЛ за привлечение ИТ-специалистов')} /> Возмещение НДФЛ за привлечение ИТ-специалистов</label>
                    </div>
                </div>

                {/* --- Question 3 --- */}
                <div className="survey-question">
                    <h4>3. У вас есть планы включить вашу компанию в реестр IT стартапов?</h4>
                     <div className="radio-group">
                        <label><input type="radio" name="startup_plans" value="plan" onChange={(e) => setStartupPlans(e.target.value)} checked={startupPlans === 'plan'} /> Планирую</label>
                        <label><input type="radio" name="startup_plans" value="no_plan" onChange={(e) => setStartupPlans(e.target.value)} checked={startupPlans === 'no_plan'} /> Не планирую</label>
                        <label><input type="radio" name="startup_plans" value="already_in" onChange={(e) => setStartupPlans(e.target.value)} checked={startupPlans === 'already_in'} /> Уже вхожу в реестр</label>
                    </div>
                </div>

                {/* --- Question 4 --- */}
                <div className="survey-question">
                    <h4>4. Планируете привлекать специалистов из других субъектов и государств?</h4>
                    <div className="radio-group">
                        <label><input type="radio" name="attracting_specialists" onChange={() => setAttractingSpecialists(true)} checked={attractingSpecialists === true}/> Да</label>
                        <label><input type="radio" name="attracting_specialists" onChange={() => setAttractingSpecialists(false)} checked={attractingSpecialists === false}/> Нет</label>
                    </div>
                </div>
                
                {/* --- Question 5 --- */}
                <div className="survey-question">
                    <h4>Использовали ли вы меры государственной поддержки?</h4>
                    <div className="radio-group">
                        <label><input type="radio" name="used_support" onChange={() => setUsedSupport(true)} checked={usedSupport === true}/> Да</label>
                        <label><input type="radio" name="used_support" onChange={() => setUsedSupport(false)} checked={usedSupport === false}/> Нет</label>
                    </div>
                </div>

                {/* --- Conditional Block --- */}
                {usedSupport && (
                    <div className="conditional-block">
                        <h4>Какие меры поддержки вы использовали?</h4>
                        <div className="survey-subsection">
                            <h5>Федеральные</h5>
                            <div className="checkbox-group">
                                <label><input type="checkbox" onChange={() => handleCheckboxChange(setUsedFederal, 'Возмещение з/п')} /> Возмещение з/п</label>
                                <label><input type="checkbox" onChange={() => handleCheckboxChange(setUsedFederal, 'Возмещение НДФЛ')} /> Возмещение НДФЛ</label>
                                <label><input type="checkbox" onChange={() => handleCheckboxChange(setUsedFederal, 'Возмещение НДФЛ за привлечение ИТ-специалистов')} /> Возмещение НДФЛ за привлечение ИТ-специалистов</label>
                            </div>
                        </div>
                        <div className="survey-subsection">
                            <h5>Региональные</h5>
                            <div className="checkbox-group">
                                <label><input type="checkbox" onChange={() => handleCheckboxChange(setUsedRegional, 'Возмещение з/п')} /> Возмещение з/п</label>
                                <label><input type="checkbox" onChange={() => handleCheckboxChange(setUsedRegional, 'Возмещение НДФЛ')} /> Возмещение НДФЛ</label>
                                <label><input type="checkbox" onChange={() => handleCheckboxChange(setUsedRegional, 'Возмещение НДФЛ за привлечение ИТ-специалистов')} /> Возмещение НДФЛ за привлечение ИТ-специалистов</label>
                            </div>
                        </div>
                    </div>
                )}
                
                <button type="submit" className="form-container-button">Завершить регистрацию</button>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};

export default SupportSurvey;
