import React from 'react';
import './AuthChoice.css';

interface AuthChoiceProps {
    onRoleSelect: (role: 'customer' | 'supplier') => void;
}

const AuthChoice: React.FC<AuthChoiceProps> = ({ onRoleSelect }) => {
    return (
        <div className="auth-choice-container">
            <h3>Выберите свою роль на портале:</h3>
            <button className="role-button" onClick={() => onRoleSelect('customer')}>
                <span className="role-title">Заказчик</span>
                <span className="role-description">Как заказчик я могу оставлять заказы и получать предложения от компаний</span>
            </button>
            <button className="role-button" onClick={() => onRoleSelect('supplier')}>
                <span className="role-title">Поставщик</span>
                <span className="role-description">Как поставщик я могу размещать продукты, услуги, оборудование, аутстаф на портале и направлять предложения заказчику</span>
            </button>
        </div>
    );
};

export default AuthChoice;
