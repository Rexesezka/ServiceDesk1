'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import InputField from '../components/ui/InputField/InputField'
import styles from './page.module.scss'

// Базовый URL для Django API
// В production задаётся через переменную окружения NEXT_PUBLIC_API_BASE_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function HomePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        JSON.parse(user) // Проверяем, что данные валидные
        router.push('/requests')
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      // Проверяем, что ответ получен
      if (!response.ok && response.status === 0) {
        throw new Error('Не удалось подключиться к серверу. Убедитесь, что backend сервер запущен на http://127.0.0.1:8000')
      }

      const data = await response.json()

      if (response.ok) {
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        // Переходим на страницу профиля
        window.location.href = '/profile'
      } else {
        setError(data.error || 'Произошла ошибка при авторизации')
      }
    } catch (error) {
      // Более детальная обработка ошибок
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Не удалось подключиться к серверу. Проверьте, что backend сервер запущен на http://127.0.0.1:8000')
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('Ошибка при подключении к серверу. Проверьте, что backend сервер запущен.')
      }
      console.error('Ошибка:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.authLayout}>
      <div className={styles.authContainer}>
        <div className={styles.authPage}>
          <h1>Добро пожаловать!</h1>
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.authLabels}>
            <InputField 
              type="email"
              name="email"
              id="email"
              required={true}
              placeholder="Введите ваш email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <InputField 
              type="password"
              name="password"
              id="password"
              required={true}
              placeholder="Введите пароль"
              value={formData.password}
              onChange={handleInputChange}
            />
            </div>
            <a href="#" className={styles.forgotPassword}>
              Забыли пароль?
            </a>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            <button type="submit" className={styles.authButton} disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
            <div className={styles.signUpRow}>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}