import puppeteer from 'puppeteer'
import axios from 'axios'
import dotenv from 'dotenv'

//Load the api key for google maps
dotenv.config()
const apiKey = process.env.GOOGLE_API_KEY

// This uses all the helper functions in order to get the data we want
export const getFacilityDetailsForSubmission = async (submittedURL: string): Promise<any | null> => {
  try {
    const coordinatesFromUrl = {
      latitude: '',
      longitude: ''
    }

    const redirectedUrl = await extractRedirectedUrl(submittedURL)
    
    if(redirectedUrl){
    validateGoogleMapsUrl(redirectedUrl)
    } else {
      return
    }
    
    // regex to extract the full coordinates from url
    const regexToExtractGoogleMapsCoordinates = /@(-?\d+\.\d+),(-?\d+\.\d+),/
    const match = redirectedUrl ? redirectedUrl.match(regexToExtractGoogleMapsCoordinates) : null

    if (match) {
    coordinatesFromUrl.latitude = match[1]
    coordinatesFromUrl.longitude = match[2]
    } else {
    console.error('No coordinates found in the URL.')
    return null
    }
    if (coordinatesFromUrl) {
      const addressDetails = await getGoogleMapUrlLocationDetails(coordinatesFromUrl.latitude, coordinatesFromUrl.longitude, apiKey as string)
      if (!addressDetails || addressDetails.length === 0) {
        throw new Error('No address details found.')
      }

      const parsedAddressFromGooglePlacesAPI = parseAddressForUpdatedSubmission(addressDetails[0].formattedAddress, addressDetails)

      return parsedAddressFromGooglePlacesAPI
    } else {
      throw new Error('Could not extract coordinates.')
    }
  } catch (error) {
    console.error('Error in getFacilityDetailsForSubmission:', error)
    throw error
  }
}

/** 
*Extracts the desktop URL from all submissions due to the variety of google map url formats. They are different on iPhone, Android, and desktop and only the dekstop URL has the coordinates
* @param {string} submittedURL - the submitted URL from the user
* @returns {string} returns the desktop url
*/
const extractRedirectedUrl = async (submittedURL: string): Promise<string | void> => {
  const browser = await puppeteer.launch({ headless: true }) // ensures it doesn't open an actual browser

  try {
    const desktopPage = await browser.newPage()
    await desktopPage.goto(submittedURL, {
      waitUntil: 'networkidle0', // Ensures that the network desktopPage has loaded to have coordinates
      timeout: 120000, // long timeout so that it has time to redirect. Google redirects twice from mobile links
    })
    return desktopPage.url()
  } catch (error) {
    console.error('Error extracting redirected URL:', error)
  } finally {
    await browser.close()
  }
}

// This function uses the places api to get the closest clinic to the coordinates in the url
const getGoogleMapUrlLocationDetails = async (latitude: string, longitude: string, apiKey: string): Promise<any | null> => {
  const url = 'https://places.googleapis.com/v1/places:searchText'

  // body that gives parameters to the google places API
  const requestBodyForGooglePlacesAPI = {
    pageSize: 1,
    rankPreference: 'DISTANCE',
    textQuery: 'clinic or hospital',
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

  const headersForGooglePlacesAPI = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': '*'
  }

  try {
    const responseFromGooglePlacesAPI = await axios.post(url, requestBodyForGooglePlacesAPI, {
      headers: headersForGooglePlacesAPI
    })

    const placeDataForSubmission = responseFromGooglePlacesAPI.data.places || []

    if (placeDataForSubmission.length) {
      return placeDataForSubmission
    } else {
      console.error('No hospitals or clinics found for the given coordinates.')
      return null
    }
  } catch (error) {
    console.error('Error fetching nearby locations:', error)
    throw error
  }
}

const validateGoogleMapsUrl = async (redirectedUrl:string) => {
  try {
    const regexToValidateGoogleMapsUrl = /^(http(s?)\:\/\/)?((maps\.google\.[a-z]+\/)|((www\.)?google\.[a-z]+\/maps\/)|(goo\.gl\/maps\/)).*/

    if (!redirectedUrl.match(regexToValidateGoogleMapsUrl)) {
      console.error(`${redirectedUrl} is not a valid Google Maps URL`)
      return
    }
  } catch (error) {
    console.error('Error during URL validation:', error)
  }
}

const extractPostalCode = (addressParts: string[]): string => {
  for (const part of addressParts) {
    const match = part.match(/(\d{3}-\d{4})/)
    if (match) return match[1]
  }
  return ''
}

const extractPrefecture = (addressParts: string[]): string => {
  const prefectures = ['Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima', 'Ibaraki', 'Tochigi', 'Gumma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa', 'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara', 'Wakayama', 'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi', 'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa']
  for (const part of addressParts) {
    if (prefectures.includes(part.trim())) return part.trim()
  }
  return ''
}

const extractAddressLines = (addressParts: string[]): { line1: string, line2: string } => {
  let line1 = ''
  let line2 = ''
  
  for (let i = 0; i < addressParts.length; i++) {
    if (addressParts[i].match(/\d{1,2} Chome/)) {
      line1 = addressParts.slice(i, i + 2).join(', ')
      line2 = addressParts.slice(i + 2).join(', ')
      break
    }
  }

  return { line1, line2 }
}

const parseAddressForUpdatedSubmission = (formattedAddress: string, addressDetails: any) => {
  const addressParts = formattedAddress.split(',').map(part => part.trim())

  console.log('parts', addressParts)

  const extractedPostalCodeFromInformation = extractPostalCode(addressParts)
  const extractPrefectureEnFromInformation = extractPrefecture(addressParts)
  
  const extractedAddressLineEn = extractAddressLines(addressParts)

  const extractedNameEn = addressDetails[0].displayName?.text || ''
  const extractedPhoneNumber = `81-${addressDetails[0].nationalPhoneNumber}` || ''
  const extractedWebsite = addressDetails[0].websiteUri || ''
  const extractedGoogleMapsURI = addressDetails[0].googleMapsUri || ''
  const extractedMapLatitude = parseFloat(addressDetails[0].location.latitude) || null
  const extractedMapLongitude = parseFloat(addressDetails[0].location.longitude) || null

  return {
    extractedPostalCodeFromInformation,
    extractPrefectureEnFromInformation,
    extractedNameEn,
    extractedPhoneNumber,
    extractedWebsite,
    extractedAddressLine1En: extractedAddressLineEn.line1 || '',
    extractedAddressLine2En: extractedAddressLineEn.line2 || '',
    extractedGoogleMapsURI,
    extractedMapLatitude,
    extractedMapLongitude
  }
}
