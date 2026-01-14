'use client'

import { useEffect } from 'react'
import styles from './NotificationModal.module.scss'

export default function NotificationModal({ message, isOpen, onClose, type = 'error' }) {
  useEffect(() => {
    if (isOpen) {
      // Автоматически закрываем уведомление через 5 секунд
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.content} ${styles[type]}`}>
          <div className={styles.icon}>
            {type === 'error' && '⚠️'}
            {type === 'success' && '✅'}
            {type === 'info' && 'ℹ️'}
            {type === 'warning' && '⚠️'}
          </div>
          <div className={styles.message}>{message}</div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

