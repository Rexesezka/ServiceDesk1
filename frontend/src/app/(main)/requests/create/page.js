'use client'

import { useForm } from 'react-hook-form'
import styles from './create.module.scss'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/context/NotificationsContext'

// Базовый URL для Django API
// В production задаётся через переменную окружения NEXT_PUBLIC_API_BASE_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function CreateRequestPage() {
  const router = useRouter()
  const { showNotification } = useNotifications() || {}
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm({
    defaultValues: {
      priority: '',
      address: '',
      employeeLocation: '',
      issueType: '',
      locationDescription: '',
      problemDescription: '',
    }
  })
  const priorityValue = watch('priority')
  const [priorityOpen, setPriorityOpen] = useState(false)
  const dropdownRef = useRef(null)
  const issueTypeValue = watch('issueType')
  const [issueOpen, setIssueOpen] = useState(false)
  const issueDropdownRef = useRef(null)
  const [attachedImages, setAttachedImages] = useState([])
  const [attachedPreviews, setAttachedPreviews] = useState([])
  const fileInputRef = useRef(null)
  const [offices, setOffices] = useState([])
  const [selectedOfficeId, setSelectedOfficeId] = useState('')
  const [officeOpen, setOfficeOpen] = useState(false)
  const officeDropdownRef = useRef(null)

  // Функции для взаимного закрытия dropdown'ов
  const togglePriorityDropdown = () => {
    setPriorityOpen(prev => !prev)
    setIssueOpen(false)
    setOfficeOpen(false)
  }

  const toggleIssueDropdown = () => {
    setIssueOpen(prev => !prev)
    setPriorityOpen(false)
    setOfficeOpen(false)
  }

  const toggleOfficeDropdown = () => {
    setOfficeOpen(prev => !prev)
    setPriorityOpen(false)
    setIssueOpen(false)
  }

  const handleTextareaInput = (e) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.max(68, el.scrollHeight) + 'px'
  }

  // Загружаем список офисов и подставляем офис пользователя по умолчанию
  useEffect(() => {
    const loadOffices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/offices/filters/`)
        if (!response.ok) {
          throw new Error('Ошибка при загрузке списка офисов')
        }
        const data = await response.json()
        if (data.success && Array.isArray(data.offices)) {
          setOffices(data.offices)

          // Пытаемся определить офис пользователя по адресу из localStorage
          if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('user')
            if (userData) {
              try {
                const user = JSON.parse(userData)
                const userOfficeAddress = user?.officeAddress
                if (userOfficeAddress) {
                  const matchedOffice = data.offices.find(
                    (o) => o.address === userOfficeAddress
                  )
                  if (matchedOffice) {
                    const idStr = String(matchedOffice.id)
                    setSelectedOfficeId(idStr)
                    setValue('address', matchedOffice.address, { shouldValidate: true })
                  }
                }
              } catch (e) {
                console.error('Ошибка при разборе данных пользователя:', e)
              }
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке офисов:', error)
      }
    }

    loadOffices()
  }, [setValue])

  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPriorityOpen(false)
      }
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(e.target)) {
        setIssueOpen(false)
      }
      if (officeDropdownRef.current && !officeDropdownRef.current.contains(e.target)) {
        setOfficeOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file))
    setAttachedImages((prev) => [...prev, ...imageFiles])
    setAttachedPreviews((prev) => [...prev, ...newPreviews])

    // Reset input to allow re-selecting the same file
    e.target.value = ''
  }

  const removeAttachmentAt = (indexToRemove) => {
    setAttachedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    setAttachedPreviews((prev) => {
      const toRevoke = prev[indexToRemove]
      if (toRevoke) {
        try { URL.revokeObjectURL(toRevoke) } catch {}
      }
      return prev.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const priorityOptions = [
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
    { value: 'urgent', label: 'Критический' },
  ]
  const issueTypeOptions = [
    { value: 'access', label: 'Доступ' },
    { value: 'hardware', label: 'Оборудование' },
    { value: 'software', label: 'ПО' },
    { value: 'network', label: 'Сеть' },
    { value: 'other', label: 'Другое' },
  ]

  const onSubmit = async (data) => {
    try {
      // Получаем user_id из localStorage
      const userData = localStorage.getItem('user')
      if (!userData) {
        showNotification('Необходимо войти в систему', 'error')
        router.push('/')
        return
      }

      const user = JSON.parse(userData)
      if (!user || !user.id) {
        showNotification('Ошибка: пользователь не найден', 'error')
        router.push('/')
        return
      }

      // Создаем FormData для отправки файлов
      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('issueType', data.issueType)
      formData.append('priority', data.priority)
      formData.append('problemDescription', data.problemDescription)
      // Адрес офиса (основное поле для office_location на бэкенде)
      formData.append('address', data.address)
      if (selectedOfficeId) {
        formData.append('office_id', selectedOfficeId)
      }
      // Описание локации внутри офиса (опционально)
      formData.append('locationDescription', data.locationDescription)
      
      if (data.employeeLocation) {
        formData.append('employeeLocation', data.employeeLocation)
      }

      // Добавляем изображения
      attachedImages.forEach((file, index) => {
        formData.append('attachments', file)
      })

      // Отправляем запрос на сервер
      const response = await fetch(`${API_BASE_URL}/api/requests/create/`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        showNotification('Заявка успешно создана!', 'success')
        
        // Очищаем превью
        try {
          attachedPreviews.forEach((src) => {
            try { URL.revokeObjectURL(src) } catch {}
          })
        } catch {}
        
        // Очищаем форму
        reset()
        setAttachedImages([])
        setAttachedPreviews([])
        
        // Перенаправляем на страницу заявок
        setTimeout(() => {
          router.push('/requests')
        }, 1000)
      } else {
        showNotification(result.error || 'Ошибка при создании заявки', 'error')
      }
    } catch (error) {
      console.error('Ошибка при создании заявки:', error)
      showNotification('Ошибка при подключении к серверу', 'error')
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Создание заявки</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        {/* Приоритет */}
        <div className={styles.fieldGroup}>
          <input type="hidden" id="priority" {...register('priority', { required: 'Выберите приоритет' })} value={priorityValue} readOnly />
          <div
            ref={dropdownRef}
            className={`${styles.dropdown} ${styles.prioritySelect} ${priorityOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={togglePriorityDropdown}
              aria-haspopup="listbox"
              aria-expanded={priorityOpen}
            >
              {priorityOptions.find(o => o.value === priorityValue)?.label || 'Приоритет'}
            </button>
            {priorityOpen && (
              <ul className={styles.dropdownMenu} role="listbox" aria-labelledby="priority">
                {priorityOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === priorityValue}
                    className={`${styles.dropdownItem} ${opt.value === priorityValue ? styles.active : ''}`}
                    onClick={() => {
                      setValue('priority', opt.value, { shouldValidate: true, shouldDirty: true })
                      setPriorityOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.priority && <span className={styles.error}>{errors.priority.message}</span>}
        </div>

        {/* Офис и адрес (офис выбирается из выпадающего списка, адрес подставляется автоматически) */}
        <div className={styles.fieldGroup}>
          <div
            ref={officeDropdownRef}
            className={`${styles.dropdown} ${styles.field40} ${officeOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={toggleOfficeDropdown}
              aria-haspopup="listbox"
              aria-expanded={officeOpen}
            >
              {selectedOfficeId 
                ? offices.find((o) => String(o.id) === String(selectedOfficeId))?.address || 'Выберите офис'
                : 'Выберите офис'}
            </button>
            {officeOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {offices.map((office) => (
                  <li
                    key={office.id}
                    role="option"
                    aria-selected={String(office.id) === String(selectedOfficeId)}
                    className={`${styles.dropdownItem} ${String(office.id) === String(selectedOfficeId) ? styles.active : ''}`}
                    onClick={() => {
                      setSelectedOfficeId(String(office.id))
                      setValue('address', office.address, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                      setOfficeOpen(false)
                    }}
                  >
                    {office.address}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Скрытое поле адреса, которое уходит на бэкенд */}
          <input
            type="hidden"
            {...register('address', {
              required: 'Адрес обязателен',
              minLength: { value: 3, message: 'Минимум 3 символа' },
              maxLength: { value: 200, message: 'Максимум 200 символов' },
            })}
          />
          {errors.address && (
            <span className={styles.error}>{errors.address.message}</span>
          )}
          <span className={styles.hint}>
            Изначально выбран офис, к которому Вы привязаны. При необходимости выберите другой адрес из списка.
          </span>
        </div>

        {/* Место сотрудника (необязательно) */}
        <div className={styles.fieldGroup}>
          <input
            id="employeeLocation"
            type="text"
            placeholder="Место сотрудника"
            {...register('employeeLocation')}
            className={`${styles.input} ${styles.field40} ${styles.noBorder}`}
          />
          <span className={styles.hint}>Это поле необязательно к заполнению</span>
        </div>

        {/* Тип поломки */}
        <div className={styles.fieldGroup}>
          <input type="hidden" id="issueType" {...register('issueType', { required: 'Выберите тип поломки' })} value={issueTypeValue} readOnly />
          <div
            ref={issueDropdownRef}
            className={`${styles.dropdown} ${styles.prioritySelect} ${issueOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={toggleIssueDropdown}
              aria-haspopup="listbox"
              aria-expanded={issueOpen}
            >
              {issueTypeOptions.find(o => o.value === issueTypeValue)?.label || 'Тип поломки'}
            </button>
            {issueOpen && (
              <ul className={styles.dropdownMenu} role="listbox" aria-labelledby="issueType">
                {issueTypeOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === issueTypeValue}
                    className={`${styles.dropdownItem} ${opt.value === issueTypeValue ? styles.active : ''}`}
                    onClick={() => {
                      setValue('issueType', opt.value, { shouldValidate: true, shouldDirty: true })
                      setIssueOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.issueType && <span className={styles.error}>{errors.issueType.message}</span>}
        </div>

        {/* Описание локации */}
        <div className={styles.fieldGroup}>
          <textarea
            id="locationDescription"
            rows={1}
            placeholder="Описание локации"
            {...register('locationDescription', {
              required: 'Опишите локацию',
              minLength: { value: 3, message: 'Минимум 3 символа' },
            })}
            className={styles.textarea}
            onInput={handleTextareaInput}
          />
          {errors.locationDescription && <span className={styles.error}>{errors.locationDescription.message}</span>}
        </div>

        {/* Описание проблемы */}
        <div className={styles.fieldGroup}>
          <textarea
            id="problemDescription"
            rows={6}
            placeholder="Описание проблемы"
            {...register('problemDescription', {
              required: 'Описание проблемы обязательно',
              minLength: { value: 10, message: 'Минимум 10 символов' },
            })}
            className={styles.textarea}
            onInput={handleTextareaInput}
          />
          {errors.problemDescription && <span className={styles.error}>{errors.problemDescription.message}</span>}
        </div>

        <div className={styles.attach} onClick={handleAttachClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAttachClick() }}>
          <Image
            src={"/assets/add_photo.svg"}
            width={13}
            height={18}
            alt="Прикрепить"
          />
          <span className={styles.attachText}>Прикрепить фото</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          style={{ display: 'none' }}
        />

        {attachedPreviews.length > 0 && (
          <div className={styles.previews}>
            {attachedPreviews.map((src, idx) => {
              const key = `${src}-${idx}`
              return (
                <div
                  key={key}
                  className={styles.previewItem}
                  onClick={() => removeAttachmentAt(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') removeAttachmentAt(idx) }}
                  aria-label="Удалить вложение"
                  title="Удалить"
                >
                  <img className={styles.previewImage} src={src} alt={`Превью ${idx + 1}`} />
                  <div className={styles.previewOverlay}>
                    <span className={styles.previewCross} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Отправка...' : 'Создать'}
          </button>
          
        </div>
      </form>
    </div>
  )
}


