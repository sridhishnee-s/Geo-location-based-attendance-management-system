import * as XLSX from 'xlsx'
import { format } from 'date-fns'

/**
 * Export attendance data to CSV
 * @param {Array} data - Attendance records
 * @param {string} filename - Output filename
 */
export const exportToCSV = (data, filename = 'attendance') => {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Prepare data for CSV
  const csvData = data.map((record) => ({
    'Date': format(record.timestamp?.toDate() || new Date(record.timestamp), 'yyyy-MM-dd'),
    'Time': format(record.timestamp?.toDate() || new Date(record.timestamp), 'HH:mm:ss'),
    'User ID': record.userId,
    'Latitude': record.latitude,
    'Longitude': record.longitude,
    'Accuracy (m)': record.accuracy || 'N/A',
    'Status': record.status || 'present',
    'Validated': record.validated ? 'Yes' : 'No',
  }))

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(csvData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

  // Generate CSV
  const csv = XLSX.utils.sheet_to_csv(ws)
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export attendance data to Excel
 * @param {Array} data - Attendance records
 * @param {string} filename - Output filename
 */
export const exportToExcel = (data, filename = 'attendance') => {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Prepare data for Excel
  const excelData = data.map((record) => ({
    'Date': format(record.timestamp?.toDate() || new Date(record.timestamp), 'yyyy-MM-dd'),
    'Time': format(record.timestamp?.toDate() || new Date(record.timestamp), 'HH:mm:ss'),
    'User ID': record.userId,
    'Latitude': record.latitude,
    'Longitude': record.longitude,
    'Accuracy (m)': record.accuracy || 'N/A',
    'Status': record.status || 'present',
    'Validated': record.validated ? 'Yes' : 'No',
  }))

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

  // Download
  XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

