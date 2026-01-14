'use client'

import { useState, useEffect } from 'react'
import styles from './NotificationBadge.module.scss'

export default function NotificationBadge({ count }) {
  const [unreadCount, setUnreadCount] = useState(count ?? 0)
  const [isLoading, setIsLoading] = useState(count === undefined)

  useEffect(() => {
    if (count !== undefined) {
      setUnreadCount(count)
      setIsLoading(false)
      return
    }

    let isCancelled = false

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count')
        const data = await response.json()
        
        if (data.success && !isCancelled) {
          setUnreadCount(data.count || 0)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Ошибка при получении количества уведомлений:', error)
          setUnreadCount(0)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchUnreadCount()

    // Опционально: обновлять счетчик каждые 30 секунд
    const interval = setInterval(fetchUnreadCount, 5000)

    return () => {
      isCancelled = true
      clearInterval(interval)
    }
  }, [count])

  // Не показываем badge, если нет непрочитанных уведомлений или идет загрузка
  if (isLoading || unreadCount === 0) {
    return null
  }

  // Форматируем большие числа (например, 99+)
  const displayCount = unreadCount > 99 ? '99+' : unreadCount

  return (
    <span className={styles.notificationBadge}>
      {displayCount}
    </span>
  )
}

