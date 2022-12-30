import { facilities } from '../mockData/mockData';

enum SpokenLanguage {
  ENGLISH,
  JAPANESE,
}

export const getFacilityById = (id: string) => {
  const matchingFacility = facilities.find(
    // TODO: Fix types
    (location: any) => location.id === id,
  );
  return matchingFacility;
};

export const getFacilities = (
  specialty: string,
  location: string,
  spokenLanguage: SpokenLanguage,
) => {
  // TODO: Fix types
  const matchingFacilities = facilities.reduce(
    // add conditions for if they're null
    (facility: any) => facility.specialty === specialty
            && facility.location === location
            && facility.spokenLanguage === spokenLanguage,
  );
  return matchingFacilities;
};
