# Особенности и частые ошибки при разработке

Этот документ служит базой знаний о специфических проблемах и их решениях, с которыми мы столкнулись в ходе разработки.

## 🚀 Быстрый старт для новых разработчиков

### Требования:
- **Node.js** 20+ 
- **Docker Desktop** (обязательно запущен!)
- **Git**

### Запуск проекта с нуля:
1. Клонировать репозиторий и перейти в папку проекта
2. Создать файл `.env` в корне проекта (см. `ReadMe/env_example.md`)
3. Выполнить команду:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```
4. Открыть:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000

### Что запускается одной командой:
- 🐳 **PostgreSQL** база данных (порт 5434)
- 🔧 **NestJS Backend** - API с аутентификацией, Prisma ORM (порт 8000)
- ⚛️ **Next.js Frontend** - основное приложение с SSR (порт 3000)

### Остановка:
```bash
docker-compose -f docker-compose.dev.yml down
```

---

## 🐳 Docker и Контейнеризация

### 1. Ошибка: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

- **Симптомы**: Docker-команды не выполняются, система не может найти Docker.
- **Причина**: Не запущен Docker Desktop.
- **Решение**: **Запустить приложение Docker Desktop** и дождаться, пока его иконка в трее покажет стабильный статус (кит не должен "плавать").

---

### 2. Ошибка: `Ports are not available` или `bind: An attempt was made to access a socket in a way forbidden by its access permissions`

- **Симптомы**: Docker не может запустить PostgreSQL на порту 5434, выдает ошибку доступа к порту.
- **Причина**: Windows динамически резервирует диапазоны портов для Hyper-V и других системных служб. После перезагрузки порт может попасть в заблокированный диапазон.
- **Диагностика**: Проверить заблокированные диапазоны командой `netsh interface ipv4 show excludedportrange protocol=tcp`
- **Решение**: 
  1. **Быстрое**: Изменить порт в `docker-compose.dev.yml` с `"5434:5432"` на свободный (например, `"5500:5432"`)
  2. **Перезапустить Docker Desktop** - иногда это освобождает "залипший" порт
  3. **Кардинальное**: Изменить диапазон динамических портов Windows:
     ```cmd
     # Запустить от администратора:
     netsh int ipv4 set dynamic tcp start=49152 num=16384
     netsh int ipv6 set dynamic tcp start=49152 num=16384
     # Перезагрузить компьютер
     ```

---

### 3. Ошибка: `Cannot find module '/usr/src/app/dist/main'` в NestJS контейнере

- **Симптомы**: Backend контейнер перезапускается в бесконечном цикле с ошибкой поиска `main.js`.
- **Причина**: Отсутствует файл `src/main.ts` - точка входа для NestJS приложения.
- **Решение**: Создать файл `backend/src/main.ts`:
  ```typescript
  import { NestFactory } from '@nestjs/core';
  import { AppModule } from './app.module';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Включаем CORS для фронтенда
    app.enableCors({
      origin: 'http://localhost:3000',
      credentials: true,
    });
    
    await app.listen(8000);
    console.log('🚀 Backend server is running on http://localhost:8000');
  }

  bootstrap();
  ```

---

### 4. Ошибка: `Error loading shared library libssl.so.1.1: No such file or directory` с Prisma

- **Симптомы**: NestJS приложение запускается, но падает при инициализации Prisma с ошибкой SSL библиотек.
- **Причина**: Alpine Linux в Docker не содержит необходимых SSL библиотек для Prisma Engine.
- **Решение**: Добавить в `backend/Dockerfile.dev` установку OpenSSL:
  ```dockerfile
  FROM node:20-alpine
  
  # Устанавливаем системные зависимости для Prisma
  RUN apk add --no-cache openssl
  
  # ... остальная часть Dockerfile
  ```

---

### 5. Ошибка: `@prisma/client did not initialize yet. Please run "prisma generate"`

- **Симптомы**: NestJS запускается, но падает при попытке использовать Prisma Client.
- **Причина**: Prisma Client не был сгенерирован или сгенерирован до копирования `schema.prisma`.
- **Решение**: В `backend/Dockerfile.dev` выполнять `prisma generate` **после** копирования всех файлов:
  ```dockerfile
  # Копируем весь исходный код (включая prisma/schema.prisma)
  COPY . .
  
  # Генерируем Prisma Client ПОСЛЕ копирования schema.prisma
  RUN npx prisma generate
  
  # Собираем проект
  RUN npm run build
  ```

---

### 6. Ошибка: Docker кэширует старые зависимости после изменения `package.json`

- **Симптомы**: После добавления новой зависимости в `package.json` и перезапуска контейнера, модуль все равно не найден.
- **Причина**: Docker агрессивно кэширует слои образа.
- **Решение**: 
  1. **Принудительная пересборка**: `docker-compose -f docker-compose.dev.yml up --build`
  2. **Очистка кэша**: `docker system prune -f`
  3. **Радикальная очистка**: 
     ```bash
     docker-compose -f docker-compose.dev.yml down
     docker system prune -a -f
     docker-compose -f docker-compose.dev.yml up --build
     ```

---

## 🔧 NestJS Backend

### 7. "Hello World!" на `localhost:8000` - это нормально!

- **Симптомы**: При переходе на `http://localhost:8000` видите "Hello World!".
- **Это нормально**: Это стандартная заглушка NestJS в `app.service.ts`.
- **Реальные API эндпоинты**:
  - `POST /auth/register` - регистрация
  - `POST /auth/login` - авторизация  
  - `GET /companies` - список компаний (требует JWT токен)

---

### 8. Ошибка CORS при запросах с Next.js на NestJS

- **Симптомы**: Браузер блокирует запросы с `localhost:3000` на `localhost:8000` с ошибкой CORS.
- **Решение**: В `backend/src/main.ts` добавить настройку CORS:
  ```typescript
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  ```

---

### 9. Ошибка: `secretOrPrivateKey must have a value` при JWT

- **Симптомы**: NestJS падает с ошибкой JWT при попытке создания токена.
- **Причина**: Переменная окружения `JWT_SECRET` не передается в Docker контейнер.
- **Решение**: Убедиться, что в `.env` файле есть `JWT_SECRET` и он правильно прописан в `docker-compose.dev.yml`:
  ```yaml
  environment:
    JWT_SECRET: ${JWT_SECRET}
  ```

---

## ⚛️ Next.js Frontend

### 10. Ошибка: `Unexpected token '<', ... is not valid JSON` на фронтенде

- **Симптомы**: React-приложение падает с ошибкой парсинга JSON, в тексте ошибки виден HTML-код.
- **Причина**: Фронтенд ожидает JSON от бэкенда, но получает HTML-страницу ошибки (например, 404 или 500).
- **Решение**: Улучшить обработку `fetch`-запросов:
  ```javascript
  try {
    const response = await fetch('/api/endpoint');
    
    if (!response.ok) {
      let errorMsg = `Ошибка сервера: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // Тело ответа - не JSON, используем стандартное сообщение
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    // ... обработка успешного ответа
  } catch (err) {
    console.error('Ошибка API:', err.message);
  }
  ```

---

### 11. Фантомные ошибки компиляции после рефакторинга

- **Симптомы**: После перемещения файлов Next.js продолжает сообщать об ошибках в старых, уже удаленных файлах.
- **Причина**: Кэш Webpack Dev Server "запомнил" старую структуру файлов.
- **Решение**: 
  1. Остановить dev-сервер (`Ctrl + C`)
  2. Удалить `.next` папку: `rm -rf frontend/.next`
  3. Запустить снова: `docker-compose -f docker-compose.dev.yml up`

---

## 🗄️ База данных и Prisma

### 12. Ошибка: `404 Not Found` при поиске в API, хотя данные есть в БД

- **Симптомы**: API возвращает 404 при запросе `GET /api/companies/:id`, хотя запись существует.
- **Причина**: Несоответствие типов данных. Параметры из URL приходят как строки, но в БД поле может быть числовым.
- **Решение**: Приводить параметры к нужному типу:
  ```typescript
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID должен быть числом');
    }
    
    return this.companiesService.findOne(numericId);
  }
  ```

---

### 13. Данные не обновляются после действия (проблема кеширования браузера)

- **Симптомы**: После добавления/изменения данных через API, список на странице не обновляется.
- **Причина**: Браузер кэширует GET-запросы.
- **Решение**: Для критически важных запросов отключать кеширование:
  ```javascript
  fetch('/api/companies', { cache: 'no-store' });
  ```

---

## 📁 Принцип "Без хвостов": Проверка после рефакторинга

После любого крупного рефакторинга крайне важно не оставлять "хвостов" — устаревших ссылок на старый код.

### Критически важные файлы для проверки:

1. **`docker-compose.dev.yml`**: Имена сервисов, порты, переменные окружения
2. **`backend/prisma/schema.prisma`**: Схема базы данных должна быть актуальной
3. **`ReadMe/` документация**: Должна отражать текущую архитектуру
4. **`backend/src/` и `frontend/src/`**: Проверить импорты и пути к файлам
5. **Конфигурационные файлы** (`env_example.md`, `package.json`): Переменные окружения и скрипты

**Совет**: Используйте глобальный поиск по проекту (grep/Ctrl+Shift+F) по старому названию сущности, которую вы меняете — это быстрый способ найти все "хвосты".

---

## 🎯 Hot Reload и разработка

### 14. Hot Reload работает только для исходного кода

- **Особенность**: В нашей Docker конфигурации hot reload настроен только для папок `src` и `prisma`.
- **Это означает**: 
  - ✅ Изменения в `backend/src/` и `frontend/src/` применяются мгновенно
  - ❌ Изменения в `package.json`, `Dockerfile`, `docker-compose.yml` требуют пересборки
- **Для пересборки**: `docker-compose -f docker-compose.dev.yml up --build`

---

### 15. Проверка работоспособности системы

После запуска проекта убедитесь, что все работает:

1. **PostgreSQL**: `docker logs itm-postgres-db-dev` → должно быть `database system is ready to accept connections`
2. **Backend**: `docker logs itm-backend-dev` → должно быть `🚀 Backend server is running on http://localhost:8000`
3. **Frontend**: `docker logs itm-frontend-dev` → должно быть `✓ Ready in X.Xs`

**Проверка API**:
- `http://localhost:8000` → "Hello World!" (это нормально)
- `http://localhost:3000` → Next.js приложение

---

*Этот документ обновляется по мере обнаружения новых проблем и их решений.*