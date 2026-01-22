/**
 * Load Google Maps JavaScript API dynamically
 * @returns {Promise<void>}
 */
export const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps API')))
      return
    }

    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey.trim() === '') {
      const errorMsg = 'Google Maps API key not configured. Please:\n1. Create a .env file in the root directory\n2. Add: VITE_GOOGLE_MAPS_API_KEY=your-api-key-here\n3. Restart the development server'
      console.error(errorMsg)
      reject(new Error(errorMsg))
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log('Google Maps API loaded successfully')
      resolve()
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps API')
      reject(new Error('Failed to load Google Maps API'))
    }

    document.head.appendChild(script)
  })
}

