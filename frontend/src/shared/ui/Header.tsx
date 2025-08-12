import React, { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../../app/App'; // Исправленный путь
import './Header.css';

interface HeaderProps {
    onLoginClick: () => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick, onLogout }) => {
    const auth = useContext(AuthContext);

    return (
        <header className="app-header">
            <div className="header-left">
                <Link to="/" className="logo">
                    <span className="logo-main">ИТ-маркетплейс.рф</span>
                </Link>
                <nav className="main-nav">
                    <NavLink to="/products">Продукты</NavLink>
                    <NavLink to="/companies">Компании</NavLink>
                    <NavLink to="/equipment">Оборудование</NavLink>
                    <NavLink to="/outstaff">Аутстафф</NavLink>
                    {auth?.user?.role === 'operator' && (
                        <NavLink to="/operator">Панель оператора</NavLink>
                    )}
                </nav>
            </div>
            <div className="header-right">
                {auth?.token ? (
                    <>
                        {(auth.user?.role === 'supplier' || auth.user?.role === 'customer') && (
                             <NavLink to="/profile" className="profile-button">
                                Личный кабинет
                            </NavLink>
                        )}
                        <button onClick={onLogout} className="login-button">
                            Выйти
                        </button>
                    </>
                ) : (
                    <button className="login-button" onClick={onLoginClick}>
                        Вход
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
