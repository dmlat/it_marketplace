# 🚀 Инструкция по деплою ITM Marketplace на продакшен

## 📋 Что было исправлено:

### 1. **Фронтенд**:
- ✅ Создан production Dockerfile с multi-stage build
- ✅ Добавлен nginx для статической раздачи
- ✅ Исправлены конфликты зависимостей React (19 → 18)
- ✅ Добавлено проксирование API запросов

### 2. **Docker Compose**:
- ✅ Убраны volume mapping для продакшена
- ✅ Изменены команды с `npm run dev` на `npm start`
- ✅ Установлен `NODE_ENV=production`
- ✅ Добавлена политика restart `unless-stopped`

### 3. **Порты**:
- ✅ Фронтенд теперь на порту 80 (стандартный HTTP)
- ✅ API сервисы остались на своих портах

## 🔧 Команды для деплоя на сервере:

### Шаг 1: Подготовка
```bash
# Остановить старые контейнеры
docker compose down

# Удалить старые образы (опционально)
docker system prune -a

# Обновить код
git pull
```

> **Важно**: На новых серверах используется `docker compose` (без дефиса) вместо `docker compose`

### Шаг 2: Создать .env файл
```bash
# Создать .env для продакшена
cat > .env << EOF
# PostgreSQL Settings
POSTGRES_USER=itm_user
POSTGRES_PASSWORD=your_super_secure_password_here
POSTGRES_DB=itm_production_db

# JWT Settings  
JWT_SECRET=your_super_secret_jwt_key_for_production_minimum_32_characters

# Node.js Environment
NODE_ENV=production
EOF
```

### Шаг 3: Установить Node.js и обновить зависимости фронтенда
```bash
# Установить Node.js и npm (если не установлены)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверить версии
node --version
npm --version

# Обновить зависимости фронтенда
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
cd ..
```

### Шаг 4: Запустить продакшен
```bash
# Собрать и запустить все сервисы
docker compose up -d --build

# Проверить статус
docker compose ps

# Посмотреть логи
docker compose logs -f
```

## 🌐 Доступ к приложению:

- **Основное приложение**: http://asdsoft-demo.ru
- **API Users**: http://asdsoft-demo.ru/api/users/
- **API Companies**: http://asdsoft-demo.ru/api/companies/  
- **API Operator**: http://asdsoft-demo.ru/api/operator/

## 🔍 Диагностика проблем:

### Если фронтенд не загружается:
```bash
# Проверить статус nginx контейнера
docker compose logs frontend

# Проверить доступность на порту 80
curl -I http://localhost
```

### Если API не работает:
```bash
# Проверить логи конкретного сервиса
docker compose logs users-service
docker compose logs companies-service
docker compose logs operator-service

# Проверить подключение к БД
docker compose logs postgres-db
```

### Если проблемы с БД:
```bash
# Войти в контейнер БД
docker exec -it itm-postgres-db psql -U itm_user -d itm_production_db

# Проверить таблицы
\dt
```

## 🔒 Настройка SSL (HTTPS):

### Вариант 1: Certbot + Let's Encrypt
```bash
# Установить certbot
sudo apt install certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d asdsoft-demo.ru -d www.asdsoft-demo.ru

# Автообновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Вариант 2: Cloudflare (рекомендуется)
1. Добавить домен в Cloudflare
2. Настроить DNS записи
3. Включить SSL/TLS в режиме "Full"

## 📊 Мониторинг:

### Проверка здоровья сервисов:
```bash
# Статус всех контейнеров
docker compose ps

# Использование ресурсов
docker stats

# Логи в реальном времени
docker compose logs -f --tail=100
```

### Backup базы данных:
```bash
# Создать backup
docker exec itm-postgres-db pg_dump -U itm_user itm_production_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из backup
docker exec -i itm-postgres-db psql -U itm_user -d itm_production_db < backup_file.sql
```

## ⚠️ Важные замечания:

1. **Замените пароли** в .env файле на сильные
2. **Настройте firewall** - открыть только порты 80, 443, 22
3. **Настройте регулярные backup** базы данных
4. **Мониторьте логи** на предмет ошибок
5. **Обновляйте зависимости** регулярно для безопасности

## 🎯 Быстрый рестарт после изменений:

```bash
# При изменениях в коде
git pull && docker compose up -d --build

# При изменениях в БД (ОСТОРОЖНО!)
docker compose down
docker volume rm itm_app_postgres-data  # Удалит данные!
docker compose up -d --build
```
