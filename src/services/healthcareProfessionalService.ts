import { healthcareProfessionals } from '../mockData/mockData';
import { HealthcareProfessional, Language } from '../typeDefs/gqlTypes';

export const getHealthcareProfessionalById = (id: string) => {
  // TODO: add a validation step for incoming parameter
  const matchingProfessional = healthcareProfessionals.find(
    (professional: HealthcareProfessional) => professional.id === id,
  );
  return matchingProfessional;
};

export const getHealthcareProfessionals = (
  specialty: string,
  spokenLanguage: Language,
) => {
  // TODO: add a validation step for incoming parameters
  const matchingProfessionals = healthcareProfessionals.reduce(
    // TODO: add conditions for if they're null
    (professional: HealthcareProfessional) => professional.specialty === specialty
      && professional.spokenLanguage === spokenLanguage,
  );
  return matchingProfessionals;
};
