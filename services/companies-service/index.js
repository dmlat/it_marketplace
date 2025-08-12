require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const port = 8003;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware для аутентификации
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Существующие эндпоинты ---

app.get('/companies', async (req, res) => {
    try {
        const allCompanies = await pool.query('SELECT * FROM companies');
        res.json(allCompanies.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/companies', async (req, res) => {
    const { user_id, name, inn, full_name, region } = req.body;
    
    // Подробное логирование входящих данных
    console.log('[COMPANIES-SERVICE] Получен запрос на создание компании:');
    console.log(`[COMPANIES-SERVICE] user_id: ${user_id}`);
    console.log(`[COMPANIES-SERVICE] name: ${name}`);
    console.log(`[COMPANIES-SERVICE] inn: ${inn}`);
    console.log(`[COMPANIES-SERVICE] full_name: ${full_name}`);
    console.log(`[COMPANIES-SERVICE] region: ${region}`);

    if (!user_id || !name || !inn) {
        console.error('[COMPANIES-SERVICE] Ошибка валидации: Отсутствуют обязательные поля.');
        return res.status(400).json({ message: 'user_id, name and inn are required' });
    }

    try {
        const newCompany = await pool.query(
            'INSERT INTO companies (user_id, name, full_name, inn, region) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, name, full_name, inn, region]
        );
        console.log(`[COMPANIES-SERVICE] Компания "${name}" (ID: ${newCompany.rows[0].id}) успешно создана в БД.`);
        res.status(201).json(newCompany.rows[0]);
    } catch (error) {
        console.error('[COMPANIES-SERVICE] Ошибка при создании компании в БД:', error);
        if (error.code === '23505') { // 23505 - unique_violation in PostgreSQL
            return res.status(409).json({ message: 'Компания с таким ИНН уже зарегистрирована.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/companies/:id/support-survey', async (req, res) => {
    const { id } = req.params;
    const { 
        is_aware, 
        main_interest, 
        used_federal, 
        used_regional,
        startup_plans, 
        attracting_specialists
    } = req.body;

    // Валидация: проверяем, что company_id предоставлен
    if (!id) {
        return res.status(400).json({ message: 'Company ID is required.' });
    }

    try {
        const query = `
            INSERT INTO survey_support_answers 
            (company_id, is_aware, main_interest, used_federal, used_regional, startup_plans, attracting_specialists) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (company_id) DO UPDATE SET
                is_aware = EXCLUDED.is_aware,
                main_interest = EXCLUDED.main_interest,
                used_federal = EXCLUDED.used_federal,
                used_regional = EXCLUDED.used_regional,
                startup_plans = EXCLUDED.startup_plans,
                attracting_specialists = EXCLUDED.attracting_specialists,
                updated_at = NOW()
            RETURNING *`;

        const values = [id, is_aware, main_interest, used_federal, used_regional, startup_plans, attracting_specialists];
        
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'Survey data saved successfully', data: result.rows[0] });

    } catch (error) {
        console.error('Ошибка при сохранении данных опроса:', error);
        res.status(500).json({ message: 'Internal server error while saving survey data' });
    }
});

// --- Новые эндпоинты для личного кабинета ---

// Получение данных компании для авторизованного пользователя
app.get('/api/companies/me', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    
    try {
        const companyQuery = `
            SELECT c.*, 
                   cc.full_name as contact_full_name, cc.position as contact_position, 
                   cc.phone as contact_phone, cc.email as contact_email
            FROM companies c
            LEFT JOIN company_contacts cc ON c.id = cc.company_id
            WHERE c.user_id = $1
        `;
        const companyResult = await pool.query(companyQuery, [userId]);

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found for this user.' });
        }

        res.json(companyResult.rows[0]);
    } catch (error) {
        console.error('Error fetching company data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Обновление данных компании
app.put('/api/companies/me', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const {
        name, full_name, foundation_year, region, description,
        notify_on_new_orders, website_url, it_associations, logo_url,
        contact_full_name, contact_position, contact_phone, contact_email
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Получаем ID компании
        const companyIdResult = await client.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
        if (companyIdResult.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }
        const companyId = companyIdResult.rows[0].id;

        // 2. Обновляем данные компании
        const companyUpdateQuery = `
            UPDATE companies SET
                name = $1, full_name = $2, foundation_year = $3, region = $4,
                description = $5, notify_on_new_orders = $6, website_url = $7,
                it_associations = $8, logo_url = $9, updated_at = NOW()
            WHERE id = $10
            RETURNING *
        `;
        const companyValues = [
            name, full_name, foundation_year, region, description,
            notify_on_new_orders, website_url, it_associations, logo_url, companyId
        ];
        const updatedCompany = await client.query(companyUpdateQuery, companyValues);
        
        // 3. Обновляем или создаем контакт (Upsert)
        const contactUpsertQuery = `
            INSERT INTO company_contacts (company_id, full_name, position, phone, email)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (company_id) 
            DO UPDATE SET
                full_name = $2,
                position = $3,
                phone = $4,
                email = $5,
                updated_at = NOW()
        `;
        const contactValues = [companyId, contact_full_name, contact_position, contact_phone, contact_email];
        await client.query(contactUpsertQuery, contactValues);
        
        await client.query('COMMIT');
        res.json(updatedCompany.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating company data:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});


app.listen(port, () => {
  console.log(`Companies service listening at http://localhost:${port}`);
});
