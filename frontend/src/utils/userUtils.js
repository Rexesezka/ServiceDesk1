/**
 * Парсит полное ФИО на отдельные части
 * @param {string} fullName - Полное ФИО в формате "Фамилия Имя Отчество"
 * @returns {Object} - Объект с полями { lastName, firstName, middleName }
 */
export function parseFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return {
      lastName: '',
      firstName: '',
      middleName: ''
    }
  }

  const parts = fullName.trim().split(/\s+/)
  
  if (parts.length === 0) {
    return {
      lastName: '',
      firstName: '',
      middleName: ''
    }
  }

  if (parts.length === 1) {
    return {
      lastName: parts[0],
      firstName: '',
      middleName: ''
    }
  }

  if (parts.length === 2) {
    return {
      lastName: parts[0],
      firstName: parts[1],
      middleName: ''
    }
  }

  // Если 3 или больше частей, первые три - это Фамилия, Имя, Отчество
  return {
    lastName: parts[0],
    firstName: parts[1],
    middleName: parts.slice(2).join(' ') // На случай, если отчество состоит из нескольких слов
  }
}

/**
 * Формирует полное ФИО из отдельных частей
 * @param {Object} nameParts - Объект с полями { lastName, firstName, middleName }
 * @returns {string} - Полное ФИО
 */
export function buildFullName(nameParts) {
  if (!nameParts) return ''
  
  const { lastName = '', firstName = '', middleName = '' } = nameParts
  const parts = [lastName, firstName, middleName].filter(Boolean)
  
  return parts.join(' ')
}

