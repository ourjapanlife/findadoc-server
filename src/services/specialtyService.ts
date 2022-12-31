import { specialties } from '../mockData/mockData';
import { Specialty } from '../typeDefs/gqlTypes';

// TODO: add a validation step for incoming parameters
export const getSpecialtyById = (id: string) => {
  const matchingSpecialty = specialties.find(
    (medicalField: Specialty) => medicalField.id === id,
  );
  return matchingSpecialty;
};

export const getSpecialties = () => specialties;
