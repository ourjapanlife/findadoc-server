import { facilities } from '../mockData/mockData';
import { Facility, Language } from '../typeDefs/gqlTypes';

export const getFacilityById = (id: string) => {
  const matchingFacility = facilities.find(
    (location: Facility) => location.id === id,
  );
  return matchingFacility;
};

export const getFacilities = (
  specialty: string,
  location: string,
  spokenLanguage: Language,
) => {
  // TODO: Fix types
  const matchingFacilities = facilities.reduce(
    // add conditions for if they're null and searching through healthcare profs at a facility∂
    (facility: Facility) => facility,
  );
  return matchingFacilities;
};
