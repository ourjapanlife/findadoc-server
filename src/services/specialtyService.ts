import { specialties } from '../mockData/mockData';
import { Specialty, Language } from '../typeDefs/gqlTypes';

export const getSpecialtyById = (id: string) => {
  // TODO: add a validation step for incoming parameter
  const matchingSpecialty = specialties.find(
    (medicalField: Specialty) => medicalField.id === id,
  );
  return matchingSpecialty;
};

export const getSpecialties = (
  specialty: string,
  spokenLanguage: Language,
) => {
  // TODO: add a validation step for incoming parameters
  const matchingSpecialties = specialties.reduce(
    // TODO: add conditions for if they're null
    (medicalField: Specialty) => medicalField.specialty === specialty
      && medicalField.spokenLanguage === spokenLanguage,
  );
  return matchingSpecialties;
};
