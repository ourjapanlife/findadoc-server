type HealthcareProfessional = {
  temptypeuntilwegetthegraphqlone: boolean;
};

export function createHealthcareProfessionals(
  healthcareProfessionals: [HealthcareProfessional]
): any {
  return {
    healthcareProfessionals,
  };
}

export function createHealthcareProfessional(
  healthcareProfessional: HealthcareProfessional
): any {
  return createHealthcareProfessionals([healthcareProfessional]);
}
