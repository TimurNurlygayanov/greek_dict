# Настройка Google OAuth авторизации

## Шаг 1: Получение Google Client ID

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API:
   - Перейдите в "APIs & Services" → "Library"
   - Найдите "Google+ API" и включите его
4. Создайте OAuth 2.0 Client ID:
   - Перейдите в "APIs & Services" → "Credentials"
   - Нажмите "Create Credentials" → "OAuth client ID"
   - Выберите "Web application"
   - Добавьте Authorized JavaScript origins:
     - `http://localhost:5173` (для разработки)
     - `https://your-domain.onrender.com` (для продакшена)
   - Добавьте Authorized redirect URIs:
     - `http://localhost:5173` (для разработки)
     - `https://your-domain.onrender.com` (для продакшена)
5. Скопируйте Client ID (выглядит как `123456789-abcdefg.apps.googleusercontent.com`)

## Шаг 2: Установка зависимостей

```bash
npm install @react-oauth/google
```

## Шаг 3: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```
VITE_GOOGLE_CLIENT_ID=ваш_client_id_здесь
```

## Шаг 4: Обновление кода

Код уже обновлен для работы с Google OAuth. Просто добавьте Client ID в `.env` файл.

## Шаг 5: Проверка

1. Запустите приложение: `npm run dev`
2. Перейдите на страницу Flashcards или Progress
3. Нажмите "Sign in with Google"
4. Выберите аккаунт Google
5. После авторизации ваш userId будет сохранен и использован для синхронизации данных

## Важные замечания

- Client ID должен быть добавлен в `.env` файл
- Не коммитьте `.env` файл в Git (он уже в `.gitignore`)
- Для продакшена на Render.com добавьте переменную окружения `VITE_GOOGLE_CLIENT_ID` в настройках сервиса
- После авторизации userId будет Google ID пользователя вместо временного `user_...`

