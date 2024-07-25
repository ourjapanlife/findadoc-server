import puppeteer from 'puppeteer'
import axios from 'axios'


// This uses all the helper functions in order to get the data we want
export const getFacilityDetailsForSubmission = async (submittedURL: string, apiKey: string): Promise<any | null> => {
  try {
    const coordinatesFromUrl = {
      latitude: "",
      longitude: ""
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
      const addressDetails = await getGoogleMapUrlLocationDetails(coordinatesFromUrl.latitude, coordinatesFromUrl.longitude, apiKey)
      return addressDetails
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
    const responseFromGooglePlacesAPI = await axios.post(url, fetchOptions)

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
      console.error(`${redirectedUrl} is not a valid Google Maps URL`);
      return;
    }
  } catch (error) {
    console.error('Error during URL validation:', error);
  }
};


// Testing the code above using an apple link for Tokyo Midtown Clinic. You must enter your api key if you want to test it
const submittedURL = 'https://maps.app.goo.gl/JwogYMa2dEzX248EA?g_st=iw'
const apiKey = process.env.GOOGLE_API_KEY

getFacilityDetailsForSubmission(submittedURL, apiKey as string)