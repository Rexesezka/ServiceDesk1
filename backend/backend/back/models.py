from django.db import models
from django.contrib.auth.hashers import make_password, check_password
import os


def user_avatar_path(instance, filename):
    """Генерирует путь для сохранения аватара пользователя"""
    # Используем ID пользователя для создания папки
    # Если ID еще не существует, используем временное имя
    user_id = instance.id_user if instance.id_user else 'temp'
    # Получаем расширение файла
    ext = filename.split('.')[-1]
    # Создаем имя файла: avatar.ext
    filename = f'avatar.{ext}'
    return f'users/{user_id}/{filename}'


class Office(models.Model):
    id_office = models.AutoField(primary_key=True)
    parent_office = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='sub_offices',
        verbose_name='ID_офиса_родителя'
    )
    name = models.CharField(max_length=255, verbose_name='Наименование подразделения')
    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    level = models.IntegerField()
    supervisor = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='offices_supervised',
        verbose_name='FirstKey Руководитель'
    )

    def __str__(self):
        return self.name


class User(models.Model):
    id_user = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True, verbose_name='Логин')
    email = models.EmailField(unique=True, null=True, blank=True, verbose_name='Email')
    password = models.CharField(max_length=128, null=True, blank=True, verbose_name='Пароль')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50)
    position = models.CharField(max_length=100)
    role = models.CharField(max_length=50)
    desk_number = models.CharField(max_length=50, null=True, blank=True, verbose_name='Номер стола')
    birth_date = models.DateField(null=True, blank=True, verbose_name='Дата рождения')
    avatar = models.ImageField(upload_to=user_avatar_path, null=True, blank=True, verbose_name='Аватар')
    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name='users',
        verbose_name='FK Офис'
    )
    supervisor = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinates',
        verbose_name='FK руководитель'
    )

    def set_password(self, raw_password):
        """Хеширует и сохраняет пароль"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Проверяет пароль"""
        return check_password(raw_password, self.password)

    def __str__(self):
        return f"{self.last_name} {self.first_name}"


class Table(models.Model):
    id_table = models.AutoField(primary_key=True)
    expense_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Status(models.Model):
    id_status = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class TypeOfFailure(models.Model):
    id_type = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return self.name


class Comment(models.Model):
    id_comment = models.AutoField(primary_key=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Request(models.Model):
    id_request = models.AutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='requests',
        verbose_name='FK Пользователь'
    )
    failure_type = models.ForeignKey(
        TypeOfFailure,
        on_delete=models.CASCADE,
        verbose_name='Тип поломки'
    )
    urgency = models.CharField(max_length=50)
    description = models.TextField()
    attachments = models.FileField(upload_to='attachments/', null=True, blank=True)
    office_address = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        verbose_name='FK Адрес офиса'
    )
    office_location = models.CharField(max_length=255)  # внутри офиса
    employee_location = models.CharField(max_length=255)  # место сотрудника

    expense = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        verbose_name='FK таблица затрат'
    )
    comments = models.ManyToManyField(Comment, blank=True)
    performer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_requests',
        verbose_name='FK Исполнитель'
    )
    status = models.ForeignKey(
        Status,
        on_delete=models.CASCADE,
        verbose_name='Статус'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    due_time = models.DateTimeField(null=True, blank=True)  # Время на выполнение

    def __str__(self):
        return f"Заявка {self.id_request}"


class RequestAttachment(models.Model):
    """Модель для хранения вложений к заявке"""
    id_attachment = models.AutoField(primary_key=True)
    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name='request_attachments',
        verbose_name='FK Заявка'
    )
    file = models.FileField(upload_to='attachments/', verbose_name='Файл')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Вложение {self.id_attachment} для заявки {self.request.id_request}"


class Notification(models.Model):
    id_notification = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='FK Пользователь'
    )
    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name='request_notifications',
        null=True,
        blank=True,
        verbose_name='FK Заявка'
    )
    message = models.TextField(verbose_name='Текст уведомления')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Уведомление для {self.user} - {self.message[:50]}"


class Load(models.Model):
    id_load = models.AutoField(primary_key=True)
    staff = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='loads',
        verbose_name='FK Сотрудник АХО'
    )
    current_tasks_count = models.IntegerField()
    current_tasks = models.TextField()
    urgency = models.CharField(max_length=50)
