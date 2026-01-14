'use client'

import { NotificationsProvider } from '@/context/NotificationsContext'

export default function NotificationProviderWrapper({ children }) {
  return <NotificationsProvider>{children}</NotificationsProvider>
}

