'use client'

import { useState } from 'react'
import styles from './InputField.module.scss'

export default function InputField({ 
  label, 
  type = "text", 
  name, 
  id, 
  required = false, 
  placeholder = "",
  value = "",
  onChange = () => {}
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  
  const isPasswordField = type === 'password'
  const inputType = isPasswordField ? (isPasswordVisible ? 'text' : 'password') : type
  
  const togglePasswordVisibility = () => {
    if (isPasswordField) {
      setIsPasswordVisible(prev => !prev)
    }
  }
  
  return (
    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={styles.inputWrapper}>
        <input 
          type={inputType}
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {isPasswordField && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={togglePasswordVisibility}
            aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {isPasswordVisible ? (
              <img src="/assets/eye_closed.svg" alt="Скрыть пароль" />
            ) : (
              <img src="/assets/eye.svg" alt="Показать пароль" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
