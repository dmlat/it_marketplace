# 🎮 Справочник команд ITM Marketplace

## 🟢 РАЗРАБОТКА (Development)

### Ежедневные команды:
```bash
# Запуск проекта с Hot Reload
npm run dev

# Остановка проекта
npm run stop

# Проверка статуса контейнеров
npm run status
```

### При изменениях:
```bash
# Добавили npm пакет в любой сервис
npm run dev:build

# Изменили db/init.sql (структуру БД)
npm run dev:fresh

# Изменили код React/Node.js
# ничего не нужно - Hot Reload сработает автоматически
```

### Отладка:
```bash
# Посмотреть логи всех сервисов
npm run logs:services

# Логи конкретного сервиса
npm run logs:users
npm run logs:db

# Перезапустить конкретный сервис
npm run restart:users
```

---

## 🔴 ПРОДАКШЕН (Production)

### Первый деплой:
```bash
# На сервере:
git clone <your-repo>
cd ITM_app
cp ReadMe/env_example.md .env
# Настроить .env для продакшена
docker-compose up -d --build
```

### Обновления кода:
```bash
# На сервере:
git pull
docker-compose up -d --build
```

### Изменения БД (ОСТОРОЖНО!):
```bash
# На сервере:
# 1. Backup
docker exec itm-postgres-db pg_dump -U user itm_db > backup_$(date +%Y%m%d).sql

# 2. Применить изменения
docker-compose down -v  # ⚠️ УДАЛИТ ДАННЫЕ!
docker-compose up -d --build

# Лучше использовать миграции вместо пересоздания
```

### Управление:
```bash
# Остановить
docker-compose down

# Статус
docker-compose ps

# Логи
docker-compose logs -f

# Backup БД
docker exec itm-postgres-db pg_dump -U user itm_db > backup.sql
```

---

## 📋 СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ

### Сценарий 1: "Начинаю работу"
```bash
npm run dev
# Открыть http://localhost:3000
```

### Сценарий 2: "Изменил CSS в React"
```bash
# Ничего не нужно!
# Изменения появятся в браузере автоматически
```

### Сценарий 3: "Добавил npm пакет"
```bash
# В разработке:
npm run dev:build

# В продакшене (при деплое):
docker-compose up -d --build
```

### Сценарий 4: "Изменил структуру БД"
```bash
# 1. Изменить db/init.sql
# 2. В разработке:
npm run dev:fresh

# 3. Протестировать
# 4. В продакшене (при деплое):
# Сначала backup, потом осторожное обновление
```

### Сценарий 5: "Создал новый микросервис"
```bash
# 1. Создать services/new-service/
# 2. Добавить в docker-compose.yml
# 3. Добавить в docker-compose.dev.yml  
# 4. Обновить package.json
# 5. npm run dev:build
```

### Сценарий 6: "Что-то сломалось"
```bash
# Посмотреть логи
npm run logs:services

# Перезапустить всё
npm run stop
npm run dev

# Если совсем плохо
npm run dev:fresh
```

### Сценарий 7: "Готов к деплою"
```bash
# 1. Убедиться что работает локально
npm run dev

# 2. Протестировать production сборку локально
docker-compose up -d

# 3. Если всё ОК, деплоить на сервер
# На сервере:
git pull && docker-compose up -d --build
```

---

## ⚠️ ВАЖНЫЕ ПРЕДУПРЕЖДЕНИЯ

### 🚨 ВСЕГДА делать backup перед изменением БД в продакшене:
```bash
docker exec itm-postgres-db pg_dump -U user itm_db > backup_$(date +%Y%m%d).sql
```

### 🚨 НЕ используйте `dev:fresh` в продакшене:
```bash
# ❌ НЕПРАВИЛЬНО в продакшене:
npm run dev:fresh  # Удалит все данные!

# ✅ ПРАВИЛЬНО в продакшене:
# Осторожные миграции с backup
```

### 🚨 Проверяйте оба окружения после изменений:
```bash
# После изменения docker-compose файлов:
# 1. Протестировать разработку
npm run dev

# 2. Протестировать продакшен локально  
docker-compose up -d

# 3. Только потом деплоить
```

---

## 🎯 Быстрая справка

| Задача | Разработка | Продакшен |
|--------|------------|-----------|
| **Запуск** | `npm run dev` | `docker-compose up -d` |
| **Остановка** | `npm run stop` | `docker-compose down` |
| **Обновление кода** | Автоматически | `git pull && docker-compose up -d --build` |
| **Новый пакет** | `npm run dev:build` | `docker-compose up -d --build` |
| **Изменение БД** | `npm run dev:fresh` | Backup + миграция |
| **Логи** | `npm run logs:services` | `docker-compose logs -f` |

---

## 💡 Pro Tips

### Для ускорения разработки:
```bash
# Алиасы в ~/.bashrc или ~/.zshrc:
alias dev="npm run dev"
alias devf="npm run dev:fresh"
alias devb="npm run dev:build"
alias logs="npm run logs:services"
```

### Для продакшена:
```bash
# Создать скрипт deploy.sh:
#!/bin/bash
git pull
docker-compose up -d --build
docker-compose ps
```
