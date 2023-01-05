import { facilities } from '../mockData/mockData';
import { Facility } from '../typeDefs/gqlTypes';

// TODO: add a validation step for incoming parameters
export const getFacilityById = (id: string) => {
    const matchingFacility = facilities.find(
        (location: Facility) => location.id === id
    );

    return matchingFacility;
};

export const getFacilities = () => facilities;
