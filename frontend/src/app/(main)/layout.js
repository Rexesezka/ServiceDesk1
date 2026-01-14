'use client'
import LayoutStyles from './layout.module.scss'
import Image from 'next/image'
import NotificationBadge from '@/components/ui/NotificationBadge/NotificationBadge'
import { usePathname, useRouter } from 'next/navigation'
import { NotificationsProvider, useNotifications } from '@/context/NotificationsContext'
import { UserAuthProvider, useUserAuth } from '@/context/UserAuthContext'
import { useEffect } from 'react'

function AuthGuard({ children }) {
  const { user, isLoading } = useUserAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  return <>{children}</>
}

function HeaderNav() {
  const pathname = usePathname()
  const isProfile = pathname?.startsWith('/profile')
  const isRequests = pathname?.startsWith('/requests')
  const isNotifications = pathname?.startsWith('/notifications')
  const { unreadCount } = useNotifications() || { unreadCount: 0 }

  return (
    <div className={LayoutStyles.profileHeaderContent}>
      <Image src="/assets/logo.svg" alt="Logo" width={155} height={55} priority />
      <nav className={LayoutStyles.profileNav}>
        <a href="/profile" className={`${LayoutStyles.navLink} ${isProfile ? LayoutStyles.active : ''}`}>ЛИЧНЫЙ КАБИНЕТ</a>
        <a href="/requests" className={`${LayoutStyles.navLink} ${isRequests ? LayoutStyles.active : ''}`}>ЗАЯВКИ</a>
        <a href="/notifications" className={`${LayoutStyles.navLink} ${isNotifications ? LayoutStyles.active : ''}`}>
          УВЕДОМЛЕНИЯ
          <NotificationBadge count={unreadCount} />
        </a>
      </nav>
      <a href="/requests/create" className={LayoutStyles.createRequestBtn}>
        <span className={LayoutStyles.btnIcon}><Image src="/assets/create_request_btn.svg" alt="Create Request" width={20} height={20} /></span>
        СОЗДАТЬ ЗАЯВКУ
      </a>
    </div>
  )
}

export default function MainLayout({ children }) {
  const pathname = usePathname()
  const isProfile = pathname?.startsWith('/profile')
  const isRequests = pathname?.startsWith('/requests')
  const isNotifications = pathname?.startsWith('/notifications')

  return (
    <UserAuthProvider>
      <NotificationsProvider>
        <AuthGuard>
          <div className={LayoutStyles.profileContainer}>
            {/* Header */}
            <header className={LayoutStyles.profileHeader}>
              <HeaderNav />
            </header>

            {/* Main Content */}
            <main className={LayoutStyles.profileMain}>
              {children}
            </main>
          </div>
        </AuthGuard>
      </NotificationsProvider>
    </UserAuthProvider>
  )
}
