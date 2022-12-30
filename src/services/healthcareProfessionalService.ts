import { healthcareProfessionals } from '../mockData/mockData';

enum SpokenLanguage {
  ENGLISH,
  JAPANESE,
}

export const getHealthcareProfessionalById = (id: string) => {
  // TODO: add a validation step for incoming parameter
  const matchingProfessional = healthcareProfessionals.find(
    (location: any) => location.id === id,
  );
  return matchingProfessional;
};

export const gethealthcareProfessionals = (
  specialty: string,
  location: string,
  spokenLanguage: SpokenLanguage,
) => {
  // TODO: add a validation step for incoming parameters
  const matchingProfessionals = healthcareProfessionals.reduce(
    // TODO: add conditions for if they're null
    (professional: any) => professional.specialty === specialty
      && professional.location === location
      && professional.spokenLanguage === spokenLanguage,
  );
  return matchingProfessionals;
};
