import puppeteer from 'puppeteer'
import axios from 'axios'
import { envVariables } from './environmentVariables.js'

//Load the api key for google maps
const apiKey = envVariables.googleAPIKey()

// This uses all the helper functions in order to get the data we want
export const getFacilityDetailsForSubmission = async (submittedURL: string): Promise<any | null> => {
  try {
    const coordinatesFromUrl = {
      latitude: '',
      longitude: ''
    }

    const redirectedUrl = await extractRedirectedUrl(submittedURL)
    
    if(!redirectedUrl){
      return
    } 
    validateGoogleMapsUrl(redirectedUrl)
    
    // regex to extract the full coordinates from url
    const regexToExtractGoogleMapsCoordinates = /@(-?\d+\.\d+),(-?\d+\.\d+),/
    const match = redirectedUrl ? redirectedUrl.match(regexToExtractGoogleMapsCoordinates) : null

    if (!match) {
      console.error('No coordinates found in the URL.')
      return null
    }

    coordinatesFromUrl.latitude = match[1]
    coordinatesFromUrl.longitude = match[2]
    
    if (coordinatesFromUrl) {
      const addressDetails = await getGoogleMapUrlLocationDetails(coordinatesFromUrl.latitude, coordinatesFromUrl.longitude, apiKey as string)
      if (!addressDetails || !addressDetails.length) {
        throw new Error('No address details found.')
      }

      const englishAddressForSubmission = addressDetails[0].addressComponents ? addressDetails[0].addressComponents : []

      if (!englishAddressForSubmission.length) {
        throw new Error('Address information is incomplete.')
      }

      const parsedGooglePlacesInfo = parseAddressForUpdatedSubmission(englishAddressForSubmission, addressDetails)

      console.log(parsedGooglePlacesInfo)

      return parsedGooglePlacesInfo
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

    if (!placeDataForSubmission.length) {
      console.error('No hospitals or clinics found for the given coordinates.')
      return null
    }
    return placeDataForSubmission
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

const extractPostalCode = (addressComponents: any) => {
  const extractedPostalCodeFromComponents = addressComponents.filter((component: any) => component.types.includes('postal_code')
  )

  return extractedPostalCodeFromComponents[0].longText || ''
}

const extractPrefecture = (addressComponents: any) => {
  const extractedPrefectureFromComponents
  = addressComponents.filter((component: any) => component.types.includes('administrative_area_level_1'))

  return extractedPrefectureFromComponents[0].longText || ''
}

const extractAddressLinesEnOne = (addressComponents: any) => {
  const premise
  = addressComponents.filter((component: any) => component.types.includes('premise'))
  const sublocalityFour
  = addressComponents.filter((component: any) => component.types.includes('sublocality_level_4'))
  const sublocalityThree
  = addressComponents.filter((component: any) => component.types.includes('sublocality_level_3'))

  const concatenatedEnglishLineOne = `${premise[0].longText}-${sublocalityFour[0].longText}-${sublocalityThree[0].longText}`

  return concatenatedEnglishLineOne 
}

const parseAddressForUpdatedSubmission = (englishAddressForSubmission: any, addressDetails: any) => {
  
  const extractedPostalCodeFromInformation = extractPostalCode(englishAddressForSubmission)
  const extractPrefectureEnFromInformation = extractPrefecture(englishAddressForSubmission)

  const extractedAddressLine1En = extractAddressLinesEnOne(englishAddressForSubmission)

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
    extractedAddressLine1En,
    extractedGoogleMapsURI,
    extractedMapLatitude,
    extractedMapLongitude
  }
}