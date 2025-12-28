import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { calculateScore, calculateStreak } from '../utils/gamification'

const GamificationDisplay = () => {
  const { currentUser } = useAuth()
  const [scoreData, setScoreData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    const loadGamificationData = async () => {
      try {
        setLoading(true)
        const score = await calculateScore(currentUser.uid)
        setScoreData(score)
      } catch (error) {
        console.error('Error loading gamification data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGamificationData()
    const interval = setInterval(loadGamificationData, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [currentUser])

  if (loading) {
    return (
      <div className="clay-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!scoreData) {
    return null
  }

  const levelProgress = scoreData.levelProgress || 0

  return (
    <div className="clay-card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Your Performance</h2>
      
      {/* Level and Score */}
      <div className="text-center space-y-2">
        <div className="text-4xl font-bold text-gray-800">Level {scoreData.level}</div>
        <div className="text-2xl font-semibold text-blue-600">{scoreData.totalScore} Points</div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress to Level {scoreData.level + 1}</span>
          <span>{levelProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>

      {/* Streak */}
      <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Current Streak</p>
            <p className="text-2xl font-bold text-orange-600">
              {scoreData.streak?.currentStreak || 0} days 🔥
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Best Streak</p>
            <p className="text-xl font-semibold text-gray-800">
              {scoreData.streak?.longestStreak || 0} days
            </p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Score Breakdown</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Attendance</span>
            <span className="font-medium">{scoreData.breakdown?.baseAttendance || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Streak Bonus</span>
            <span className="font-medium text-orange-600">+{scoreData.breakdown?.streakBonus || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Punctuality</span>
            <span className="font-medium text-green-600">+{scoreData.breakdown?.punctualityBonus || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Consistency</span>
            <span className="font-medium text-blue-600">+{scoreData.breakdown?.consistencyBonus || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GamificationDisplay

