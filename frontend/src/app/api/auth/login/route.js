export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Проверка входных данных
    if (!email || !password) {
      return Response.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Здесь будет проверка с базой данных
    // Пока используем мок-данные для демонстрации
    const mockUser = {
      email: 'user@example.com',
      password: 'password123'
    }

    // Проверка учетных данных
    if (email === mockUser.email && password === mockUser.password) {
      return Response.json({
        success: true,
        message: 'Авторизация успешна',
        user: {
          id: 1,
          email: mockUser.email,
          fullName: 'Иванов Иван Иванович',
          city: 'Екатеринбург',
          officeAddress: 'г. Екатеринбург, ул. Мира, д. 19',
          position: 'Разработчик',
          deskNumber: '19',
          birthDate: '01.01.2000',
          role: 'employee'
        }
      })
    } else {
      return Response.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }
  } catch (error) {
    return Response.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
