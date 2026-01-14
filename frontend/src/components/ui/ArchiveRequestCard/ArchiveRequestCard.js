'use client'

import styles from './ArchiveRequestCard.module.scss'

const priorityLabels = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
  urgent: 'Срочная',
}

const issueTypeLabels = {
  furniture: 'Мебель',
  hardware: 'Оборудование',
  software: 'Программное обеспечение',
  network: 'Сеть',
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ]
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day} ${month}, ${hours}:${minutes}`
}

function formatPerformerName(performer) {
  if (!performer) return 'Не назначен'
  const firstName = performer.first_name || ''
  const lastName = performer.last_name || ''
  const middleName = performer.middle_name || ''
  
  if (lastName && firstName) {
    const initials = middleName ? `${middleName.charAt(0)}.` : ''
    return `${lastName} ${firstName.charAt(0)}. ${initials}`.trim()
  }
  return performer.username || 'Не назначен'
}

export default function ArchiveRequestCard({ request, onClick }) {
  const priorityLabel = priorityLabels[request.priority] || request.priority
  const issueTypeLabel = issueTypeLabels[request.issueType] || request.issueType
  const formattedDate = formatDate(request.createdAt)
  const performerName = formatPerformerName(request.performer)

  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation()
      onClick(request)
    }
  }

  return (
    <div
      className={styles.archiveCard}
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardContent}>
          <div className={styles.location}>{request.location}</div>
          <div className={styles.issueType}>Тип: {issueTypeLabel}</div>
          <div className={styles.performer}>Исполнитель: {performerName}</div>
          <div className={styles.date}>{formattedDate}</div>
        </div>
        <div className={styles.priority}>
          {priorityLabel}
        </div>
      </div>
    </div>
  )
}

