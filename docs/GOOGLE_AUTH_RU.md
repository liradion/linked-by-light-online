# Google Login v13 — Связанные светом

## Что реализовано

- Необязательная кнопка **G Войти** на ПК и iPhone: гостевая игра и коды комнат продолжают работать без регистрации.
- Google OAuth через **Supabase Auth** с PKCE (S256): браузер переходит на Supabase/Google, сервер принимает одноразовый код и проверяет пользователя через Supabase.
- Сессия хранится только в зашифрованной **HttpOnly, Secure, SameSite=Lax** cookie. Google Client Secret и Supabase Secret Key не публикуются в JavaScript.
- Вкладка аккаунта показывает имя, вход, выход и принудительную синхронизацию.
- Прогресс, дом, костюмы, достижения и открытые уровни связываются с ID Google-пользователя (по серверной проверке Supabase). Используется существующая таблица `linked_light_cloud_saves`, миграция не требуется.
- При первом входе текущий локальный прогресс объединяется с учётной записью. Если на устройстве ранее был другой Google-аккаунт, автоматическое объединение блокируется.
- Поток без сторонних npm-пакетов; существующий сетевой WebSocket и физика не изменены.
- Rate limit для WebSocket-сообщений, создания и входа в комнаты, и API аккаунта.
- CSP запрещает выполнение inline JavaScript; дополнительные HTTP Security Headers.

## Настройки Supabase / Google Cloud

В Google Cloud создайте OAuth Client типа **Web application**.

**Authorized JavaScript origins:** `https://linked-by-light-online.onrender.com`.

**Authorized redirect URIs в Google Cloud:** `https://kogjkrevhnpwroyxpyxi.supabase.co/auth/v1/callback`.

В Supabase → Authentication → Providers → Google включите провайдера и введите Client ID + Client Secret из Google Cloud.

В Supabase → Authentication → URL Configuration:
- Site URL: `https://linked-by-light-online.onrender.com`
- Redirect URLs: `https://linked-by-light-online.onrender.com/` (схема авторизации возвращается с одноразовым параметром `?code=`, который сервер мгновенно обменивает и убирает из адресной строки).

При тестовом режиме Google Auth Platform → Audience добавьте обоих игроков как Test users.

## Настройки Render

Требуются только уже существующие переменные:
```text
SUPABASE_URL=https://kogjkrevhnpwroyxpyxi.supabase.co
SUPABASE_SECRET_KEY=<secret stored only in Render Environment>
```
Дополнительно можно установить `GAME_ORIGIN` (HTTPS-адрес игры) и **`GAME_ACCOUNT_SECRET`** (постоянный криптографический секрет аккаунтов, сохранять при ротации ключа Supabase). Если он не задан, применяется текущий `SUPABASE_SECRET_KEY`: при его ротации старые account-based сохранения без предварительной миграции могут стать недоступны. Не изменяйте `GAME_ACCOUNT_SECRET` после начала использования.

Не публикуйте секреты в чате, фронтенде, GitHub или скриншотах.

## Проверка

1. Сервис `https://linked-by-light-online.onrender.com/api/auth/me` возвращает статус доступности и `authenticated:false` до входа.
2. Откройте игру и нажмите **G Войти → Войти через Google**.
3. Google перенаправит обратно в игру, откроется карточка аккаунта.
4. Сыграйте уровень и нажмите **Сохранить и загрузить**.
5. На другом устройстве войдите **в тот же Google-аккаунт** и откройте карточку — прогресс будет синхронизирован.
6. Нажмите «Выйти» и проверьте, что аккаунт отключился без удаления гостевой комнаты.

Секретный ключ восстановления из старой системы «☁ Облако» остаётся независимым способом резервного копирования. Google Login его не раскрывает.

## Ограничения безопасности

- Не делитесь с другими людьми сеансовыми cookie и секретами Render.
- Вход в Google-аккаунт и копирование прогресса в облако — разные операции, ошибки сохранения выводятся в интерфейсе.
- Для применения OAuth требуется реальный тест на Google Cloud и Safari: автоматические тесты имитируют ответы Supabase, они **не подтверждают** реальный внешний вход.
- На устройстве, которым пользуются несколько человек, для разных аккаунтов используйте разные профили браузера.
