from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.db.models import Q
import json
import os
from .models import User, Request, TypeOfFailure, Status, Office, Table, Comment, Notification, Load


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """API endpoint для аутентификации пользователя"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        # Проверка входных данных
        if not email or not password:
            return JsonResponse(
                {'error': 'Email и пароль обязательны'},
                status=400
            )

        # Поиск пользователя по email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Неверный email или пароль'},
                status=401
            )

        # Проверка наличия пароля у пользователя
        if not user.password:
            return JsonResponse(
                {'error': 'У пользователя не установлен пароль. Обратитесь к администратору.'},
                status=401
            )

        # Проверка пароля
        if not user.check_password(password):
            return JsonResponse(
                {'error': 'Неверный email или пароль'},
                status=401
            )

        # Форматирование даты рождения
        birth_date_str = ''
        if user.birth_date:
            birth_date_str = user.birth_date.strftime('%d.%m.%Y')

        # Формирование URL аватара
        avatar_url = None
        if user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url)

        # Формирование ответа с данными пользователя
        response_data = {
            'success': True,
            'message': 'Авторизация успешна',
            'user': {
                'id': user.id_user,
                'email': user.email or '',
                'fullName': f"{user.last_name} {user.first_name} {user.middle_name}".strip(),
                'city': user.office.city if user.office else '',
                'officeAddress': user.office.address if user.office else '',
                'position': user.position or '',
                'deskNumber': user.desk_number or '',
                'birthDate': birth_date_str,
                'avatarUrl': avatar_url,
                'role': user.role or ''
            }
        }

        return JsonResponse(response_data)

    except json.JSONDecodeError:
        return JsonResponse(
            {'error': 'Неверный формат данных'},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {'error': 'Ошибка сервера'},
            status=500
        )


@csrf_exempt
@require_http_methods(["GET"])
def get_profile(request, user_id):
    """API endpoint для получения профиля пользователя"""
    try:
        # Поиск пользователя по ID
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Форматирование даты рождения
        birth_date_str = ''
        if user.birth_date:
            birth_date_str = user.birth_date.strftime('%d.%m.%Y')

        # Формирование URL аватара
        avatar_url = None
        if user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url)

        # Формирование ответа с данными пользователя
        response_data = {
            'success': True,
            'user': {
                'id': user.id_user,
                'email': user.email or '',
                'fullName': f"{user.last_name} {user.first_name} {user.middle_name}".strip(),
                'city': user.office.city if user.office else '',
                'officeAddress': user.office.address if user.office else '',
                'position': user.position or '',
                'deskNumber': user.desk_number or '',
                'birthDate': birth_date_str,
                'avatarUrl': avatar_url,
                'role': user.role or ''
            }
        }

        return JsonResponse(response_data)

    except Exception as e:
        return JsonResponse(
            {'error': 'Ошибка сервера'},
            status=500
        )


@csrf_exempt
@require_http_methods(["POST"])
def upload_avatar(request, user_id):
    """API endpoint для загрузки аватара пользователя"""
    try:
        # Поиск пользователя по ID
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Проверка наличия файла в запросе
        if 'avatar' not in request.FILES:
            return JsonResponse(
                {'error': 'Файл не был загружен'},
                status=400
            )

        avatar_file = request.FILES['avatar']

        # Проверка типа файла
        if not avatar_file.content_type.startswith('image/'):
            return JsonResponse(
                {'error': 'Файл должен быть изображением'},
                status=400
            )

        # Проверка размера файла (максимум 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return JsonResponse(
                {'error': 'Размер файла не должен превышать 5MB'},
                status=400
            )

        # Удаляем старый аватар, если он существует
        if user.avatar:
            old_avatar_path = user.avatar.path
            if os.path.exists(old_avatar_path):
                try:
                    os.remove(old_avatar_path)
                except Exception:
                    pass  # Игнорируем ошибки при удалении старого файла

        # Сохраняем новый аватар
        user.avatar = avatar_file
        user.save()

        # Формируем URL аватара
        avatar_url = request.build_absolute_uri(user.avatar.url) if user.avatar else None

        return JsonResponse({
            'success': True,
            'message': 'Аватар успешно загружен',
            'avatarUrl': avatar_url
        })

    except Exception as e:
            return JsonResponse(
                {'error': f'Ошибка сервера: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET"])
def get_users(request):
    """API endpoint для получения списка пользователей"""
    try:
        # Получаем параметр role из запроса (если указан)
        role_filter = request.GET.get('role', None)
        
        # Получаем пользователей с фильтрацией по роли, если указан
        if role_filter:
            # Фильтруем по роли (case-insensitive)
            users = User.objects.filter(
                role__iexact=role_filter
            ).order_by('last_name', 'first_name')
        else:
            # Получаем всех пользователей
            users = User.objects.all().order_by('last_name', 'first_name')
        
        # Формируем список пользователей
        users_list = []
        for user in users:
            users_list.append({
                'id': user.id_user,
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
                'middle_name': user.middle_name or '',
                'username': user.username or '',
                'role': user.role or '',
            })
        
        return JsonResponse({
            'success': True,
            'users': users_list
        })
        
    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


def find_best_performer(office: Office, urgency: str | None = None):
    """
    Выбирает наилучшего исполнителя (сотрудника АХО) для заявки.
    Приоритет:
    1. Сотрудники АХО из того же офиса, где возникла проблема.
    2. Среди кандидатов выбирается сотрудник с наименьшей загрузкой (current_tasks_count).
    3. При равной загрузке выбирается сотрудник с наименьшим id (стабильный выбор).
    """
    # Находим всех сотрудников АХО (роль содержит "ахо" или "aho")
    aho_users = User.objects.filter(
        Q(role__icontains='ахо') | Q(role__icontains='aho')
    )

    if not aho_users.exists():
        return None

    # Сначала пробуем сотрудников из того же офиса
    same_office_candidates = aho_users.filter(office=office) if office else User.objects.none()
    candidates = same_office_candidates if same_office_candidates.exists() else aho_users

    # Загружаем информацию о загрузке
    loads = {
        load.staff_id: load
        for load in Load.objects.filter(staff__in=candidates)
    }

    def load_score(user: User) -> int:
        load_obj = loads.get(user.id_user)
        if not load_obj or load_obj.current_tasks_count is None:
            return 0
        return load_obj.current_tasks_count

    # Выбираем сотрудника с минимальной загрузкой
    best_user = min(candidates, key=lambda u: (load_score(u), u.id_user))
    return best_user


# Маппинг типов поломок с фронтенда на бэкенд
ISSUE_TYPE_MAPPING = {
    'access': 'Доступ',
    'hardware': 'Оборудование',
    'software': 'ПО',
    'network': 'Сеть',
    'furniture': 'Мебель',
    'other': 'Другое',
}

# Маппинг приоритетов с фронтенда на бэкенд
PRIORITY_MAPPING = {
    'low': 'Низкая',
    'medium': 'Средняя',
    'high': 'Высокая',
    'urgent': 'Критическая',
}

# Обратный маппинг приоритетов (из БД на фронтенд)
PRIORITY_REVERSE_MAPPING = {
    'Низкая': 'low',
    'Средняя': 'medium',
    'Высокая': 'high',
    'Критическая': 'urgent',
}

# Обратный маппинг типов поломок (из БД на фронтенд)
ISSUE_TYPE_REVERSE_MAPPING = {
    'Доступ': 'access',
    'Оборудование': 'hardware',
    'ПО': 'software',
    'Сеть': 'network',
    'Мебель': 'furniture',
    'Другое': 'other',
}

# Маппинг статусов из БД на фронтенд
STATUS_MAPPING = {
    'Новая': 'new',
    'На доработке': 'revision',
    'В работе': 'in_progress',
    'Выполнена': 'completed',
    'Выполненные': 'completed',
    'Ожидают закупки': 'awaiting_purchase',
}


@csrf_exempt
@require_http_methods(["POST"])
def create_request(request):
    """API endpoint для создания заявки"""
    try:
        # Получаем user_id из запроса (FormData)
        user_id = request.POST.get('user_id')
        if not user_id:
            return JsonResponse(
                {'error': 'ID пользователя обязателен'},
                status=400
            )

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return JsonResponse(
                {'error': 'Неверный формат ID пользователя'},
                status=400
            )

        # Поиск пользователя
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Получаем данные из формы (FormData)
        issue_type_key = request.POST.get('issueType')
        priority_key = request.POST.get('priority')
        description = request.POST.get('problemDescription')
        # Адрес офиса (поле "Адрес" на форме)
        address = request.POST.get('address', '').strip()
        # Описание локации внутри офиса (опционально)
        location_description = request.POST.get('locationDescription', '').strip()
        # В БД поле office_location теперь заполняем из поля "Адрес"
        # (если по какой-то причине адрес не указан, используем описание локации как запасной вариант)
        office_location = address or location_description
        employee_location = request.POST.get('employeeLocation', '').strip()

        # Валидация обязательных полей
        if not issue_type_key or not priority_key or not description or not office_location:
            return JsonResponse(
                {'error': 'Заполните все обязательные поля'},
                status=400
            )

        # Получаем или создаем тип поломки
        issue_type_name = ISSUE_TYPE_MAPPING.get(issue_type_key, 'Другое')
        failure_type, created = TypeOfFailure.objects.get_or_create(
            name=issue_type_name,
            defaults={'description': f'Тип поломки: {issue_type_name}'}
        )

        # Получаем или создаем статус "Новая"
        status, created = Status.objects.get_or_create(
            name='Новая',
            defaults={}
        )

        # Получаем или создаем запись в таблице затрат (по умолчанию)
        expense, created = Table.objects.get_or_create(
            expense_name='Заявка',
            defaults={'amount': 0}
        )

        # Определяем офис: приоритет — офис, выбранный пользователем в форме, затем офис пользователя
        office_id = request.POST.get('office_id')
        office_address = None
        if office_id:
            try:
                office_address = Office.objects.get(id_office=int(office_id))
            except (ValueError, TypeError, Office.DoesNotExist):
                office_address = None

        if office_address is None:
            office_address = user.office

        if not office_address:
            return JsonResponse(
                {'error': 'У пользователя не указан офис и не выбран офис в форме'},
                status=400
            )

        # Маппинг приоритета
        urgency = PRIORITY_MAPPING.get(priority_key, 'Средняя')

        # Создаем заявку (без исполнителя, назначим ниже автоматически)
        new_request = Request.objects.create(
            user=user,
            failure_type=failure_type,
            urgency=urgency,
            description=description,
            office_address=office_address,
            office_location=office_location,
            employee_location=employee_location or '',
            expense=expense,
            status=status
        )

        # Автоматическое назначение исполнителя (только сотрудники АХО)
        performer = find_best_performer(office_address, urgency)
        if performer:
            new_request.performer = performer
            new_request.save(update_fields=['performer'])

            # Обновляем загрузку исполнителя
            load_obj, _ = Load.objects.get_or_create(
                staff=performer,
                defaults={
                    'current_tasks_count': 0,
                    'current_tasks': '',
                    'urgency': urgency,
                },
            )
            # Увеличиваем счетчик задач
            load_obj.current_tasks_count = (load_obj.current_tasks_count or 0) + 1
            # Добавляем id заявки в текстовое поле (обратная совместимость)
            if load_obj.current_tasks:
                load_obj.current_tasks = f"{load_obj.current_tasks}, {new_request.id_request}"
            else:
                load_obj.current_tasks = str(new_request.id_request)
            load_obj.urgency = urgency
            load_obj.save()

        # Обработка загрузки изображений
        if 'attachments' in request.FILES:
            files = request.FILES.getlist('attachments')
            # Сохраняем все изображения
            from back.models import RequestAttachment
            for file in files:
                RequestAttachment.objects.create(
                    request=new_request,
                    file=file
                )
            # Также сохраняем первое изображение в старое поле для обратной совместимости
            if files:
                new_request.attachments = files[0]
                new_request.save()

        # Создаем уведомление о создании заявки
        Notification.objects.create(
            user=user,
            request=new_request,
            message=f'Ваша заявка #{new_request.id_request} создана.'
        )

        return JsonResponse({
            'success': True,
            'message': 'Заявка успешно создана',
            'request': {
                'id': new_request.id_request,
                'status': status.name,
                'created_at': new_request.created_at.isoformat()
            }
        })

    except json.JSONDecodeError:
        return JsonResponse(
            {'error': 'Неверный формат данных'},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


# Обратный маппинг приоритетов (из БД на фронтенд)
PRIORITY_REVERSE_MAPPING = {
    'Низкая': 'low',
    'Средняя': 'medium',
    'Высокая': 'high',
    'Критическая': 'urgent',
}

# Обратный маппинг типов поломок (из БД на фронтенд)
ISSUE_TYPE_REVERSE_MAPPING = {
    'Доступ': 'access',
    'Оборудование': 'hardware',
    'ПО': 'software',
    'Сеть': 'network',
    'Мебель': 'furniture',
    'Другое': 'other',
}

# Маппинг статусов из БД на фронтенд
STATUS_MAPPING = {
    'Новая': 'new',
    'На доработке': 'revision',
    'В работе': 'in_progress',
    'Выполнена': 'completed',
    'Выполненные': 'completed',
    'Ожидают закупки': 'awaiting_purchase',
}


@csrf_exempt
@require_http_methods(["GET"])
def get_requests(request, user_id):
    """API endpoint для получения списка заявок пользователя"""
    try:
        # Поиск пользователя
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Получаем параметр фильтра из запроса
        filter_type = request.GET.get('filter', 'my_requests')
        
        # Фильтруем заявки в зависимости от типа фильтра
        if filter_type == 'i_am_performer':
            # Заявки, где пользователь является исполнителем
            requests = Request.objects.filter(performer=user).select_related(
                'failure_type', 'status', 'office_address', 'performer', 'expense', 'user'
            ).prefetch_related('comments').order_by('-created_at')
        else:
            # Заявки, которые создал пользователь (по умолчанию)
            requests = Request.objects.filter(user=user).select_related(
                'failure_type', 'status', 'office_address', 'performer', 'expense'
            ).prefetch_related('comments').order_by('-created_at')

        # Формируем список заявок
        requests_list = []
        for req in requests:
            # Маппинг приоритета
            priority = PRIORITY_REVERSE_MAPPING.get(req.urgency, 'medium')
            
            # Маппинг типа поломки
            issue_type = ISSUE_TYPE_REVERSE_MAPPING.get(req.failure_type.name, 'other')
            
            # Маппинг статуса
            status_key = STATUS_MAPPING.get(req.status.name, 'new')
            
            # Формируем location (объединяем office_location и employee_location)
            location_parts = []
            if req.office_location:
                location_parts.append(req.office_location)
            if req.employee_location:
                location_parts.append(req.employee_location)
            location = ', '.join(location_parts) if location_parts else 'Не указано'

            # Формируем список вложений из новой модели RequestAttachment
            from back.models import RequestAttachment
            attachments = []
            request_attachments = RequestAttachment.objects.filter(request=req)
            for attachment in request_attachments:
                if attachment.file:
                    attachment_url = request.build_absolute_uri(attachment.file.url)
                    attachments.append(attachment_url)
            
            # Если нет вложений в новой модели, используем старое поле для обратной совместимости
            if not attachments and req.attachments:
                attachment_url = request.build_absolute_uri(req.attachments.url)
                attachments.append(attachment_url)
            
            # Формируем данные об исполнителе
            performer_data = None
            if req.performer:
                performer_data = {
                    'id': req.performer.id_user,
                    'first_name': req.performer.first_name or '',
                    'last_name': req.performer.last_name or '',
                    'middle_name': req.performer.middle_name or '',
                    'username': req.performer.username or '',
                }
            
            # Формируем данные о затратах
            expense_data = None
            if req.expense:
                expense_data = {
                    'id': req.expense.id_table,
                    'name': req.expense.expense_name or '',
                    'amount': float(req.expense.amount) if req.expense.amount else 0,
                }
            
            # Формируем список комментариев
            comments_list = []
            for comment in req.comments.all():
                comments_list.append({
                    'id': comment.id_comment,
                    'content': comment.content or '',
                    'createdAt': comment.created_at.isoformat() if comment.created_at else '',
                })
            
            requests_list.append({
                'id': str(req.id_request),
                'priority': priority,
                'location': location,
                'address': req.office_address.address if req.office_address else '',
                'employeeLocation': req.employee_location or '',
                'locationDescription': req.office_location or '',
                'problemDescription': req.description or '',
                'issueType': issue_type,
                'status': status_key,
                'createdAt': req.created_at.isoformat(),
                'attachments': attachments,
                'performer': performer_data,
                'expense': expense_data,
                'comments': comments_list,
            })

        return JsonResponse({
            'success': True,
            'requests': requests_list
        })

    except Exception as e:
            return JsonResponse(
                {'error': f'Ошибка сервера: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET"])
def get_archive_requests(request):
    """
    Возвращает все заявки со статусом 'Выполнена' (архив) для всех пользователей.
    Поддерживает фильтры по региону, городу и офису (ID офиса).
    """
    try:
        from back.models import Request  # локальный импорт, чтобы избежать циклов

        region = request.GET.get('region')
        city = request.GET.get('city')
        office_id = request.GET.get('office')

        # Фильтруем только выполненные заявки
        completed_status_names = [
            name for name, key in STATUS_MAPPING.items() if key == 'completed'
        ]

        qs = Request.objects.filter(
            status__name__in=completed_status_names
        ).select_related(
            'failure_type', 'status', 'office_address', 'performer', 'expense', 'user'
        ).prefetch_related('comments').order_by('-created_at')

        # Применяем фильтры по офису
        if region:
            qs = qs.filter(office_address__region=region)
        if city:
            qs = qs.filter(office_address__city=city)
        if office_id:
            qs = qs.filter(office_address__id_office=office_id)

        requests_list = []
        for req in qs:
            priority = PRIORITY_REVERSE_MAPPING.get(req.urgency, 'medium')
            issue_type = ISSUE_TYPE_REVERSE_MAPPING.get(req.failure_type.name, 'other')
            status_key = STATUS_MAPPING.get(req.status.name, 'new')

            location_parts = []
            if req.office_location:
                location_parts.append(req.office_location)
            if req.employee_location:
                location_parts.append(req.employee_location)
            location = ', '.join(location_parts) if location_parts else 'Не указано'

            # Вложения (как в get_requests)
            from back.models import RequestAttachment
            attachments = []
            request_attachments = RequestAttachment.objects.filter(request=req)
            for attachment in request_attachments:
                if attachment.file:
                    attachment_url = request.build_absolute_uri(attachment.file.url)
                    attachments.append(attachment_url)
            if not attachments and req.attachments:
                attachment_url = request.build_absolute_uri(req.attachments.url)
                attachments.append(attachment_url)

            performer_data = None
            if req.performer:
                performer_data = {
                    'id': req.performer.id_user,
                    'first_name': req.performer.first_name or '',
                    'last_name': req.performer.last_name or '',
                    'middle_name': req.performer.middle_name or '',
                    'username': req.performer.username or '',
                }

            expense_data = None
            if req.expense:
                expense_data = {
                    'id': req.expense.id_table,
                    'name': req.expense.expense_name or '',
                    'amount': float(req.expense.amount) if req.expense.amount else 0,
                }

            comments_list = []
            for comment in req.comments.all():
                comments_list.append({
                    'id': comment.id_comment,
                    'content': comment.content or '',
                    'createdAt': comment.created_at.isoformat() if comment.created_at else '',
                })

            office = req.office_address

            requests_list.append({
                'id': str(req.id_request),
                'priority': priority,
                'location': location,
                'address': office.address if office else '',
                'region': office.region if office else '',
                'city': office.city if office else '',
                'officeId': office.id_office if office else None,
                'officeName': office.name if office else '',
                'employeeLocation': req.employee_location or '',
                'locationDescription': req.office_location or '',
                'problemDescription': req.description or '',
                'issueType': issue_type,
                'status': status_key,
                'createdAt': req.created_at.isoformat(),
                'attachments': attachments,
                'performer': performer_data,
                'expense': expense_data,
                'comments': comments_list,
            })

        return JsonResponse({
            'success': True,
            'requests': requests_list,
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


@csrf_exempt
@require_http_methods(["GET"])
def get_office_filters(request):
    """
    Возвращает списки регионов, городов и офисов для фильтров в архиве.
    """
    try:
        from back.models import Office

        regions = list(
            Office.objects.exclude(region__isnull=True)
            .exclude(region__exact='')
            .values_list('region', flat=True)
            .distinct()
            .order_by('region')
        )

        cities = list(
            Office.objects.exclude(city__isnull=True)
            .exclude(city__exact='')
            .values_list('city', flat=True)
            .distinct()
            .order_by('city')
        )

        offices_qs = Office.objects.all().order_by('name')
        offices = []
        for office in offices_qs:
            offices.append({
                'id': office.id_office,
                'name': office.name,
                'region': office.region,
                'city': office.city,
                'address': office.address,
            })

        return JsonResponse({
            'success': True,
            'regions': regions,
            'cities': cities,
            'offices': offices,
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )

@csrf_exempt
@require_http_methods(["PATCH", "PUT"])
def update_request(request, request_id):
    """API endpoint для обновления данных заявки"""
    try:
        # Получаем данные из запроса
        try:
            json_data = json.loads(request.body)
            user_id = json_data.get('user_id')
        except json.JSONDecodeError:
            return JsonResponse(
                {'error': 'Неверный формат данных'},
                status=400
            )

        if not user_id:
            return JsonResponse(
                {'error': 'ID пользователя обязателен'},
                status=400
            )

        # Поиск заявки
        try:
            req = Request.objects.get(id_request=request_id)
        except Request.DoesNotExist:
            return JsonResponse(
                {'error': 'Заявка не найдена'},
                status=404
            )

        # Проверяем, что пользователь является сотрудником АХО
        try:
            user = User.objects.get(id_user=user_id)
            if user.role and 'ахо' not in user.role.lower() and 'aho' not in user.role.lower():
                return JsonResponse(
                    {'error': 'Только сотрудники АХО могут редактировать заявки'},
                    status=403
                )
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Обновляем поля заявки
        if 'priority' in json_data:
            priority_key = json_data.get('priority')
            urgency = PRIORITY_MAPPING.get(priority_key, req.urgency)
            req.urgency = urgency

        if 'issueType' in json_data:
            issue_type_key = json_data.get('issueType')
            issue_type_name = ISSUE_TYPE_MAPPING.get(issue_type_key, 'Другое')
            failure_type, created = TypeOfFailure.objects.get_or_create(
                name=issue_type_name,
                defaults={'description': f'Тип поломки: {issue_type_name}'}
            )
            req.failure_type = failure_type

        if 'locationDescription' in json_data:
            req.office_location = json_data.get('locationDescription', req.office_location)

        if 'employeeLocation' in json_data:
            req.employee_location = json_data.get('employeeLocation', req.employee_location)

        if 'problemDescription' in json_data:
            req.description = json_data.get('problemDescription', req.description)

        if 'performerId' in json_data:
            performer_id = json_data.get('performerId')
            if performer_id:
                try:
                    performer = User.objects.get(id_user=performer_id)
                    req.performer = performer
                except User.DoesNotExist:
                    pass
            else:
                req.performer = None

        if 'expenses' in json_data:
            expenses = json_data.get('expenses', [])
            if expenses and len(expenses) > 0:
                # Берем первую непустую строку затрат
                first_expense = None
                for exp in expenses:
                    if exp.get('name') or exp.get('amount'):
                        first_expense = exp
                        break
                
                if first_expense:
                    expense_name = first_expense.get('name', 'Заявка')
                    expense_amount = first_expense.get('amount', '0')
                    try:
                        expense_amount = float(expense_amount) if expense_amount else 0
                    except (ValueError, TypeError):
                        expense_amount = 0
                    
                    expense, created = Table.objects.get_or_create(
                        expense_name=expense_name,
                        defaults={'amount': expense_amount}
                    )
                    if not created:
                        expense.amount = expense_amount
                        expense.save()
                    req.expense = expense

        if 'comment' in json_data:
            comment_text = json_data.get('comment', '').strip()
            # Сохраняем комментарий только если он не пустой и отличается от последнего комментария
            if comment_text:
                # Получаем последний комментарий к заявке
                last_comment = req.comments.order_by('-created_at').first()
                
                # Создаем новый комментарий только если текст отличается от последнего
                if not last_comment or last_comment.content.strip() != comment_text:
                    comment = Comment.objects.create(content=comment_text)
                    req.comments.add(comment)

        req.save()

        return JsonResponse({
            'success': True,
            'message': 'Заявка успешно обновлена'
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


@csrf_exempt
@require_http_methods(["GET"])
def get_notifications(request, user_id):
    """API endpoint для получения уведомлений пользователя"""
    try:
        # Поиск пользователя
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Получаем уведомления из БД
        notifications = Notification.objects.filter(user=user).select_related('request').order_by('-created_at')
        
        notifications_list = []
        for notif in notifications:
            notifications_list.append({
                'id': f'n_{notif.id_notification}',
                'notificationId': notif.id_notification,
                'text': notif.message,
                'createdAt': notif.created_at.isoformat(),
                'isRead': notif.is_read,
            })

        # Подсчитываем непрочитанные уведомления
        unread_count = Notification.objects.filter(user=user, is_read=False).count()

        return JsonResponse({
            'success': True,
            'notifications': notifications_list,
            'unreadCount': unread_count
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


@csrf_exempt
@require_http_methods(["PATCH"])
def mark_notification_read(request, notification_id):
    """API endpoint для пометки уведомления как прочитанного"""
    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {'error': 'Неверный формат данных'},
                status=400
            )

        user_id = data.get('user_id')
        if not user_id:
            return JsonResponse(
                {'error': 'ID пользователя обязателен'},
                status=400
            )

        try:
            notification = Notification.objects.get(id_notification=notification_id)
        except Notification.DoesNotExist:
            return JsonResponse(
                {'error': 'Уведомление не найдено'},
                status=404
            )

        if notification.user.id_user != int(user_id):
            return JsonResponse(
                {'error': 'Нет доступа к этому уведомлению'},
                status=403
            )

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])

        return JsonResponse({
            'success': True,
            'notification': {
                'id': f'n_{notification.id_notification}',
                'notificationId': notification.id_notification,
                'isRead': notification.is_read
            }
        })
    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


# Обратный маппинг статусов (из фронтенда на БД)
STATUS_REVERSE_MAPPING = {
    'new': 'Новая',
    'revision': 'На доработке',
    'in_progress': 'В работе',
    'completed': 'Выполнена',
    'awaiting_purchase': 'Ожидают закупки',
}


@csrf_exempt
@require_http_methods(["PATCH", "PUT"])
def update_request_status(request, request_id):
    """API endpoint для обновления статуса заявки"""
    try:
        # Получаем user_id из запроса
        try:
            json_data = json.loads(request.body)
            user_id = json_data.get('user_id')
            new_status_key = json_data.get('status')
        except json.JSONDecodeError:
            return JsonResponse(
                {'error': 'Неверный формат данных'},
                status=400
            )

        if not user_id or not new_status_key:
            return JsonResponse(
                {'error': 'ID пользователя и новый статус обязательны'},
                status=400
            )

        # Поиск пользователя
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Проверяем, что пользователь является сотрудником АХО
        if not user.role or ('ахо' not in user.role.lower() and 'aho' not in user.role.lower()):
            return JsonResponse(
                {'error': 'Только сотрудники АХО могут изменять статус заявок'},
                status=403
            )

        # Поиск заявки
        try:
            req = Request.objects.get(id_request=request_id)
        except Request.DoesNotExist:
            return JsonResponse(
                {'error': 'Заявка не найдена'},
                status=404
            )

        # Получаем старый статус для сравнения
        old_status = req.status.name

        # Маппинг статуса из фронтенда на БД
        new_status_name = STATUS_REVERSE_MAPPING.get(new_status_key)
        if not new_status_name:
            return JsonResponse(
                {'error': 'Неверный статус'},
                status=400
            )

        # Получаем или создаем новый статус
        new_status, created = Status.objects.get_or_create(
            name=new_status_name,
            defaults={}
        )

        # Обновляем статус заявки
        req.status = new_status
        req.save()

        # Если заявка завершена или отправлена в архивный статус,
        # уменьшаем загрузку исполнителя
        if new_status_key in ('completed', 'awaiting_purchase') and req.performer:
            try:
                load_obj = Load.objects.get(staff=req.performer)
                if load_obj.current_tasks_count:
                    load_obj.current_tasks_count = max(0, load_obj.current_tasks_count - 1)
                    load_obj.save(update_fields=['current_tasks_count'])
            except Load.DoesNotExist:
                pass

        # Создаем уведомление, если статус изменился
        if old_status != new_status_name:
            # Формируем текст уведомления
            status_messages = {
                'Выполнена': f'Ваша заявка #{req.id_request} выполнена!',
                'На доработке': f'Ваша заявка #{req.id_request} отправлена на доработку.',
                'В работе': f'Ваша заявка #{req.id_request} взята в работу.',
                'Новая': f'Ваша заявка #{req.id_request} создана.',
                'Ожидают закупки': f'Ваша заявка #{req.id_request} ожидает закупки.',
            }
            
            message = status_messages.get(new_status_name, f'Статус заявки #{req.id_request} изменен на "{new_status_name}"')
            
            # Создаем уведомление для владельца заявки
            Notification.objects.create(
                user=req.user,
                request=req,
                message=message
            )

        return JsonResponse({
            'success': True,
            'message': 'Статус заявки успешно обновлен',
            'request': {
                'id': req.id_request,
                'status': new_status_key,
                'statusName': new_status_name
            }
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )
