"""
Пример файла настроек для базы данных.
Скопируйте этот файл и переименуйте в settings.py, затем заполните своими данными.
Или отредактируйте существующий settings.py напрямую.
"""

# Настройки базы данных PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_database_name',      # Замените на имя вашей базы данных
        'USER': 'your_username',            # Замените на имя пользователя PostgreSQL
        'PASSWORD': 'your_password',        # Замените на пароль PostgreSQL
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Пример настройки SECRET_KEY (в production используйте переменные окружения!)
# SECRET_KEY = 'your-secret-key-here'

