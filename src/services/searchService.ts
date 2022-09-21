type LanguageEnum = {
  temptypeuntilwegetthegraphqlone: boolean;
};

export function getHealthcareProfessionaById(id): any {
  return { tempfield: id };
  // query db by the id. easy.
}

export function getHealthcareProfessional(
  searchTerm: string,
  language: LanguageEnum
): any {
  return {
    tempObject: language,
  };
  // query db. for postgres might recommend a composite key for the main search fields,
  // otherwise you can just query each of the fields with the term. It will
  // probably be really slow without a composite key eventually, but for MVP it's ok.
  // this is still better than doing a separate search per field.
  // if we're storing the nested objects in healthcareprovider in separate tables,
  // then you might want a view for healthCareProfessional. (it's a pre-compiled query with joins across tables. )
  // this is what you would query. If you don't need to join tables, then no view is needed.
}
