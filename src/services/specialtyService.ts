import { specialties } from '../mockData/mockData';

enum SpokenLanguage {
  ENGLISH,
  JAPANESE,
}

export const getSpecialtyById = (id: string) => {
  // TODO: add a validation step for incoming parameter
  const matchingSpecialty = specialties.find(
    (medicalField: any) => medicalField.id === id,
  );
  return matchingSpecialty;
};

export const getSpecialties = (
  specialty: string,
  spokenLanguage: SpokenLanguage,
) => {
  // TODO: add a validation step for incoming parameters
  const matchingSpecialties = specialties.reduce(
    // TODO: add conditions for if they're null
    (medicalField: any) => medicalField.specialty === specialty
            && medicalField.spokenLanguage === spokenLanguage,
  );
  return matchingSpecialties;
};
