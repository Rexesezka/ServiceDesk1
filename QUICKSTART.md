# 🚀 Быстрый старт

Краткая инструкция для быстрого запуска проекта.

## Шаг 1: Клонирование и установка зависимостей

```bash
# Клонируйте репозиторий
git clone <url-репозитория>
cd ServiceDesk

# Бэкенд
cd backend/backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows: PowerShell
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Фронтенд
cd ../../frontend
npm install
```

## Шаг 2: Настройка базы данных

1. Установите и запустите PostgreSQL
2. Создайте базу данных:
   ```sql
   CREATE DATABASE your_database_name;
   ```
3. Отредактируйте `backend/backend/backend/settings.py`:
   - Укажите имя базы данных
   - Укажите пользователя и пароль PostgreSQL

## Шаг 3: Применение миграций

```bash
cd backend/backend
python manage.py migrate
```

## Шаг 4: Создание тестового пользователя

### Вариант 1: Через Python shell

```bash
python manage.py shell
```

```python
from back.models import User, Office

# Создайте офис
office = Office.objects.create(
    name='Главный офис',
    region='Свердловская область',
    city='Екатеринбург',
    address='г. Екатеринбург, ул. Мира, д. 19',
    level=1
)

# Создайте пользователя
user = User(
    email='user@example.com',
    username='testuser',
    first_name='Иван',
    last_name='Иванов',
    middle_name='Иванович',
    position='Разработчик',
    role='employee',
    office=office,
    desk_number='19',
    birth_date='2000-01-01'
)
user.set_password('password123')
user.save()
```

### Вариант 2: Через админку

```bash
python manage.py createsuperuser
# Запустите сервер и откройте http://127.0.0.1:8000/admin
```

## Шаг 5: Запуск

**Терминал 1 (Бэкенд):**
```bash
cd backend/backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

**Терминал 2 (Фронтенд):**
```bash
cd frontend
npm run dev
```

## Готово! 🎉

- Фронтенд: http://localhost:3000
- Бэкенд: http://127.0.0.1:8000
- Админка: http://127.0.0.1:8000/admin

**Тестовые данные для входа:**
- Email: `user@example.com`
- Password: `password123`

---

📖 Подробная документация в [README.md](README.md)

