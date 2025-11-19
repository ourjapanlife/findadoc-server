-- Clean up existing data to ensure a fresh start
DELETE FROM hps_facilities;
DELETE FROM hps;
DELETE FROM facilities;
DELETE FROM submissions;
------------------------------------


            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                '29b807d9-e800-49f8-a0dc-6b4c3c33ad22', 
                'Hayes - Schamberger', 
                '合名会社渡辺運輸', 
                43.046, 
                141.3968, 
                '{"googleMapsUrl":"https://lonely-epauliere.name","email":"Hayes-Schamberger.Kuhlman82@hotmail.com","phone":"13758712068 x7631","website":"https://squeaky-clarification.biz","address":{"addressLine1En":"1069 Daugherty Rapids","addressLine2En":"Suite 231","addressLine1Ja":"8507 信子Terrace","addressLine2Ja":"Apt. 806","cityEn":"Sapporo","cityJa":"札幌","postalCode":"061-9371","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}',
                '2025-11-19T13:41:24.477Z',
                '2025-11-19T13:41:24.481Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'c8503810-a41c-4361-9c64-843734b694df', 
                'Will Group', 
                '合資会社高橋通信', 
                35.0195, 
                135.799, 
                '{"googleMapsUrl":"https://good-rat.net/","email":"WillGroup_Heidenreich@hotmail.com","phone":"16528974327","website":"https://deserted-paste.com/","address":{"addressLine1En":"78828 Lodge Close","addressLine2En":"Apt. 876","addressLine1Ja":"342 田中Bridge","addressLine2Ja":"Suite 326","cityEn":"Kyoto","cityJa":"京都","postalCode":"687-6367","prefectureEn":"Kyoto","prefectureJa":"京都府"}}',
                '2025-11-19T13:41:24.481Z',
                '2025-11-19T13:41:24.481Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'ab78c232-f615-47ae-bdb5-6a6b087ac706', 
                'Ruecker, Trantow and Sporer', 
                '山田印刷株式会社', 
                43.0466, 
                141.3856, 
                '{"googleMapsUrl":"https://biodegradable-transmission.name/","email":"RueckerTrantowandSporer.Beatty27@gmail.com","phone":"19596166598 x04522","website":"https://bland-sonar.org/","address":{"addressLine1En":"40245 Vaughn Mews","addressLine2En":"Apt. 457","addressLine1Ja":"327 林Track","addressLine2Ja":"Suite 893","cityEn":"Sapporo","cityJa":"札幌","postalCode":"034-2662","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}',
                '2025-11-19T13:41:24.481Z',
                '2025-11-19T13:41:24.481Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                '796ed7b2-698f-4b4f-a3d7-dfbe4fd78cca', 
                'Greenholt - Fadel', 
                '有限会社林通信', 
                43.0736, 
                141.3383, 
                '{"googleMapsUrl":"https://unripe-incentive.net","email":"Greenholt-Fadel.Boehm@yahoo.com","phone":"532.360.0471 x2209","website":"https://miniature-photoreceptor.info/","address":{"addressLine1En":"468 Borer Causeway","addressLine2En":"Suite 643","addressLine1Ja":"16714 吉田River","addressLine2Ja":"Apt. 246","cityEn":"Sapporo","cityJa":"札幌","postalCode":"043-8123","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}',
                '2025-11-19T13:41:24.481Z',
                '2025-11-19T13:41:24.481Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'fa8b6b6c-8e2c-4f82-988d-cae988ee91b2', 
                'Moore LLC', 
                '小林運輸合資会社', 
                35.7123, 
                139.4815, 
                '{"googleMapsUrl":"https://friendly-heritage.com","email":"MooreLLC17@yahoo.com","phone":"3662397527 x579","website":"https://submissive-emu.biz/","address":{"addressLine1En":"22226 Alisa Course","addressLine2En":"Suite 799","addressLine1Ja":"334 山口Bridge","addressLine2Ja":"Suite 425","cityEn":"Tokyo","cityJa":"東京","postalCode":"103-9221","prefectureEn":"Tokyo","prefectureJa":"東京都"}}',
                '2025-11-19T13:41:24.481Z',
                '2025-11-19T13:41:24.481Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                '640d0425-805b-45d2-a672-cc5ff4d4f00a', 
                '[{"firstName":"彩花","lastName":"渡辺","locale":"ja_JP"}]', 
                '["DDS","DDS"]', 
                '["OPTOMETRY","FAMILY_MEDICINE"]', 
                '["hi_IN","zh_CN"]', 
                '["INTERNATIONAL_HEALTH_INSURANCE"]', 
                '',
                '2025-11-19T13:41:24.482Z',
                '2025-11-19T13:41:24.482Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                'c5b6e37f-d82c-443d-8c53-f9e95ce20135', 
                '[{"firstName":"明","lastName":"高橋","locale":"ja_JP"}]', 
                '["PharmD","DC"]', 
                '["CARDIOLOGY","OPTOMETRY"]', 
                '["kab_DZ","kn_IN"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                '',
                '2025-11-19T13:41:24.482Z',
                '2025-11-19T13:41:24.482Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                '904ce2ba-a67e-4695-b1e9-831e4736cc21', 
                '[{"firstName":"新","lastName":"加藤","locale":"ja_JP"}]', 
                '["DO","DVM"]', 
                '["PREVENTIVE_MEDICINE","OPHTHALMOLOGY"]', 
                '["ak_GH","hi_IN"]', 
                '["INTERNATIONAL_HEALTH_INSURANCE"]', 
                '',
                '2025-11-19T13:41:24.482Z',
                '2025-11-19T13:41:24.482Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                '0f4eb281-404b-4973-90e6-b6248bbb988e', 
                '[{"firstName":"健太","lastName":"中村","locale":"ja_JP"}]', 
                '["NP","PharmD"]', 
                '["ANESTHESIOLOGY","OTOLARYNGOLOGY"]', 
                '["am_ET"]', 
                '["INTERNATIONAL_HEALTH_INSURANCE"]', 
                '',
                '2025-11-19T13:41:24.482Z',
                '2025-11-19T13:41:24.482Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                '472825a2-5628-4d99-abff-f7237e32a361', 
                '[{"firstName":"Aurelia","middleName":"Marlowe","lastName":"Abernathy","locale":"en_US"}]', 
                '["MD","PsyD"]', 
                '["TRAUMATOLOGY","PSYCHIATRY"]', 
                '["ee_GH","ne_NP"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                '',
                '2025-11-19T13:41:24.482Z',
                '2025-11-19T13:41:24.482Z'
            );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '640d0425-805b-45d2-a672-cc5ff4d4f00a', 
                    '796ed7b2-698f-4b4f-a3d7-dfbe4fd78cca'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '640d0425-805b-45d2-a672-cc5ff4d4f00a', 
                    'ab78c232-f615-47ae-bdb5-6a6b087ac706'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'c5b6e37f-d82c-443d-8c53-f9e95ce20135', 
                    'fa8b6b6c-8e2c-4f82-988d-cae988ee91b2'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'c5b6e37f-d82c-443d-8c53-f9e95ce20135', 
                    'ab78c232-f615-47ae-bdb5-6a6b087ac706'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '904ce2ba-a67e-4695-b1e9-831e4736cc21', 
                    'ab78c232-f615-47ae-bdb5-6a6b087ac706'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '0f4eb281-404b-4973-90e6-b6248bbb988e', 
                    '796ed7b2-698f-4b4f-a3d7-dfbe4fd78cca'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '0f4eb281-404b-4973-90e6-b6248bbb988e', 
                    'c8503810-a41c-4361-9c64-843734b694df'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '0f4eb281-404b-4973-90e6-b6248bbb988e', 
                    '29b807d9-e800-49f8-a0dc-6b4c3c33ad22'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '472825a2-5628-4d99-abff-f7237e32a361', 
                    'c8503810-a41c-4361-9c64-843734b694df'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '472825a2-5628-4d99-abff-f7237e32a361', 
                    'ab78c232-f615-47ae-bdb5-6a6b087ac706'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '472825a2-5628-4d99-abff-f7237e32a361', 
                    'fa8b6b6c-8e2c-4f82-988d-cae988ee91b2'
                );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '578acd36-bb10-41da-8aa5-609d4d4723d7', 
                'https://variable-meantime.name/', 
                'Rick Hahn', 
                '["ru_RU","km_KH"]', 
                '{"nameEn":"Wilderman, Zemlak and Little","nameJa":"株式会社清水食品","mapLatitude":35.7801,"mapLongitude":139.6591,"contact":{"googleMapsUrl":"https://avaricious-denim.biz/","email":"WildermanZemlakandLittle.Schuster@yahoo.com","phone":"(598) 8079788","website":"https://interesting-chairman.org","address":{"addressLine1En":"80711 George Street","addressLine2En":"Suite 170","addressLine1Ja":"106 吉田Route","addressLine2Ja":"Apt. 682","cityEn":"Tokyo","cityJa":"東京","postalCode":"177-8162","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"智也","lastName":"佐藤","locale":"ja_JP"}],"degrees":["DPM","DVM"],"specialties":["OBSTETRICS_AND_GYNECOLOGY","DENTISTRY"],"spokenLanguages":["is_IS"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"和彦","lastName":"伊藤","locale":"ja_JP"}],"degrees":["MD","DC"],"specialties":["TRAUMATOLOGY","DENTISTRY"],"spokenLanguages":["ca_ES"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-19T13:41:24.484Z',
                '2025-11-19T13:41:24.484Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                'ed4a1926-9993-40e6-9558-0cd9627f9d4c', 
                'https://innocent-conscience.name', 
                'Pat Schneider', 
                '["zh_HK","ee_GH"]', 
                '{"nameEn":"Friesen - Beer","nameJa":"有限会社佐藤印刷","mapLatitude":35.7424,"mapLongitude":139.8117,"contact":{"googleMapsUrl":"https://somber-analogy.com/","email":"Friesen-Beer.Rosenbaum24@gmail.com","phone":"(953) 4389202 x0086","website":"https://frightened-spectacles.name/","address":{"addressLine1En":"15776 Kohler Ford","addressLine2En":"Suite 728","addressLine1Ja":"128 直樹Mount","addressLine2Ja":"Suite 898","cityEn":"Tokyo","cityJa":"東京","postalCode":"152-4972","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"ヨシ","lastName":"佐藤","locale":"ja_JP"}],"degrees":["DSW","PA"],"specialties":["PHYSIOTHERAPY","PLASTIC_SURGERY"],"spokenLanguages":["fa_AF","de_DE"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Garnett","middleName":"River","lastName":"White","locale":"en_US"}],"degrees":["PA","DPT"],"specialties":["EMERGENCY_MEDICINE","OPHTHALMOLOGY"],"spokenLanguages":["ne_NP","el_GR"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-19T13:41:24.484Z',
                '2025-11-19T13:41:24.484Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                'bf7240eb-cda3-4c73-b864-b67fcccc4e5c', 
                'https://yearly-facility.com', 
                'Carroll Runolfsdottir MD', 
                '["guz_KE","fi_FI"]', 
                '{"nameEn":"Monahan, Hansen and Jenkins","nameJa":"井上食品合同会社","mapLatitude":35.066,"mapLongitude":135.7417,"contact":{"googleMapsUrl":"https://sticky-geometry.net/","email":"MonahanHansenandJenkins_Wintheiser30@gmail.com","phone":"14158626717 x389","website":"https://genuine-guideline.com/","address":{"addressLine1En":"452 Madyson Loaf","addressLine2En":"Apt. 332","addressLine1Ja":"6866 一郎Cliff","addressLine2Ja":"Suite 413","cityEn":"Kyoto","cityJa":"京都","postalCode":"661-0050","prefectureEn":"Kyoto","prefectureJa":"京都府"}}}', 
                '[{"names":[{"firstName":"紬","lastName":"中村","locale":"ja_JP"}],"degrees":["DVM","DC"],"specialties":["ANESTHESIOLOGY","COSMETIC_SURGERY"],"spokenLanguages":["ee_GH"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"颯真","lastName":"加藤","locale":"ja_JP"}],"degrees":["EdD","NP"],"specialties":["INFECTIOUS_DISEASES","PROCTOLOGY"],"spokenLanguages":["ig_NG","pl_PL"],"acceptedInsurance":["JAPANESE_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'rejected',
                NULL,
                NULL,
                FALSE,
                '2025-11-19T13:41:24.485Z',
                '2025-11-19T13:41:24.485Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '7935feff-bcf0-4dc4-a17a-c67da9b11231', 
                'https://warlike-booking.biz/', 
                'Jessica Moore', 
                '["cs_CZ","pt_BR"]', 
                '{"nameEn":"Leuschke, Anderson and Cronin","nameJa":"株式会社清水通信","mapLatitude":43.079,"mapLongitude":141.331,"contact":{"googleMapsUrl":"https://livid-database.info/","email":"LeuschkeAndersonandCronin.Raynor@hotmail.com","phone":"956.469.8024 x85945","website":"https://portly-advantage.biz/","address":{"addressLine1En":"8901 Lia Rue","addressLine2En":"Apt. 437","addressLine1Ja":"1255 瑛太Manors","addressLine2Ja":"Suite 605","cityEn":"Sapporo","cityJa":"札幌","postalCode":"029-2365","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
                '[{"names":[{"firstName":"湊","lastName":"佐々木","locale":"ja_JP"}],"degrees":["DSc","DPT"],"specialties":["PEDIATRICS","OPHTHALMOLOGY"],"spokenLanguages":["ja_JP","nb_NO"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"花","lastName":"木村","locale":"ja_JP"}],"degrees":["MD","DC"],"specialties":["PROCTOLOGY","NEUROLOGY"],"spokenLanguages":["cy_GB","vi_VN"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-19T13:41:24.486Z',
                '2025-11-19T13:41:24.486Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                'a1d5c330-2345-4cd0-b69f-be568452253d', 
                'https://scary-terrace.info', 
                'Ms. Catherine Roob', 
                '["ak_GH","sq_AL"]', 
                '{"nameEn":"Kiehn and Sons","nameJa":"有限会社井上情報","mapLatitude":35.0482,"mapLongitude":135.7926,"contact":{"googleMapsUrl":"https://common-inn.com","email":"KiehnandSons.Boehm@yahoo.com","phone":"(660) 3384662 x20575","website":"https://lanky-angel.info/","address":{"addressLine1En":"50523 Hazel Close","addressLine2En":"Apt. 225","addressLine1Ja":"880 健太郎Inlet","addressLine2Ja":"Apt. 935","cityEn":"Kyoto","cityJa":"京都","postalCode":"608-1260","prefectureEn":"Kyoto","prefectureJa":"京都府"}}}', 
                '[{"names":[{"firstName":"Emil","middleName":"Austin","lastName":"McKenzie","locale":"en_US"}],"degrees":["OD","DDS"],"specialties":["FAMILY_MEDICINE","FAMILY_MEDICINE"],"spokenLanguages":["tr_TR","hy_AM"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"雄大","lastName":"中村","locale":"ja_JP"}],"degrees":["DSW","CNM"],"specialties":["PROCTOLOGY","DERMATOLOGY"],"spokenLanguages":["ja_JP"],"acceptedInsurance":["JAPANESE_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-19T13:41:24.487Z',
                '2025-11-19T13:41:24.487Z'
            );