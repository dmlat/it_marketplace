require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); // Added bcryptjs for password hashing
const jwt = require('jsonwebtoken'); // Added jwt for token generation

const app = express();
const port = 8001;

// Middleware
app.use(cors()); // <-- Добавляем CORS middleware
app.use(express.json());

// Настройка подключения к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Проверка подключения к БД
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Ошибка подключения к базе данных', err.stack);
  } else {
    console.log('Успешное подключение к базе данных:', res.rows[0].now);
  }
});


app.get('/', (req, res) => {
  res.send('Hello from users-service! We are connected to the database.');
});

app.post('/register', async (req, res) => {
    console.log('Получены данные для регистрации:', req.body);
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password and role are required' });
    }

    // Проверяем, что роль корректна
    if (!['customer', 'supplier', 'operator'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    try {
        // Хешируем пароль
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Сохраняем пользователя в БД
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
            [email, password_hash, role]
        );

        res.status(201).json({ 
            message: 'User created successfully', 
            user: newUser.rows[0] 
        });

    } catch (error) {
        console.error('Ошибка при регистрации пользователя:', error);
        // Проверяем, не является ли ошибка нарушением уникальности email
        if (error.code === '23505') { // 23505 - unique_violation in PostgreSQL
            return res.status(409).json({ message: 'Этот e-mail уже зарегистрирован. Попробуйте другой.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Попытка входа для email: "${email}"`);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Ищем пользователя по email
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            console.error(`[LOGIN FAILED] Пользователь с email "${email}" не найден в базе данных.`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`[LOGIN INFO] Пользователь "${email}" найден. Проверка пароля...`);

        // Проверяем пароль
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.error(`[LOGIN FAILED] Пароль для пользователя "${email}" не совпадает.`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log(`[LOGIN SUCCESS] Пароль для "${email}" верный. Создание токена.`);

        // Создаем JWT токен
        const payload = {
            id: user.id,
            role: user.role,
            userId: user.id // Добавляем userId для совместимости с токенами
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Logged in successfully',
            token: token,
            user: {
                id: user.id,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Ошибка при входе пользователя:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Внутренний эндпоинт для отката регистрации
app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleteResult = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found for deletion' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.listen(port, () => {
  console.log(`Users service listening at http://localhost:${port}`);
});
