'use client'

import styles from './RequestCard.module.scss'

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

export default function RequestCard({ request, isDragging, onDragStart, onDragEnd, onClick, draggable = true }) {
  const priorityLabel = priorityLabels[request.priority] || request.priority
  const issueTypeLabel = issueTypeLabels[request.issueType] || request.issueType
  const formattedDate = formatDate(request.createdAt)
  const isCompleted = request.status === 'completed'

  const handleClick = (e) => {
    if (onClick && !isDragging) {
      e.stopPropagation()
      onClick(request)
    }
  }

  const handleDragStart = (e) => {
    if (draggable && onDragStart) {
      onDragStart(e, request)
    } else {
      e.preventDefault()
    }
  }

  return (
    <div
      className={`${styles.requestCard} ${isDragging ? styles.dragging : ''} ${isCompleted ? styles.completed : ''} ${styles[request.priority]}`}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={draggable ? onDragEnd : undefined}
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : (draggable ? 'grab' : 'default') }}
    >
      <div className={styles.header}>
        <div className={styles.requestId}>Заявка #{request.id}</div>
        <div className={`${styles.priority} ${styles[request.priority]} ${isCompleted ? styles.completed : ''}`}>
          {priorityLabel}
        </div>
      </div>
      <div className={styles.location}>{request.location}</div>
      <div className={styles.issueType}>Тип: {issueTypeLabel}</div>
      <div className={styles.date}>{formattedDate}</div>
    </div>
  )
}

