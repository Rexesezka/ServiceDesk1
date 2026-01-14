export async function GET(request) {
  try {
    // В реальном приложении здесь будет проверка токена/сессии
    // и получение данных пользователя из базы данных
    
    // Пока используем мок-данные для демонстрации
    // В будущем здесь будет:
    // const userId = getUserIdFromSession(request)
    // const user = await getUserFromDatabase(userId)
    
    return Response.json({
      success: true,
      user: {
        id: 1,
        email: 'user@example.com',
        fullName: 'Иванов Иван Иванович',
        city: 'Екатеринбург',
        officeAddress: 'г. Екатеринбург, ул. Мира, д. 19',
        position: 'Разработчик',
        deskNumber: '19',
        birthDate: '01.01.2000',
        role: 'employee'
      }
    })
  } catch (error) {
    return Response.json(
      { 
        success: false,
        error: 'Ошибка сервера'
      },
      { status: 500 }
    )
  }
}

