import { useEffect, useState } from "react";
import "./Settings.css";

const SETTINGS_STORAGE_KEY = "sams-faculty-settings";

const DEFAULT_SETTINGS = {
  theme: "light",
  sidebar: "expanded",
  attendanceView: "list",
  confirmBeforeStart: true,
  sessionNotifications: true,
  attendanceAlerts: true,
  reportAvailability: true,
  systemAnnouncements: true,
};

const loadSettings = () => {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!storedSettings) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(storedSettings),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(settings)
    );

    if (settings.theme === "dark") {
      document.documentElement.setAttribute("data-faculty-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-faculty-theme", "light");
    }

    window.dispatchEvent(
      new CustomEvent("faculty-settings-change", {
        detail: settings,
      })
    );
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaveMessage("Settings saved.");
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaveMessage("Settings restored to default.");
  };

  const renderRadioOption = (
    name,
    value,
    label,
    currentValue,
    onChange
  ) => (
    <label className="faculty-settings-radio-option">
      <input
        type="radio"
        name={name}
        value={value}
        checked={currentValue === value}
        onChange={() => onChange(value)}
      />
      <span>{label}</span>
    </label>
  );

  return (
    <div className="faculty-settings-page">
      <section className="faculty-settings-header">
        <div>
          <span className="faculty-settings-eyebrow">
            FACULTY PORTAL
          </span>

          <h1>Settings</h1>

          <p>
            Manage your faculty portal preferences and attendance
            settings.
          </p>
        </div>

        <span className="faculty-settings-system-status">
          <span className="faculty-settings-status-dot" />
          System Operational
        </span>
      </section>

      {saveMessage && (
        <div className="faculty-settings-save-message">
          <span>✓</span>
          {saveMessage}
        </div>
      )}

      {/* Appearance */}

      <section className="faculty-settings-section">
        <div className="faculty-settings-section-heading">
          <h2>Appearance</h2>
          <p>Customize how the faculty portal looks and behaves.</p>
        </div>

        <div className="faculty-settings-card">
          <div className="faculty-settings-row">
            <div className="faculty-settings-row-content">
              <h3>Theme</h3>
              <p>
                Choose the appearance used throughout the faculty
                portal.
              </p>
            </div>

            <div className="faculty-settings-radio-group">
              {renderRadioOption(
                "theme",
                "light",
                "Light",
                settings.theme,
                (value) => updateSetting("theme", value)
              )}

              {renderRadioOption(
                "theme",
                "dark",
                "Dark",
                settings.theme,
                (value) => updateSetting("theme", value)
              )}

              {renderRadioOption(
                "theme",
                "system",
                "System",
                settings.theme,
                (value) => updateSetting("theme", value)
              )}
            </div>
          </div>

          <div className="faculty-settings-divider" />

          <div className="faculty-settings-row">
            <div className="faculty-settings-row-content">
              <h3>Sidebar</h3>
              <p>
                Choose whether the Faculty sidebar starts expanded
                or compact.
              </p>
            </div>

            <div className="faculty-settings-radio-group">
              {renderRadioOption(
                "sidebar",
                "expanded",
                "Expanded",
                settings.sidebar,
                (value) => updateSetting("sidebar", value)
              )}

              {renderRadioOption(
                "sidebar",
                "compact",
                "Compact",
                settings.sidebar,
                (value) => updateSetting("sidebar", value)
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Attendance Preferences */}

      <section className="faculty-settings-section">
        <div className="faculty-settings-section-heading">
          <h2>Attendance Preferences</h2>
          <p>
            Configure your preferred attendance workflow.
          </p>
        </div>

        <div className="faculty-settings-card">
          <div className="faculty-settings-row">
            <div className="faculty-settings-row-content">
              <h3>Default Attendance View</h3>
              <p>
                Select the preferred view when working with attendance
                records.
              </p>
            </div>

            <div className="faculty-settings-radio-group">
              {renderRadioOption(
                "attendance-view",
                "list",
                "List View",
                settings.attendanceView,
                (value) => updateSetting("attendanceView", value)
              )}

              {renderRadioOption(
                "attendance-view",
                "session",
                "Session View",
                settings.attendanceView,
                (value) => updateSetting("attendanceView", value)
              )}
            </div>
          </div>

          <div className="faculty-settings-divider" />

          <div className="faculty-settings-toggle-row">
            <div className="faculty-settings-row-content">
              <h3>Confirmation Before Starting Attendance</h3>
              <p>
                Ask for confirmation before starting an attendance
                session.
              </p>
            </div>

            <button
              type="button"
              className={`faculty-settings-toggle ${
                settings.confirmBeforeStart ? "active" : ""
              }`}
              onClick={() =>
                updateSetting(
                  "confirmBeforeStart",
                  !settings.confirmBeforeStart
                )
              }
              aria-pressed={settings.confirmBeforeStart}
              aria-label="Toggle confirmation before starting attendance"
            >
              <span />
            </button>
          </div>

          <div className="faculty-settings-divider" />

          <div className="faculty-settings-toggle-row">
            <div className="faculty-settings-row-content">
              <h3>Session Notifications</h3>
              <p>
                Receive notifications related to your attendance
                sessions.
              </p>
            </div>

            <button
              type="button"
              className={`faculty-settings-toggle ${
                settings.sessionNotifications ? "active" : ""
              }`}
              onClick={() =>
                updateSetting(
                  "sessionNotifications",
                  !settings.sessionNotifications
                )
              }
              aria-pressed={settings.sessionNotifications}
              aria-label="Toggle session notifications"
            >
              <span />
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}

      <section className="faculty-settings-section">
        <div className="faculty-settings-section-heading">
          <h2>Notifications</h2>
          <p>
            Manage the types of faculty notifications you want to
            receive.
          </p>
        </div>

        <div className="faculty-settings-card">
          <div className="faculty-settings-toggle-row">
            <div className="faculty-settings-row-content">
              <h3>Attendance Session Alerts</h3>
              <p>
                Notifications related to attendance sessions.
              </p>
            </div>

            <button
              type="button"
              className={`faculty-settings-toggle ${
                settings.attendanceAlerts ? "active" : ""
              }`}
              onClick={() =>
                updateSetting(
                  "attendanceAlerts",
                  !settings.attendanceAlerts
                )
              }
              aria-pressed={settings.attendanceAlerts}
              aria-label="Toggle attendance session alerts"
            >
              <span />
            </button>
          </div>

          <div className="faculty-settings-divider" />

          <div className="faculty-settings-toggle-row">
            <div className="faculty-settings-row-content">
              <h3>Report Availability</h3>
              <p>
                Notifications when attendance reports become
                available.
              </p>
            </div>

            <button
              type="button"
              className={`faculty-settings-toggle ${
                settings.reportAvailability ? "active" : ""
              }`}
              onClick={() =>
                updateSetting(
                  "reportAvailability",
                  !settings.reportAvailability
                )
              }
              aria-pressed={settings.reportAvailability}
              aria-label="Toggle report availability notifications"
            >
              <span />
            </button>
          </div>

          <div className="faculty-settings-divider" />

          <div className="faculty-settings-toggle-row">
            <div className="faculty-settings-row-content">
              <h3>System Announcements</h3>
              <p>
                Receive important announcements from the SAMS-FR
                system.
              </p>
            </div>

            <button
              type="button"
              className={`faculty-settings-toggle ${
                settings.systemAnnouncements ? "active" : ""
              }`}
              onClick={() =>
                updateSetting(
                  "systemAnnouncements",
                  !settings.systemAnnouncements
                )
              }
              aria-pressed={settings.systemAnnouncements}
              aria-label="Toggle system announcements"
            >
              <span />
            </button>
          </div>
        </div>
      </section>

      {/* System Information */}

      <section className="faculty-settings-section">
        <div className="faculty-settings-section-heading">
          <h2>System Information</h2>
          <p>Technical information about the SAMS-FR application.</p>
        </div>

        <div className="faculty-settings-system-card">
          <div>
            <span>Application</span>
            <strong>SAMS-FR</strong>
          </div>

          <div>
            <span>Version</span>
            <strong>1.0.0</strong>
          </div>

          <div>
            <span>Frontend</span>
            <strong>React + Vite</strong>
          </div>

          <div>
            <span>Backend</span>
            <strong>Flask</strong>
          </div>

          <div>
            <span>Database</span>
            <strong>MySQL</strong>
          </div>

          <div>
            <span>Recognition</span>
            <strong>Face Recognition</strong>
          </div>

          <div>
            <span>Environment</span>
            <strong>Development</strong>
          </div>

          <div>
            <span>Portal</span>
            <strong>Faculty</strong>
          </div>
        </div>
      </section>

      <section className="faculty-settings-actions">
        <div>
          <strong>Restore default preferences</strong>
          <p>
            Reset your faculty portal settings to their original
            defaults.
          </p>
        </div>

        <button
          type="button"
          className="faculty-settings-reset-button"
          onClick={handleReset}
        >
          Restore Defaults
        </button>
      </section>
    </div>
  );
}

export default Settings;