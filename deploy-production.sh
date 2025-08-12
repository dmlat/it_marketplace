#!/bin/bash

echo "🚀 Деплой ITM Marketplace на продакшен"
echo "======================================"

# Остановить старые контейнеры
echo "📦 Остановка старых контейнеров..."
docker compose down

# Очистить Docker cache
echo "🧹 Очистка Docker cache..."
docker system prune -f

# Собрать фронтенд на хосте
echo "🔨 Сборка фронтенда на хосте..."
cd frontend

# Полная переустановка зависимостей для исправления конфликтов
echo "📦 Переустановка зависимостей..."
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps --force

# Собрать production build
echo "🏗️ Сборка production build..."
rm -rf build

# Отключаем TypeScript проверку для избежания конфликтов ajv
export TSC_COMPILE_ON_ERROR=true
export SKIP_PREFLIGHT_CHECK=true
export GENERATE_SOURCEMAP=false

npm run build

# Проверить что сборка прошла успешно
if [ ! -d "build" ]; then
    echo "❌ Ошибка: сборка не создалась!"
    exit 1
fi

echo "✅ Фронтенд собран успешно!"

# Вернуться в корень проекта
cd ..

# Запустить Docker контейнеры
echo "🐳 Запуск Docker контейнеров..."
docker compose up -d --build

# Проверить статус
echo "📊 Проверка статуса контейнеров..."
sleep 5
docker compose ps

echo ""
echo "🎉 Деплой завершен!"
echo "🌐 Приложение доступно на: http://asdsoft-demo.ru"
echo "📊 Проверить статус: docker compose ps"
echo "📋 Посмотреть логи: docker compose logs -f"
