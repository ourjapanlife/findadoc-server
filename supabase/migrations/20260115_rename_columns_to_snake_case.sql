ALTER TABLE facilities 
  RENAME COLUMN "nameEn" TO name_en;

ALTER TABLE facilities 
  RENAME COLUMN "nameJa" TO name_ja;

ALTER TABLE facilities 
  RENAME COLUMN "mapLatitude" TO map_latitude;

ALTER TABLE facilities 
  RENAME COLUMN "mapLongitude" TO map_longitude;

ALTER TABLE facilities 
  RENAME COLUMN "createdDate" TO created_date;

ALTER TABLE facilities 
  RENAME COLUMN "updatedDate" TO updated_date;

ALTER TABLE submissions 
  RENAME COLUMN "createdDate" TO created_date;

ALTER TABLE submissions 
  RENAME COLUMN "updatedDate" TO updated_date;

ALTER TABLE submissions 
  RENAME COLUMN "googleMapsUrl" TO google_maps_url;

ALTER TABLE submissions 
  RENAME COLUMN "healthcareProfessionalName" TO healthcare_professional_name;

ALTER TABLE submissions 
  RENAME COLUMN "spokenLanguages" TO spoken_languages;

ALTER TABLE submissions 
  RENAME COLUMN "autofillPlaceFromSubmissionUrl" TO autofill_place_from_submission_url;

ALTER TABLE hps 
  RENAME COLUMN "acceptedInsurance" TO accepted_insurance;

ALTER TABLE hps 
  RENAME COLUMN "additionalInfoForPatients" TO additional_info_for_patients;

ALTER TABLE hps 
  RENAME COLUMN "createdDate" TO created_date;

ALTER TABLE hps 
  RENAME COLUMN "updatedDate" TO updated_date;

ALTER TABLE hps 
  RENAME COLUMN "spokenLanguages" TO spoken_languages;
