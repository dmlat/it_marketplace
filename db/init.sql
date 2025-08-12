-- Создаем перечисляемый тип (ENUM) для ролей пользователей
CREATE TYPE user_role AS ENUM ('customer', 'supplier', 'operator');

-- Создаем таблицу users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Просто для примера, можно добавить первого пользователя-оператора
-- Пароль 'admin_password' будет хеширован в приложении перед вставкой
-- INSERT INTO users (email, password_hash, role) VALUES ('operator@example.com', 'some_hashed_password', 'operator');

-- Добавляем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Комментарии к таблице и колонкам для лучшего понимания
COMMENT ON TABLE users IS 'Таблица для хранения учетных записей пользователей всех ролей.';
COMMENT ON COLUMN users.id IS 'Уникальный идентификатор пользователя (Primary Key).';
COMMENT ON COLUMN users.email IS 'Электронная почта пользователя, используется для входа. Должна быть уникальной.';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля пользователя, сгенерированный с помощью bcrypt.';
COMMENT ON COLUMN users.role IS 'Роль пользователя в системе (customer, supplier, operator).';
COMMENT ON COLUMN users.created_at IS 'Дата и время создания учетной записи.';
COMMENT ON COLUMN users.updated_at IS 'Дата и время последнего обновления учетной записи.';

-- Добавляем моковых пользователей, чтобы на них можно было ссылаться
-- Пароли 'password123' для всех тестовых пользователей.
-- Хеш сгенерирован в самом приложении для полной совместимости.
INSERT INTO users (email, password_hash, role) VALUES
('supplier1@example.com', '$2b$10$et0hwYMlenKHywLMAuAwd.HSrhm2AGZzhE1p5fPRCIgnVYC5HPhXe', 'supplier'),
('supplier2@example.com', '$2b$10$et0hwYMlenKHywLMAuAwd.HSrhm2AGZzhE1p5fPRCIgnVYC5HPhXe', 'supplier'),
('supplier3@example.com', '$2b$10$et0hwYMlenKHywLMAuAwd.HSrhm2AGZzhE1p5fPRCIgnVYC5HPhXe', 'supplier'),
('customer1@example.com', '$2b$10$et0hwYMlenKHywLMAuAwd.HSrhm2AGZzhE1p5fPRCIgnVYC5HPhXe', 'customer'),
('operator@1', '$2b$10$et0hwYMlenKHywLMAuAwd.HSrhm2AGZzhE1p5fPRCIgnVYC5HPhXe', 'operator');


-- =================================================================
-- Таблица компаний
-- =================================================================

-- Типы для ENUMs, которые в будущем могут быть расширены
CREATE TYPE company_size_enum AS ENUM ('micro', 'small', 'medium', 'large');
CREATE TYPE company_status_enum AS ENUM ('active', 'liquidated', 'in_liquidation');

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    
    -- Основные, редактируемые пользователем поля
    name VARCHAR(255) NOT NULL, -- Фирменное название, будет отображаться на фронтенде конечным пользователям
    full_name VARCHAR(255),
    foundation_year INTEGER,
    inn VARCHAR(12) UNIQUE NOT NULL,
    region VARCHAR(255),
    description TEXT,
    notify_on_new_orders BOOLEAN DEFAULT false,
    website_url VARCHAR(255),
    it_associations TEXT[], -- Массив, возможные значения: "РУССОФТ", "АРПП «Отечественный софт»"
    logo_url VARCHAR(255), -- Временно: прямая ссылка на лого. В будущем будет заменено на ID из uploads-service.
    
    -- Дополнительные поля для оператора (пока не на фронтенде)
    ogrn VARCHAR(15),
    kpp VARCHAR(9),
    legal_address TEXT,
    legal_form VARCHAR(50), -- АО, ИП, ООО
    registration_date DATE,
    okved VARCHAR(255),
    employees_count_2022 INT,
    employees_count_2023 INT,
    revenue_2022 DECIMAL(15, 2),
    revenue_2023 DECIMAL(15, 2),
    company_size VARCHAR(50), -- микробизнес, малый, средний, крупный
    company_status VARCHAR(50), -- Действующая, ликвидирована, на стадии ликвидации
    actual_address TEXT,
    company_type TEXT[], -- Digital-агентство, вендор, интегратор...
    activity_direction TEXT,
    gorky_tech_participation TEXT, -- акселератор, внутренние проекты...
    has_own_solution TEXT, -- своя разработка, на базе 1С...

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Убираем старые мок-данные для компаний, так как структура изменилась
-- INSERT INTO companies (user_id, name, full_name, inn, region, website_url) VALUES
-- ((SELECT id from users WHERE email = 'supplier1@example.com'), 'ASDsoft', 'ООО "АСД СОФТ"', '5257101835', 'Нижегородская область', 'https://asdsoft.ru'),
-- ((SELECT id from users WHERE email = 'supplier2@example.com'), 'Тестовая Компания 2', 'ООО "Рога и Копыта"', '1234567891', 'Москва', 'https://example.com'),
-- ((SELECT id from users WHERE email = 'supplier3@example.com'), 'Тестовая Компания 3', 'ИП Иванов И.И.', '9876543210', 'Нижегородская область', 'https://ivanov.io');


CREATE TRIGGER set_timestamp_companies
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


COMMENT ON TABLE companies IS 'Таблица для хранения информации о компаниях-поставщиках.';
COMMENT ON COLUMN companies.user_id IS 'Ссылка на пользователя-владельца компании.';
COMMENT ON COLUMN companies.name IS 'Фирменное название компании. Отображается на фронтенде для клиентов.';
COMMENT ON COLUMN companies.it_associations IS 'Участие в ИТ-ассоциациях. Массив строк.';
COMMENT ON COLUMN companies.logo_url IS 'ВРЕМЕННОЕ РЕШЕНИЕ: Прямая URL-ссылка на логотип. В будущем будет заменено на ID файла из uploads-service.';
COMMENT ON COLUMN companies.company_type IS 'Тип компании (Digital-агентство, вендор, интегратор и т.д.). Массив строк.';


-- =================================================================
-- Таблица контактов компании
-- =================================================================
CREATE TABLE IF NOT EXISTS company_contacts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER UNIQUE NOT NULL, -- Пока один контакт на компанию, поэтому UNIQUE
    full_name VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_contact
        FOREIGN KEY(company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
);

CREATE TRIGGER set_timestamp_company_contacts
BEFORE UPDATE ON company_contacts
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE company_contacts IS 'Хранит контактные данные сотрудников компаний. Пока один контакт на компанию.';

-- =================================================================
-- Таблица для ответов компаний на опрос о мерах поддержки
-- =================================================================

DROP TABLE IF EXISTS support_measures_facts;
DROP TABLE IF EXISTS support_measures_interests;
DROP TABLE IF EXISTS operator_confirmed_grants;
DROP TABLE IF EXISTS survey_support_answers;


-- Таблица для хранения фактических, подтвержденных оператором данных о полученных мерах поддержки
CREATE TABLE operator_confirmed_grants (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    measure_type VARCHAR(50) NOT NULL CHECK (measure_type IN ('federal', 'regional')),
    description TEXT NOT NULL,
    grant_amount DECIMAL(15, 2) NOT NULL,
    grant_year INTEGER NOT NULL,
    confirmed_by_operator_id INTEGER NOT NULL REFERENCES users(id),
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для хранения ответов компаний из анкеты о мерах поддержки
CREATE TABLE survey_support_answers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    is_aware BOOLEAN,
    main_interest TEXT[],
    used_federal TEXT[],
    used_regional TEXT[],
    startup_plans VARCHAR(255),
    attracting_specialists BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Триггер для автоматического обновления updated_at в survey_support_answers
CREATE OR REPLACE FUNCTION update_survey_answers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_survey_support_answers_modtime
BEFORE UPDATE ON survey_support_answers
FOR EACH ROW
EXECUTE FUNCTION update_survey_answers_updated_at_column();

COMMENT ON TABLE survey_support_answers IS 'Хранит ответы компаний на опрос о мерах поддержки при регистрации.';

-- =================================================================
-- Таблица для фактов использования мер поддержки (заполняется из опросника)
-- =================================================================

CREATE TABLE IF NOT EXISTS support_measures_facts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    used_support BOOLEAN, -- Ответ на вопрос "Использовали ли вы меры государственной поддержки?"
    federal_support_types TEXT[], -- Список использованных федеральных мер
    regional_support_types TEXT[], -- Список использованных региональных мер
    measure_type VARCHAR(50) CHECK (measure_type IN ('federal', 'regional')),
    description TEXT,
    grant_amount DECIMAL(15, 2),
    grant_year INTEGER,
    confirmed_by_operator_id INTEGER REFERENCES users(id),
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE support_measures_facts IS 'Хранит фактические данные об использованных мерах поддержки, полученные из опросника при регистрации.';