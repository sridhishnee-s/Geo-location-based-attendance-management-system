/**
 * Reverse geocode coordinates to get human-readable address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<Object>} - Address information
 */
export const reverseGeocode = async (latitude, longitude, apiKey) => {
  try {
    // Validate API key
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      throw new Error('Google Maps API key not configured')
    }

    // Use Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error('Geocoding API request failed')
    }

    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      const addressComponents = result.address_components || []
      
      // Extract address components
      let placeName = ''
      let streetAddress = ''
      let city = ''
      let state = ''
      let formattedAddress = result.formatted_address || ''
      
      addressComponents.forEach((component) => {
        const types = component.types
        if (types.includes('premise') || types.includes('establishment')) {
          placeName = component.long_name
        }
        if (types.includes('street_number') || types.includes('route')) {
          streetAddress = streetAddress 
            ? `${component.long_name} ${streetAddress}`
            : component.long_name
        }
        if (types.includes('locality')) {
          city = component.long_name
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.short_name
        }
      })
      
      return {
        success: true,
        placeName: placeName || formattedAddress.split(',')[0],
        formattedAddress,
        streetAddress: streetAddress || formattedAddress.split(',')[0],
        city: city || '',
        state: state || '',
        fullAddress: formattedAddress,
      }
    } else {
      throw new Error(data.status || 'No results found')
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return {
      success: false,
      error: error.message,
      placeName: 'Location',
      formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      streetAddress: '',
      city: '',
      state: '',
      fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    }
  }
}

/**
 * Get Google Maps API key from environment variables
 * @returns {string} - API key or placeholder
 */
export const getGoogleMapsApiKey = () => {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
}

