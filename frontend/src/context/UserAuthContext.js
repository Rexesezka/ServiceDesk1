'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const UserAuthContext = createContext(null)

export function useUserAuth() {
  const context = useContext(UserAuthContext)
  if (!context) {
    throw new Error('useUserAuth must be used within UserAuthProvider')
  }
  return context
}

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  // Определяем роль пользователя
  const userRole = useMemo(() => {
    if (!user || !user.role) {
      return 'employee' // По умолчанию обычный сотрудник
    }
    
    const role = user.role.toLowerCase()
    // Если роль содержит "АХО" или "aho", то это сотрудник АХО
    if (role.includes('ахо') || role.includes('aho')) {
      return 'aho'
    }
    
    return 'employee'
  }, [user])

  const updateUser = (userData) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
      } catch (error) {
        console.error('Ошибка при сохранении данных пользователя:', error)
      }
    }
  }

  // Функция для выхода
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  // Функция для проверки, является ли пользователь сотрудником АХО
  const isAHO = useMemo(() => userRole === 'aho', [userRole])

  // Функция для проверки, является ли пользователь обычным сотрудником
  const isEmployee = useMemo(() => userRole === 'employee', [userRole])

  const value = useMemo(() => {
    return {
      user,
      userRole,
      isAHO,
      isEmployee,
      isLoading,
      updateUser,
      logout,
    }
  }, [user, userRole, isAHO, isEmployee, isLoading])

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  )
}

