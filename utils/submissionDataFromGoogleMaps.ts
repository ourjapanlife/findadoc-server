import puppeteer from 'puppeteer'
import dotenv from 'dotenv'

//Load the api key for google maps
dotenv.config()

// This function ensures that we can redirect in a headerless browser using puppeteer to extract url once it has coordinates
const extractRedirectedUrl = async (initialUrl: string): Promise<string> => {
  const browser = await puppeteer.launch({ headless: true }) // ensures it doesn't open an actual browser

  try {
    const page = await browser.newPage()
    await page.goto(initialUrl, {
      waitUntil: 'networkidle0', // Ensures that the network page has loaded to have coordinates
      timeout: 120000, // long timeout so that it has time to redirect. Google redirects twice from mobile links
    })
    return page.url()
  } catch (error) {
    console.error('Error extracting redirected URL:', error)
    throw error
  } finally {
    await browser.close()
  }
}

// Extract the coordinates from the extracted google maps url
const extractCoordinatesFromRedirectedUrl = (url: string): { latitude: string, longitude: string } | null => {
  // regex to extract the full coordinates from url
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+),/
  const match = url.match(regex)

  if (match) {
    const latitude = match[1]
    const longitude = match[2]
    return { latitude, longitude }
  } else {
    console.error('No coordinates found in the URL.')
    return null
  }
}



// This function uses the places api to get the closest clinic to the coordinates in the url
const getNearbyLocationsFromCoordinates = async (latitude: string, longitude: string, apiKey: string): Promise<any | null> => {
  const url = 'https://places.googleapis.com/v1/places:searchText'

  // body that gives parameters to the google places API
  const requestBody = {
    pageSize: 1,
    rankPreference: "DISTANCE",
    textQuery: "clinic or hospital",
    locationBias: {
      circle: {
        center: {
          latitude: latitude,
          longitude: longitude
        },
        radius: 30.0
      }
    }
  }

  // options uses in the headers to tell what data
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': '*'
    },
    body: JSON.stringify(requestBody)
  }

  try {
    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const results = data.places || []

    if (results.length) {
      return results
    } else {
      console.error('No hospitals or clinics found for the given coordinates.')
      return null
    }
  } catch (error) {
    console.error('Error fetching nearby locations:', error)
    throw error
  }
}


// This uses all the helper functions in order to get the data we want
const getFacilityDetailsForSubmission = async (initialUrl: string, apiKey: string): Promise<any | null> => {
  try {
    const redirectedUrl = await extractRedirectedUrl(initialUrl)
    const coordinates = extractCoordinatesFromRedirectedUrl(redirectedUrl)
    if (coordinates) {
      const addressDetails = await getNearbyLocationsFromCoordinates(coordinates.latitude, coordinates.longitude, apiKey)
      console.log(addressDetails)
      return addressDetails
    } else {
      throw new Error('Could not extract coordinates.')
    }
  } catch (error) {
    console.error('Error in getFacilityDetailsForSubmission:', error)
    throw error
  }
}

// Exporting the function to the files where it needs to be used
export { getFacilityDetailsForSubmission }

// Testing the code above using an apple link for Tokyo Midtown Clinic. You must enter your api key if you want to test it
const initialUrl = 'https://maps.app.goo.gl/JwogYMa2dEzX248EA?g_st=iw'
const apiKey = process.env.GOOGLE_MAPS_API_KEY

getFacilityDetailsForSubmission(initialUrl, apiKey as string)