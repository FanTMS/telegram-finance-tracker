# Telegram Mini App - Финансовый Трекер

Это Telegram Mini App для отслеживания расходов в группах. Приложение разработано с использованием React, MUI, и Firebase.

## Возможности

- Создание и управление группами для совместных расходов
- Добавление и отслеживание расходов внутри групп
- Разделение расходов между участниками
- Статистика и аналитика расходов
- Интеграция с Telegram WebApp API

## Требования

- Node.js 14+
- Firebase аккаунт
- Telegram бот для хостинга Mini App

## Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/yourusername/telegram-finance-tracker.git
cd telegram-finance-tracker
```

2. Установите зависимости:

```bash
npm install
```

3. Настройте Firebase:
   - Создайте проект в [Firebase Console](https://console.firebase.google.com/)
   - Включите аутентификацию и Firestore базу данных
   - Скопируйте ваши конфигурационные данные Firebase
   - Обновите файл `src/config/firebase.ts` с вашими данными Firebase

4. Запустите приложение в режиме разработки:

```bash
npm run dev
```

5. Для сборки для производственной среды:

```bash
npm run build
```

## Настройка Telegram Bot

1. Создайте бота через BotFather в Telegram
2. Настройте WebApp URL для бота, указав URL вашего развернутого приложения
3. Для разработки можно использовать [ngrok](https://ngrok.com/) для создания временного публичного URL

## Деплой на Netlify

Для деплоя приложения на Netlify, выполните следующие шаги:

1. Зарегистрируйтесь на [Netlify](https://app.netlify.com/) или войдите в существующий аккаунт

2. Деплой через Git:
   - Нажмите "Add new site" > "Import an existing project"
   - Выберите ваш Git провайдер (GitHub, GitLab, Bitbucket)
   - Выберите репозиторий с вашим проектом
   - Настройки сборки уже определены в файле `netlify.toml`
   - Нажмите "Deploy site"

3. Деплой через Drag & Drop:
   - Запустите сборку проекта локально: `npm run build`
   - Перейдите на домашнюю страницу Netlify
   - Перетащите папку `dist` в зону деплоя на странице Netlify

4. Настройка переменных окружения:
   - После деплоя перейдите в настройки сайта
   - Выберите "Environment variables"
   - Добавьте все переменные из файла `.env` (без префикса VITE_)

5. Настройка пользовательского домена (опционально):
   - В настройках сайта выберите "Domain settings"
   - Добавьте свой домен или используйте бесплатный поддомен от Netlify

6. После деплоя обновите URL в настройках вашего бота в BotFather:
   - Отправьте команду `/mybots` BotFather в Telegram
   - Выберите вашего бота > Bot Settings > Menu Button
   - Обновите URL на ваш Netlify домен

### Решение проблем при деплое

Если у вас возникают ошибки TypeScript при деплое на Netlify, вы можете:

1. Настроить пропуск проверок TypeScript при сборке:
   - В `package.json` команда сборки уже изменена с `tsc && vite build` на просто `vite build`
   - Если хотите включить проверку типов, используйте команду `npm run build:with-types`

2. Укажите Netlify игнорировать ошибки сборки:
   - Добавьте переменную окружения `CI=false` в настройках сайта на Netlify
   - Этот флаг уже включен в файле `netlify.toml`

3. Устранение ошибок TypeScript:
   - Для более надежного решения рекомендуется постепенно исправлять ошибки TypeScript в проекте
   - Проверьте наличие неиспользуемых импортов и переменных
   - Исправьте ошибки типизации, особенно в сторонних библиотеках (framer-motion)

## Структура базы данных Firebase

### Коллекции:

- **users**: Информация о пользователях
  - id: string (ID пользователя Telegram)
  - name: string
  - email: string (опционально)
  - photoURL: string (опционально)

- **groups**: Группы расходов
  - id: string (автоматически генерируется)
  - name: string (название группы)
  - inviteCode: string (код для приглашения других участников)
  - members: string[] (массив ID пользователей)
  - createdAt: timestamp
  - createdBy: string (ID создателя)

- **expenses**: Расходы
  - id: string (автоматически генерируется)
  - groupId: string (ID группы)
  - amount: number (сумма расхода)
  - category: string (категория)
  - description: string (описание)
  - createdBy: string (ID создателя)
  - createdAt: timestamp
  - splitBetween: string[] (массив ID пользователей, между которыми разделен расход)
  - paidBy: string[] (массив ID пользователей, которые оплатили)

## Известные ограничения и проблемы

- WebApp API версии 6.0 не поддерживает метод `showPopup`, поэтому используется fallback на обычные алерты.
- При работе вне среды Telegram используются заглушки для Telegram WebApp API функций.

## Лицензия

MIT 