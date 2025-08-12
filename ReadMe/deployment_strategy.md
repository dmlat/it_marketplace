# Стратегия деплоя ITM Marketplace

## 🏗️ Архитектура окружений

### Локальная разработка (Development)
```bash
npm run dev  # Использует docker-compose.dev.yml
```
- **Фронтенд**: Запускается локально (Hot Reload)
- **Бэкенд**: В Docker контейнерах
- **БД**: PostgreSQL в Docker с тестовыми данными

### Продакшен (Production)
```bash
docker-compose up -d  # Использует docker-compose.yml
```
- **Фронтенд**: В Docker контейнере (оптимизированная сборка)
- **Бэкенд**: В Docker контейнерах
- **БД**: PostgreSQL в Docker или внешний сервер

## 📦 Процесс деплоя

### Шаг 1: Подготовка к деплою
```bash
# 1. Создать production .env файл
cp ReadMe/env_example.md .env.production

# 2. Настроить production переменные
# - JWT_SECRET - длинный случайный ключ
# - POSTGRES_PASSWORD - сильный пароль
# - NODE_ENV=production
```

### Шаг 2: Деплой на сервер
```bash
# На сервере (Ubuntu/CentOS):
git clone <your-repo>
cd ITM_app

# Установить Docker и Docker Compose
sudo apt update
sudo apt install docker.io docker-compose

# Запустить в production режиме
docker-compose up -d --build
```

### Шаг 3: Обновления
```bash
# При изменениях в коде:
git pull
docker-compose up -d --build

# При изменениях в БД (init.sql):
docker-compose down -v  # ⚠️ Удалит данные БД!
docker-compose up -d --build
```

## 🔄 Управление изменениями БД

### Проблема: У вас 2 окружения
- **Разработка**: Тестовые данные (можно удалять)
- **Продакшен**: Реальные данные (удалять НЕЛЬЗЯ!)

### Решение: Миграции БД

#### Текущая ситуация (простая):
```sql
-- db/init.sql - создает таблицы с нуля
CREATE TABLE users (...);
CREATE TABLE companies (...);
```

#### Будущее решение (миграции):
```
db/
├── init.sql          # Начальная схема
├── migrations/
│   ├── 001_add_products_table.sql
│   ├── 002_add_orders_table.sql
│   └── 003_modify_users_table.sql
```

### Безопасные изменения БД:

#### ✅ В разработке (можно удалять данные):
```bash
npm run dev:fresh  # Пересоздает БД с нуля
```

#### ⚠️ В продакшене (данные нужно сохранить):
```bash
# 1. Создать backup
docker exec itm-postgres-db pg_dump -U user itm_db > backup.sql

# 2. Применить миграцию
docker exec itm-postgres-db psql -U user -d itm_db -f /path/to/migration.sql

# 3. Проверить что всё работает
```

## 🛠️ Инструменты для деплоя

### Вариант 1: Простой VPS
- **Где**: DigitalOcean, Hetzner, Yandex Cloud
- **Как**: SSH + Docker Compose
- **Плюсы**: Простота, полный контроль
- **Минусы**: Нужно настраивать самому

### Вариант 2: Platform-as-a-Service
- **Где**: Heroku, Railway, Render
- **Как**: Git push для деплоя
- **Плюсы**: Автоматический деплой
- **Минусы**: Меньше контроля, может быть дороже

### Вариант 3: Kubernetes (для будущего)
- **Где**: Google Cloud, AWS, Yandex Cloud
- **Как**: Kubernetes manifests
- **Плюсы**: Масштабируемость, отказоустойчивость
- **Минусы**: Сложность

## 📋 Чеклист перед деплоем

### Безопасность:
- [ ] Сильные пароли в .env.production
- [ ] JWT_SECRET - длинная случайная строка
- [ ] Настроить CORS только для вашего домена
- [ ] Настроить HTTPS (SSL сертификаты)

### Производительность:
- [ ] Оптимизированная сборка React (`npm run build`)
- [ ] Настроить кэширование статических файлов
- [ ] Настроить мониторинг (логи, метрики)

### Надежность:
- [ ] Автоматический backup БД
- [ ] Health checks для всех сервисов
- [ ] Restart policy для контейнеров

## 🔮 Эволюция архитектуры

### Сейчас (MVP):
```
[Пользователь] → [Nginx] → [Docker Compose] → [PostgreSQL]
                              ↓
                    [users-service, companies-service, ...]
```

### В будущем (Scale):
```
[Пользователь] → [Load Balancer] → [Kubernetes Cluster]
                                      ↓
                              [Multiple instances of services]
                                      ↓
                              [Managed PostgreSQL + Redis]
```

## 💡 Практические советы

### Для начала:
1. **Используйте простой VPS** - не усложняйте
2. **Настройте автоматический backup БД** - это критично
3. **Ведите changelog** - записывайте что меняли

### Процесс обновления:
1. **Тестируйте локально** с `npm run dev`
2. **Деплойте в тестовое окружение** (копия продакшена)
3. **Деплойте в продакшен** только после тестов

### Мониторинг:
- Логи: `docker-compose logs -f`
- Статус: `docker-compose ps`
- Ресурсы: `docker stats`
