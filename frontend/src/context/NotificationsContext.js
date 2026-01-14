'use client'

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import NotificationModal from '@/components/ui/NotificationModal/NotificationModal'

const NotificationsContext = createContext(null)

// Базовый URL для Django API
// В production задаётся через переменную окружения NEXT_PUBLIC_API_BASE_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export function useNotifications() {
  return useContext(NotificationsContext)
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'error'
  })

  // Загрузка уведомлений с сервера
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Получаем user_id из localStorage
        const userData = localStorage.getItem('user')
        if (!userData) {
          setIsLoading(false)
          return
        }

        const user = JSON.parse(userData)
        if (!user || !user.id) {
          setIsLoading(false)
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/notifications/${user.id}/`)
        
        if (!response.ok) {
          throw new Error('Ошибка при загрузке уведомлений')
        }

        const data = await response.json()
        
        if (data.success && Array.isArray(data.notifications)) {
          // Сортируем уведомления по дате (новые сверху)
          const sortedNotifications = [...data.notifications].sort((a, b) => (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ))
          setNotifications(sortedNotifications)
        } else {
          setNotifications([])
        }
      } catch (error) {
        console.error('Ошибка при загрузке уведомлений:', error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // Обновляем уведомления каждые 30 секунд
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStoredUserId = useCallback(() => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        return null
      }
      const parsedUser = JSON.parse(userData)
      return parsedUser?.id ?? null
    } catch (error) {
      console.error('Ошибка при чтении данных пользователя:', error)
      return null
    }
  }, [])

  const markNotificationAsRead = useCallback(async (notificationId) => {
    if (!notificationId) {
      return
    }

    const userId = getStoredUserId()
    if (!userId) {
      console.error('Пользователь не найден, невозможно пометить уведомление')
      return
    }

    let previousIsRead = null
    setNotifications(prev =>
      prev.map(notification => {
        if (notification.notificationId !== notificationId) {
          return notification
        }
        previousIsRead = notification.isRead
        if (notification.isRead) {
          return notification
        }
        return { ...notification, isRead: true }
      })
    )

    if (previousIsRead === true) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      })

      if (!response.ok) {
        throw new Error('Сервер вернул ошибку')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error('Не удалось обновить статус уведомления')
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса уведомления:', error)
      if (previousIsRead === false) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.notificationId === notificationId
              ? { ...notification, isRead: false }
              : notification
          )
        )
      }
    }
  }, [getStoredUserId])

  const showNotification = useCallback((message, type = 'error') => {
    setNotification({
      isOpen: true,
      message,
      type
    })
  }, [])

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isOpen: false
    }))
  }, [])

  const unreadNotifications = useMemo(
    () => notifications.filter(notification => !notification.isRead),
    [notifications]
  )

  const readNotifications = useMemo(
    () => notifications.filter(notification => notification.isRead),
    [notifications]
  )

  const value = useMemo(() => {
    return {
      notifications,
      unreadNotifications,
      readNotifications,
      unreadCount: unreadNotifications.length,
      isLoading,
      showNotification,
      hideNotification,
      markNotificationAsRead
    }
  }, [
    notifications,
    unreadNotifications,
    readNotifications,
    isLoading,
    showNotification,
    hideNotification,
    markNotificationAsRead
  ])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationModal
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={hideNotification}
        type={notification.type}
      />
    </NotificationsContext.Provider>
  )
}

