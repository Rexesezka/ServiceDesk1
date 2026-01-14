'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useNotifications } from '@/context/NotificationsContext'
import styles from './profile.module.scss'

// Базовый URL для Django API
// В production задаётся через переменную окружения NEXT_PUBLIC_API_BASE_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function ProfilePage() {
  const router = useRouter()
  const { showNotification } = useNotifications()
  const [user, setUser] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    const previousBackground = document.body.style.background
    document.body.style.background = 'linear-gradient(180deg, #F2F3F5 0%, #F0F1F5 59.62%, #EBEDF4 100%)'
    return () => {
      document.body.style.background = previousBackground
    }
  }, [])

  useEffect(() => {
    const loadUserData = async () => {
      // Сначала проверяем localStorage
      const userData = localStorage.getItem('user')
      
      if (!userData) {
        // Если пользователь не авторизован, перенаправляем на страницу авторизации
        router.push('/')
        return
      }

      try {
        const parsedUser = JSON.parse(userData)
        const userId = parsedUser.id

        if (!userId) {
          // Если нет ID пользователя, используем данные из localStorage
          setUser(parsedUser)
          if (parsedUser.avatarUrl) {
            setAvatarUrl(parsedUser.avatarUrl)
          }
          return
        }

        // Загружаем актуальные данные с Django API
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/profile/${userId}/`)
          
          if (!response.ok) {
            throw new Error('Ошибка при загрузке данных')
          }

          const data = await response.json()
          
          if (data.success && data.user) {
            // Обновляем данные пользователя в localStorage
            localStorage.setItem('user', JSON.stringify(data.user))
            setUser(data.user)
            // Загружаем аватар, если он есть
            if (data.user.avatarUrl) {
              setAvatarUrl(data.user.avatarUrl)
            }
            return
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя с сервера:', error)
          // Если не удалось загрузить с сервера, используем данные из localStorage
          setUser(parsedUser)
          // Загружаем аватар из localStorage, если он есть
          if (parsedUser.avatarUrl) {
            setAvatarUrl(parsedUser.avatarUrl)
          }
        }
      } catch (error) {
        console.error('Ошибка при парсинге данных пользователя:', error)
        router.push('/')
      }
    }

    loadUserData()
  }, [router])

  if (!user) {
    return <div>Загрузка...</div>
  }

  // Получаем ФИО пользователя
  const userFullName = user?.fullName || 'Фамилия Имя Отчество'

  // Обработчик загрузки аватара
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      showNotification('Пожалуйста, выберите изображение', 'error')
      return
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Размер файла не должен превышать 5MB', 'error')
      return
    }

    // Создаем временный URL для предпросмотра
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target.result
      setAvatarUrl(imageUrl)
    }
    reader.onerror = () => {
      showNotification('Ошибка при чтении файла', 'error')
    }
    reader.readAsDataURL(file)

    // Отправляем файл на сервер
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`${API_BASE_URL}/api/user/avatar/${user.id}/`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Обновляем URL аватара из ответа сервера
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl)
          
          // Обновляем данные пользователя в localStorage
          if (user) {
            const updatedUser = { ...user, avatarUrl: data.avatarUrl }
            localStorage.setItem('user', JSON.stringify(updatedUser))
            setUser(updatedUser)
          }
        }
        
        showNotification('Аватар успешно загружен', 'success')
      } else {
        showNotification(data.error || 'Ошибка при загрузке аватара', 'error')
        // Откатываем предпросмотр при ошибке
        setAvatarUrl(user?.avatarUrl || null)
      }
    } catch (error) {
      console.error('Ошибка при загрузке аватара:', error)
      showNotification('Ошибка при подключении к серверу', 'error')
      // Откатываем предпросмотр при ошибке
      setAvatarUrl(user?.avatarUrl || null)
    }
  }

  return (
    <div className={styles.generalContainer}>
        <div className={styles.userSummary}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Аватар пользователя" 
                  className={styles.avatarImage}
                />
              ) : (
                <img 
                  src="/assets/avatar.svg" 
                  alt="Аватар по умолчанию" 
                  className={styles.avatarPlaceholder}
                />
              )}
            </div>
            <label htmlFor="avatar-upload" className={styles.editAvatarBtn}>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <Image src="/assets/edit_avatar_btn.svg" alt="Edit Avatar" width={14} height={14} />
            </label>
          </div>
          <h1 className={styles.userName}>
            {userFullName}
          </h1>
        </div>

        <div className={styles.aboutSection}>
          <div className={styles.aboutSectionContent}>
          <h2 className={styles.sectionTitle}>Обо мне</h2>
          <div className={styles.infoCard}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Город</span>
              <span className={styles.infoValue}>{user.city || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Адрес офиса</span>
              <span className={styles.infoValue}>{user.officeAddress || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Должность</span>
              <span className={styles.infoValue}>{user.position || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Номер стола</span>
              <span className={styles.infoValue}>{user.deskNumber || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Дата рождения</span>
              <span className={styles.infoValue}>{user.birthDate || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Почта</span>
              <span className={styles.infoValue}>{user.email || '—'}</span>
            </div>
          </div>
          </div>

          {/* Logout Button */}
          <div className={styles.logoutBtnContainer}>
          <button 
            className={styles.logoutBtn}
            onClick={() => {
              localStorage.removeItem('user')
              router.push('/')
            }}
          >
            <span className={styles.btnIcon}><Image src="/assets/logout_btn.svg" alt="Logout" width={20} height={20} /></span>
                Выйти
              </button>
            </div>
        </div>
    </div>
  )
}