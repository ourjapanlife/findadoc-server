import { healthcareProfessionals } from '../mockData/mockData';
import { HealthcareProfessional } from '../typeDefs/gqlTypes';

// TODO: add a validation step for incoming parameters
export const getHealthcareProfessionalById = (id: string) => {
  const matchingProfessional = healthcareProfessionals.find(
    (professional: HealthcareProfessional) => professional.id === id,
  );
  return matchingProfessional;
};

export const getHealthcareProfessionals = () => healthcareProfessionals;
