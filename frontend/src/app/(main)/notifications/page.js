'use client'

import { useMemo, useState } from 'react'
import styles from './page.module.scss'
import { useNotifications } from '@/context/NotificationsContext'

function formatRelativeRu(dateIso) {
  const diffMs = Date.now() - new Date(dateIso).getTime()
  const totalMinutes = Math.max(0, Math.floor(diffMs / (60 * 1000)))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const parts = []
  if (days > 0) parts.push(`${days} дн.`)
  if (hours > 0) parts.push(`${hours} час.`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} мин.`)

  return `${parts.join(' ')} назад`
}

function resolveNotificationId(notification) {
  if (notification?.notificationId) {
    return notification.notificationId
  }
  if (!notification?.id) {
    return null
  }
  const numericId = parseInt(String(notification.id).replace(/\D/g, ''), 10)
  return Number.isNaN(numericId) ? null : numericId
}

export default function NotificationsPage() {
  const {
    unreadNotifications = [],
    readNotifications = [],
    markNotificationAsRead,
    isLoading
  } = useNotifications() || {}
  const [markingIds, setMarkingIds] = useState(() => new Set())

  const sortedUnread = useMemo(
    () =>
      [...unreadNotifications].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [unreadNotifications]
  )

  const sortedRead = useMemo(
    () =>
      [...readNotifications].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [readNotifications]
  )

  const handleMarkAsRead = async (notification) => {
    const notificationId = resolveNotificationId(notification)
    if (!notificationId || !markNotificationAsRead) {
      return
    }

    setMarkingIds(prev => {
      const next = new Set(prev)
      next.add(notificationId)
      return next
    })

    try {
      await markNotificationAsRead(notificationId)
    } finally {
      setMarkingIds(prev => {
        const next = new Set(prev)
        next.delete(notificationId)
        return next
      })
    }
  }

  const renderNotifications = (items, emptyText, showMarkButton) => {
    if (!items.length) {
      return <div className={styles.empty}>{emptyText}</div>
    }

    return items.map((notification, index) => {
      const notificationId = resolveNotificationId(notification)
      const isMarking = notificationId ? markingIds.has(notificationId) : false

      return (
        <div key={notification.id} className={styles.item}>
          <div className={styles.text}>{notification.text}</div>
          <div className={styles.itemFooter}>
            <span className={styles.time}>{formatRelativeRu(notification.createdAt)}</span>
            {showMarkButton && !notification.isRead && (
              <button
                type="button"
                className={styles.markReadButton}
                onClick={() => handleMarkAsRead(notification)}
                disabled={isMarking}
              >
                {isMarking ? 'Обновляем...' : 'Прочитано'}
              </button>
            )}
          </div>
          {index < items.length - 1 && <div className={styles.separator} />}
        </div>
      )
    })
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.list}>
          <div className={styles.empty}>Загружаем уведомления...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Непрочитанные</h2>
            <span className={styles.sectionCount}>{sortedUnread.length}</span>
          </div>
          {renderNotifications(sortedUnread, 'Непрочитанных уведомлений нет', true)}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Прочитанные</h2>
            <span className={styles.sectionCount}>{sortedRead.length}</span>
          </div>
          {renderNotifications(sortedRead, 'Прочитанных уведомлений пока нет', false)}
        </section>
      </div>
    </div>
  )
}
