require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const port = 8002;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware для проверки JWT и роли оператора
const verifyOperator = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Невалидный токен' });
        }
        
        if (decoded.role !== 'operator') {
            return res.status(403).json({ message: 'Доступ запрещен: требуется роль оператора' });
        }

        req.user = decoded; // Сохраняем данные пользователя в запросе
        next();
    });
};


// Настройка подключения к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

app.get('/', (req, res) => {
  res.send('Hello from operator-service!');
});

// Эндпоинт для получения всех компаний
app.get('/companies', async (req, res) => {
    try {
        const allCompanies = await pool.query('SELECT * FROM companies ORDER BY name');
        res.json(allCompanies.rows);
    } catch (error) {
        console.error('Ошибка при получении списка компаний:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Эндпоинт для получения компаний по региону
app.get('/companies/region/:regionName', async (req, res) => {
    try {
        const { regionName } = req.params;
        const companiesByRegion = await pool.query(
            'SELECT * FROM companies WHERE region = $1 ORDER BY name', 
            [regionName]
        );
        res.json(companiesByRegion.rows);
    } catch (error) {
        console.error('Ошибка при получении списка компаний по региону:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Новый эндпоинт для получения статистики по мерам поддержки
app.get('/api/operator/support-stats', verifyOperator, async (req, res) => {
    // TODO: Добавить валидацию JWT и проверку роли оператора
    try {
        // 1. Сколько компаний осведомлены о мерах поддержки
        const awareCountResult = await pool.query(
            "SELECT COUNT(*) FROM survey_support_answers WHERE is_aware = true"
        );
        const companiesAwareCount = parseInt(awareCountResult.rows[0].count, 10);

        // 2. Топ-3 самых запрашиваемых мер
        const topInterestsResult = await pool.query(`
            SELECT interest, COUNT(interest) as count
            FROM (
                SELECT unnest(main_interest) as interest
                FROM survey_support_answers
                WHERE main_interest IS NOT NULL AND array_length(main_interest, 1) > 0
            ) as unnested_interests
            GROUP BY interest
            ORDER BY count DESC
            LIMIT 3;
        `);
        const topInterests = topInterestsResult.rows;

        // 3. Статистика по фактически выданным грантам
        const confirmedGrantsResult = await pool.query(`
            SELECT description, COUNT(DISTINCT company_id) as company_count
            FROM operator_confirmed_grants
            GROUP BY description
            ORDER BY company_count DESC;
        `);
        const confirmedGrantsStats = confirmedGrantsResult.rows;

        res.json({
            companiesAwareCount,
            topInterests,
            confirmedGrantsStats
        });

    } catch (error) {
        console.error('Ошибка при получении статистики по мерам поддержки:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Новый эндпоинт для получения статистики по реестру компаний
app.get('/api/operator/registry-stats', verifyOperator, async (req, res) => {
    try {
        // 1. Общее количество компаний
        const totalResult = await pool.query('SELECT COUNT(*) FROM companies');
        const totalCompanies = parseInt(totalResult.rows[0].count, 10);

        // 2. Количество компаний из Нижегородской области (ИНН начинается с 52)
        const nnResult = await pool.query("SELECT COUNT(*) FROM companies WHERE inn LIKE '52%'");
        const nnCompanies = parseInt(nnResult.rows[0].count, 10);

        // 3. Новые компании за последние 30 дней
        const newTotalResult = await pool.query("SELECT COUNT(*) FROM companies WHERE created_at >= NOW() - INTERVAL '30 days'");
        const newTotalCompanies = parseInt(newTotalResult.rows[0].count, 10);
        
        // 4. Новые компании из НН за последние 30 дней
        const newNnResult = await pool.query("SELECT COUNT(*) FROM companies WHERE inn LIKE '52%' AND created_at >= NOW() - INTERVAL '30 days'");
        const newNnCompanies = parseInt(newNnResult.rows[0].count, 10);

        res.json({
            totalCompanies,
            nnCompanies,
            newTotalCompanies,
            newNnCompanies
        });

    } catch (error) {
        console.error('Ошибка при получении статистики по реестру:', error);
        res.status(500).json({ message: 'Ошибка сервера при получении статистики по реестру' });
    }
});

// Новый эндпоинт для поиска компании по ИНН
app.get('/api/operator/company-by-inn/:inn', verifyOperator, async (req, res) => {
    try {
        const { inn } = req.params;
        // ИНН может быть строкой, а в БД - числом. Приводим к числу.
        const innAsNumber = parseInt(inn, 10); 
        if (isNaN(innAsNumber)) {
            return res.status(400).json({ message: 'ИНН должен быть числом' });
        }
        
        const result = await pool.query('SELECT id, name, inn FROM companies WHERE inn = $1', [innAsNumber]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Компания с таким ИНН не найдена' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при поиске компании по ИНН:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Новый эндпоинт для получения подтвержденных грантов для конкретной компании
app.get('/api/operator/company/:companyId/grants', verifyOperator, async (req, res) => {
    try {
        const { companyId } = req.params;
        const result = await pool.query(
            'SELECT description, grant_year, grant_amount, confirmed_at FROM operator_confirmed_grants WHERE company_id = $1 ORDER BY confirmed_at DESC',
            [companyId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении грантов компании:', error);
        res.status(500).json({ message: 'Ошибка сервера при получении истории грантов' });
    }
});


// Новый эндпоинт для подтверждения мер поддержки
app.post('/api/operator/confirm-support', verifyOperator, async (req, res) => {
    const { companyId, measure } = req.body; // Ожидаем companyId и один объект measure
    const confirmedByOperatorId = req.user.id; // ID оператора из токена

    // Валидация
    if (!companyId || !measure || !measure.measureType || !measure.description || !measure.grantYear || !measure.grantAmount) {
        return res.status(400).json({ message: 'Отсутствуют или некорректны обязательные поля: companyId, measureType, description, grantYear, grantAmount' });
    }

    try {
        const { measureType, description, grantAmount, grantYear } = measure;

        await pool.query(
            `INSERT INTO operator_confirmed_grants (
                company_id, 
                measure_type, 
                description, 
                grant_amount, 
                grant_year, 
                confirmed_by_operator_id, 
                confirmed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
                companyId,
                measureType,
                description,
                grantAmount,
                grantYear,
                confirmedByOperatorId
            ]
        );
       
        res.status(201).json({ message: 'Мера поддержки успешно подтверждена' });
    } catch (error) {
        console.error('Ошибка при сохранении меры поддержки:', error);
        res.status(500).json({ message: 'Ошибка сервера при сохранении меры поддержки' });
    }
});


app.listen(port, () => {
  console.log(`Operator service listening at http://localhost:${port}`);
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Ошибка подключения к базе данных', err.stack);
    } else {
      console.log('Успешное подключение к базе данных из operator-service:', res.rows[0].now);
    }
  });
});
