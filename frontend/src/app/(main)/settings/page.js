export default function SettingsPage() {
  return (
    <div className="settings-page">
      <h1>Настройки</h1>
      <div className="settings-sections">
        <div className="settings-section">
          <h3>Общие настройки</h3>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Уведомления по email
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" />
              Темная тема
            </label>
          </div>
        </div>
        <div className="settings-section">
          <h3>Безопасность</h3>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Двухфакторная аутентификация
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
