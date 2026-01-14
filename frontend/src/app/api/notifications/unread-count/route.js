export async function GET(request) {
  try {
    // Здесь будет запрос к базе данных
    // Пока используем мок-данные для демонстрации
    // В реальном приложении нужно будет получить userId из сессии или токена
    
    // Мок-данные: количество непрочитанных уведомлений
    const unreadCount = 3;

    return Response.json({
      success: true,
      count: unreadCount
    })
  } catch (error) {
    return Response.json(
      { 
        success: false,
        error: 'Ошибка сервера',
        count: 0
      },
      { status: 500 }
    )
  }
}

