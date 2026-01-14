'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import ArchiveRequestCard from '@/components/ui/ArchiveRequestCard/ArchiveRequestCard'
import { useUserAuth } from '@/context/UserAuthContext'
import RequestViewModal from '@/components/ui/RequestViewModal/RequestViewModal'

// Базовый URL для Django API
// В production задаётся через переменную окружения NEXT_PUBLIC_API_BASE_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

const periodOptions = [
  { value: '', label: 'Период' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
]

export default function ArchivePage() {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  // Фильтры
  const [period, setPeriod] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [office, setOffice] = useState('')

  // Опции для фильтров (загружаются с бэкенда)
  const [regionOptions, setRegionOptions] = useState([
    { value: '', label: 'Регион' },
  ])
  const [cityOptions, setCityOptions] = useState([
    { value: '', label: 'Город' },
  ])
  const [officeOptions, setOfficeOptions] = useState([
    { value: '', label: 'Офис' },
  ])
  // Все офисы для каскадных фильтров
  const [allOffices, setAllOffices] = useState([])
  
  // Состояния открытия выпадающих меню
  const [periodOpen, setPeriodOpen] = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [officeOpen, setOfficeOpen] = useState(false)
  
  // Refs для обработки кликов вне меню
  const periodRef = useRef(null)
  const regionRef = useRef(null)
  const cityRef = useRef(null)
  const officeRef = useRef(null)
  
  const { user, isAHO } = useUserAuth()
  const router = useRouter()

  // Проверка доступа к архиву: только для супервайзеров и руководителей
  const canAccessArchive = user && user.role && (
    user.role.toLowerCase() === 'supervisor' || 
    user.role.toLowerCase() === 'manager'
  )

  useEffect(() => {
    if (user && !canAccessArchive) {
      router.push('/requests')
    }
  }, [user, canAccessArchive, router])

  // Обработка кликов вне выпадающих меню
  useEffect(() => {
    function handleClickOutside(event) {
      if (periodRef.current && !periodRef.current.contains(event.target)) {
        setPeriodOpen(false)
      }
      if (regionRef.current && !regionRef.current.contains(event.target)) {
        setRegionOpen(false)
      }
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setCityOpen(false)
      }
      if (officeRef.current && !officeRef.current.contains(event.target)) {
        setOfficeOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Функция для фильтрации по дате
  const filterByPeriod = (requests, periodValue) => {
    if (!periodValue) return requests

    const now = new Date()
    let startDate = new Date()

    switch (periodValue) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        return requests
    }

    return requests.filter(request => {
      const requestDate = new Date(request.createdAt)
      return requestDate >= startDate && requestDate <= now
    })
  }

  // Загрузка опций фильтров (регионы, города, офисы)
  useEffect(() => {
    const loadOfficeFilters = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/offices/filters/`)
        if (!response.ok) {
          throw new Error('Ошибка при загрузке фильтров офисов')
        }

        const data = await response.json()
        if (data.success) {
          if (Array.isArray(data.regions)) {
            setRegionOptions([
              { value: '', label: 'Регион' },
              ...data.regions.map((r) => ({ value: r, label: r })),
            ])
          }
          if (Array.isArray(data.offices)) {
            setAllOffices(data.offices)
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке фильтров офисов:', error)
      }
    }

    loadOfficeFilters()
  }, [])

  // Обновляем список городов при изменении региона (каскадность)
  useEffect(() => {
    // Базовая опция
    let citiesSet = new Set()

    allOffices.forEach((officeItem) => {
      if (!region || officeItem.region === region) {
        if (officeItem.city) {
          citiesSet.add(officeItem.city)
        }
      }
    })

    const citiesArray = Array.from(citiesSet).sort()
    setCityOptions([
      { value: '', label: 'Город' },
      ...citiesArray.map((c) => ({ value: c, label: c })),
    ])

    // Если текущий выбранный город не подходит под новый регион — сбрасываем
    if (region && city && !citiesSet.has(city)) {
      setCity('')
    }
  }, [region, allOffices]) // eslint-disable-line react-hooks/exhaustive-deps

  // Обновляем список офисов при изменении региона/города (каскадность)
  useEffect(() => {
    const filteredOffices = allOffices.filter((officeItem) => {
      if (region && officeItem.region !== region) return false
      if (city && officeItem.city !== city) return false
      return true
    })

    setOfficeOptions([
      { value: '', label: 'Офис' },
      ...filteredOffices.map((o) => ({
        value: String(o.id),
        label: o.name,
      })),
    ])

    // Сбрасываем выбранный офис, если он не входит в отфильтрованный список
    if (
      office &&
      !filteredOffices.some((o) => String(o.id) === String(office))
    ) {
      setOffice('')
    }
  }, [region, city, allOffices]) // eslint-disable-line react-hooks/exhaustive-deps

  // Загрузка архивных заявок с сервера
  useEffect(() => {
    const loadArchiveRequests = async () => {
      try {
        // Берём только завершенные заявки (архив) для всех пользователей
        // Фильтры по региону, городу и офису передаём как query-параметры
        const params = new URLSearchParams()
        if (region) params.append('region', region)
        if (city) params.append('city', city)
        if (office) params.append('office', office)

        const queryString = params.toString()
        const url = queryString
          ? `${API_BASE_URL}/api/requests/archive/?${queryString}`
          : `${API_BASE_URL}/api/requests/archive/`

        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Ошибка при загрузке заявок')
        }

        const data = await response.json()
        
        if (data.success && Array.isArray(data.requests)) {
          let filtered = data.requests
          
          // Применяем фильтр по периоду
          if (period) {
            filtered = filterByPeriod(filtered, period)
          }

          setRequests(filtered)
          setHasMore(false) // Пока без пагинации
        } else {
          setRequests([])
        }
      } catch (error) {
        console.error('Ошибка при загрузке архивных заявок:', error)
        setRequests([])
      } finally {
        setIsLoading(false)
      }
    }

    loadArchiveRequests()
  }, [user, period, region, city, office])

  const handleRequestClick = (request) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRequest(null)
  }

  const handleLoadMore = () => {
    // Логика загрузки дополнительных элементов
    setPage(prev => prev + 1)
    // Здесь можно добавить загрузку следующей страницы
  }

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка архива...</div>
      </div>
    )
  }

  if (!canAccessArchive) {
    return null
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.filtersContainer}>
        <div className={styles.filtersRow}>
          <div 
            ref={periodRef}
            className={`${styles.dropdown} ${periodOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setPeriodOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={periodOpen}
            >
              {periodOptions.find(o => o.value === period)?.label || 'Период'}
            </button>
            {periodOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {periodOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === period}
                    className={`${styles.dropdownItem} ${opt.value === period ? styles.active : ''}`}
                    onClick={() => {
                      setPeriod(opt.value)
                      setPeriodOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div 
            ref={regionRef}
            className={`${styles.dropdown} ${regionOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setRegionOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={regionOpen}
            >
              {regionOptions.find(o => o.value === region)?.label || 'Регион'}
            </button>
            {regionOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {regionOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === region}
                    className={`${styles.dropdownItem} ${opt.value === region ? styles.active : ''}`}
                    onClick={() => {
                      setRegion(opt.value)
                      setRegionOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div 
            ref={cityRef}
            className={`${styles.dropdown} ${cityOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setCityOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={cityOpen}
            >
              {cityOptions.find(o => o.value === city)?.label || 'Город'}
            </button>
            {cityOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {cityOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === city}
                    className={`${styles.dropdownItem} ${opt.value === city ? styles.active : ''}`}
                    onClick={() => {
                      setCity(opt.value)
                      setCityOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className={styles.filtersRow}>
          <div 
            ref={officeRef}
            className={`${styles.dropdown} ${officeOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setOfficeOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={officeOpen}
            >
              {officeOptions.find(o => o.value === office)?.label || 'Офис'}
            </button>
            {officeOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {officeOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === office}
                    className={`${styles.dropdownItem} ${opt.value === office ? styles.active : ''}`}
                    onClick={() => {
                      setOffice(opt.value)
                      setOfficeOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className={styles.archiveList}>
        {requests.length === 0 ? (
          <div className={styles.emptyState}>Нет архивных заявок</div>
        ) : (
          requests.map((request) => (
            <ArchiveRequestCard
              key={request.id}
              request={request}
              onClick={handleRequestClick}
            />
          ))
        )}
      </div>

      {requests.length > 0 && hasMore && (
        <div className={styles.loadMoreContainer}>
          <button className={styles.loadMoreButton} onClick={handleLoadMore}>
            ЕЩЕ
          </button>
        </div>
      )}

      <RequestViewModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

