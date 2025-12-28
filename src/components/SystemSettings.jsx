import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import toast from 'react-hot-toast'

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    timeWindow: {
      checkInStart: '09:00',
      checkInEnd: '09:30',
      checkOutStart: '17:00',
      checkOutEnd: '18:00',
      enabled: true,
    },
    productivity: {
      minActiveTime: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
      minTasksCompleted: 3,
      enabled: true,
    },
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const [timeWindowDoc, productivityDoc] = await Promise.all([
        getDoc(doc(db, 'settings', 'timeWindow')),
        getDoc(doc(db, 'settings', 'productivity')),
      ])

      if (timeWindowDoc.exists()) {
        setSettings((prev) => ({
          ...prev,
          timeWindow: { ...prev.timeWindow, ...timeWindowDoc.data() },
        }))
      }

      if (productivityDoc.exists()) {
        const productivityData = productivityDoc.data()
        setSettings((prev) => ({
          ...prev,
          productivity: {
            ...prev.productivity,
            ...productivityData,
            minActiveTime: productivityData.minActiveTime || prev.productivity.minActiveTime,
          },
        }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await Promise.all([
        setDoc(doc(db, 'settings', 'timeWindow'), settings.timeWindow),
        setDoc(doc(db, 'settings', 'productivity'), settings.productivity),
      ])
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const convertMsToHours = (ms) => ms / (60 * 60 * 1000)
  const convertHoursToMs = (hours) => hours * 60 * 60 * 1000

  if (loading) {
    return (
      <div className="clay-card p-6">
        <div className="text-center py-8">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="clay-card p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">System Settings</h2>

      {/* Time Window Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-700">Time Window Settings</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.timeWindow.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  timeWindow: { ...settings.timeWindow, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.timeWindow.enabled && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/30 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Start
              </label>
              <input
                type="time"
                value={settings.timeWindow.checkInStart}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timeWindow: { ...settings.timeWindow, checkInStart: e.target.value },
                  })
                }
                className="w-full px-3 py-2 clay-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in End
              </label>
              <input
                type="time"
                value={settings.timeWindow.checkInEnd}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timeWindow: { ...settings.timeWindow, checkInEnd: e.target.value },
                  })
                }
                className="w-full px-3 py-2 clay-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out Start
              </label>
              <input
                type="time"
                value={settings.timeWindow.checkOutStart}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timeWindow: { ...settings.timeWindow, checkOutStart: e.target.value },
                  })
                }
                className="w-full px-3 py-2 clay-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out End
              </label>
              <input
                type="time"
                value={settings.timeWindow.checkOutEnd}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timeWindow: { ...settings.timeWindow, checkOutEnd: e.target.value },
                  })
                }
                className="w-full px-3 py-2 clay-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Productivity Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-700">Productivity Validation</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.productivity.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  productivity: { ...settings.productivity, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.productivity.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/30 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Active Time (hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={convertMsToHours(settings.productivity.minActiveTime)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    productivity: {
                      ...settings.productivity,
                      minActiveTime: convertHoursToMs(parseFloat(e.target.value) || 0),
                    },
                  })
                }
                className="w-full px-3 py-2 clay-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Tasks Completed
              </label>
              <input
                type="number"
                min="0"
                value={settings.productivity.minTasksCompleted}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    productivity: {
                      ...settings.productivity,
                      minTasksCompleted: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 clay-input"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}

export default SystemSettings

