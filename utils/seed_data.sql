-- Clean up existing data to ensure a fresh start
DELETE FROM hps_facilities;
DELETE FROM hps;
DELETE FROM facilities;
DELETE FROM submissions;
------------------------------------


            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                'dcde5a03-5dc4-4890-b204-ab1cbde5f1f6', 
                'Buckridge, VonRueden and Gusikowski', 
                '株式会社松本印刷', 
                35.6462, 
                139.8595, 
                '{"googleMapsUrl":"https://robust-instruction.biz","email":"BuckridgeVonRuedenandGusikowski6@yahoo.com","phone":"5464187846 x60272","website":"https://insignificant-period.org","address":{"addressLine1En":"1774 Bechtelar Club","addressLine2En":"Apt. 128","addressLine1Ja":"127 伊藤Pike","addressLine2Ja":"Suite 875","cityEn":"Tokyo","cityJa":"東京","postalCode":"187-2405","prefectureEn":"Tokyo","prefectureJa":"東京都"}}'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                '503703a5-f0df-4cc1-8c64-ce7a96b1d216', 
                'Turner, Towne and Mraz', 
                '合資会社鈴木運輸', 
                35.0901, 
                135.7594, 
                '{"googleMapsUrl":"https://yellowish-tea.biz/","email":"TurnerTowneandMraz86@yahoo.com","phone":"18086879498 x30214","website":"https://triangular-dance.net/","address":{"addressLine1En":"89442 Lake Street","addressLine2En":"Suite 658","addressLine1Ja":"600 吉田Valley","addressLine2Ja":"Apt. 886","cityEn":"Kyoto","cityJa":"京都","postalCode":"685-8651","prefectureEn":"Kyoto","prefectureJa":"京都府"}}'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                'b4ad6568-114d-4d77-9942-0574e72c5d34', 
                'Zulauf and Sons', 
                '合名会社井上銀行', 
                35.6899, 
                139.4871, 
                '{"googleMapsUrl":"https://disastrous-community.biz","email":"ZulaufandSons43@yahoo.com","phone":"5128224425","website":"https://homely-echidna.name","address":{"addressLine1En":"3307 Anibal Isle","addressLine2En":"Suite 140","addressLine1Ja":"492 小林Flat","addressLine2Ja":"Apt. 372","cityEn":"Tokyo","cityJa":"東京","postalCode":"102-5056","prefectureEn":"Tokyo","prefectureJa":"東京都"}}'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                '1d415e32-550b-4f32-b3f5-9b0b9101224a', 
                'Hickle, Koch and Mann', 
                '合名会社清水ガス', 
                35.0487, 
                135.7073, 
                '{"googleMapsUrl":"https://utter-flavor.name","email":"HickleKochandMann98@yahoo.com","phone":"778.449.8977 x3709","website":"https://concerned-permafrost.biz","address":{"addressLine1En":"190 Weissnat Trail","addressLine2En":"Suite 824","addressLine1Ja":"61863 木村Route","addressLine2Ja":"Apt. 987","cityEn":"Kyoto","cityJa":"京都","postalCode":"699-0847","prefectureEn":"Kyoto","prefectureJa":"京都府"}}'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                '17ff9c09-c8d0-476e-83a5-f16325600323', 
                'Emard - Swift', 
                '有限会社田中水産', 
                43.0417, 
                141.3043, 
                '{"googleMapsUrl":"https://unhealthy-boolean.com","email":"Emard-Swift_Schuster@hotmail.com","phone":"(327) 6871951 x3945","website":"https://misty-second.name/","address":{"addressLine1En":"81992 12th Street","addressLine2En":"Apt. 763","addressLine1Ja":"309 成美Estate","addressLine2Ja":"Apt. 700","cityEn":"Sapporo","cityJa":"札幌","postalCode":"043-6887","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                'af361298-5c0b-4b74-895e-47e52e5546d4', 
                '[{"firstName":"紀子","lastName":"田中","locale":"ja_JP"}]', 
                '["DPT","CNM"]', 
                '["ORTHODONTICS","NEUROLOGY"]', 
                '["cs_CZ","is_IS"]', 
                '["UNINSURED"]', 
                ''
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                '94ad9e8e-98e7-4aec-9106-b1c8b17407e6', 
                '[{"firstName":"悠希","lastName":"井上","locale":"ja_JP"}]', 
                '["DDS","DPT"]', 
                '["TRAUMATOLOGY","SPORTS_MEDICINE"]', 
                '["lg_UG"]', 
                '["TRAVEL_INSURANCE"]', 
                ''
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                '6ad9d336-24e1-4945-9fbd-8f08410cfb5e', 
                '[{"firstName":"Winfield","middleName":"Kai","lastName":"Bergnaum","locale":"en_US"}]', 
                '["DC","CNM"]', 
                '["SPORTS_MEDICINE","FAMILY_MEDICINE"]', 
                '["km_KH"]', 
                '["TRAVEL_INSURANCE"]', 
                ''
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                '2da44890-abc2-4608-b458-0426a9bcb362', 
                '[{"firstName":"優子","lastName":"林","locale":"ja_JP"}]', 
                '["DSW","OD"]', 
                '["DERMATOLOGY","PREVENTIVE_MEDICINE"]', 
                '["de_DE","de_DE"]', 
                '["JAPANESE_HEALTH_INSURANCE"]', 
                ''
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                'dbe365cf-8fe3-4593-b8f5-4d62b60d71fb', 
                '[{"firstName":"莉子","lastName":"斎藤","locale":"ja_JP"}]', 
                '["MPH","DMD"]', 
                '["GENERAL_MEDICINE","ORTHODONTICS"]', 
                '["hy_AM"]', 
                '["INTERNATIONAL_HEALTH_INSURANCE"]', 
                ''
            );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'af361298-5c0b-4b74-895e-47e52e5546d4', 
                    '17ff9c09-c8d0-476e-83a5-f16325600323'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '94ad9e8e-98e7-4aec-9106-b1c8b17407e6', 
                    '17ff9c09-c8d0-476e-83a5-f16325600323'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '94ad9e8e-98e7-4aec-9106-b1c8b17407e6', 
                    'dcde5a03-5dc4-4890-b204-ab1cbde5f1f6'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '6ad9d336-24e1-4945-9fbd-8f08410cfb5e', 
                    'dcde5a03-5dc4-4890-b204-ab1cbde5f1f6'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '6ad9d336-24e1-4945-9fbd-8f08410cfb5e', 
                    'b4ad6568-114d-4d77-9942-0574e72c5d34'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '2da44890-abc2-4608-b458-0426a9bcb362', 
                    'dcde5a03-5dc4-4890-b204-ab1cbde5f1f6'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'dbe365cf-8fe3-4593-b8f5-4d62b60d71fb', 
                    '503703a5-f0df-4cc1-8c64-ce7a96b1d216'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'dbe365cf-8fe3-4593-b8f5-4d62b60d71fb', 
                    'b4ad6568-114d-4d77-9942-0574e72c5d34'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'dbe365cf-8fe3-4593-b8f5-4d62b60d71fb', 
                    'dcde5a03-5dc4-4890-b204-ab1cbde5f1f6'
                );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '91581c89-b44a-4e64-b264-e07e547cefda', 
                'https://colossal-outlook.info/', 
                'Felipe Berge', 
                '["he_IL","ru_RU"]', 
                '{"nameEn":"Mayert and Sons","nameJa":"有限会社松本保険","mapLatitude":35.6079,"mapLongitude":139.6141,"contact":{"googleMapsUrl":"https://verifiable-emergency.biz/","email":"MayertandSons.Turner51@hotmail.com","phone":"19778611036","website":"https://functional-crime.info","address":{"addressLine1En":"508 E Walnut Street","addressLine2En":"Apt. 642","addressLine1Ja":"8961 松本Brook","addressLine2Ja":"Suite 537","cityEn":"Tokyo","cityJa":"東京","postalCode":"186-9923","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"キミ","lastName":"渡辺","locale":"ja_JP"}],"degrees":["DVM","PharmD"],"specialties":["UROLOGY","ORTHOPEDIC_SURGERY"],"spokenLanguages":["el_GR","id_ID"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Ashly","middleName":"Ellis","lastName":"Kutch","locale":"en_US"}],"degrees":["DSc","DVM"],"specialties":["NUCLEAR_MEDICINE","NUCLEAR_MEDICINE"],"spokenLanguages":["ne_NP"],"acceptedInsurance":["JAPANESE_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T13:43:00.220Z',
                '2025-11-06T13:43:00.225Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '41c233df-0acc-4821-829d-f51a9c50d1eb', 
                'https://outgoing-assassination.org/', 
                'Ida Larson', 
                '["ne_NP","fa_AF"]', 
                '{"nameEn":"Bechtelar - Mohr","nameJa":"株式会社清水食品","mapLatitude":43.0436,"mapLongitude":141.3781,"contact":{"googleMapsUrl":"https://multicolored-zombie.info/","email":"Bechtelar-Mohr.Wunsch@hotmail.com","phone":"801.397.2506 x549","website":"https://well-off-affinity.org/","address":{"addressLine1En":"421 Dana Fields","addressLine2En":"Suite 614","addressLine1Ja":"2293 浩之Falls","addressLine2Ja":"Suite 801","cityEn":"Sapporo","cityJa":"札幌","postalCode":"015-9732","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
                '[{"names":[{"firstName":"由美","lastName":"林","locale":"ja_JP"}],"degrees":["MD","DC"],"specialties":["NEUROLOGY","MEDICAL_GENETICS"],"spokenLanguages":["pt_BR","da_DK"],"acceptedInsurance":["JAPANESE_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"進","lastName":"小林","locale":"ja_JP"}],"degrees":["DSW","DDS"],"specialties":["PHYSIOTHERAPY","NUCLEAR_MEDICINE"],"spokenLanguages":["ig_NG","bm_ML"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T13:43:00.227Z',
                '2025-11-06T13:43:00.227Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '048b4499-40df-4fe5-abfd-98d67ac8e2f2', 
                'https://concrete-leather.net/', 
                'Maureen Witting-Morissette', 
                '["nb_NO","hy_AM"]', 
                '{"nameEn":"Johns - Gulgowski","nameJa":"林情報株式会社","mapLatitude":35.6048,"mapLongitude":139.8218,"contact":{"googleMapsUrl":"https://vivacious-abbreviation.biz","email":"Johns-Gulgowski_Hickle@yahoo.com","phone":"5538311013 x7998","website":"https://intelligent-roast.com/","address":{"addressLine1En":"22517 Columbia Avenue","addressLine2En":"Apt. 647","addressLine1Ja":"746 一男Forges","addressLine2Ja":"Apt. 583","cityEn":"Tokyo","cityJa":"東京","postalCode":"185-2812","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"Henderson","middleName":"Brooklyn","lastName":"Reichert","locale":"en_US"}],"degrees":["DVM","DC"],"specialties":["OPHTHALMOLOGY","PEDIATRICS"],"spokenLanguages":["und"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"貴大","lastName":"井上","locale":"ja_JP"}],"degrees":["PhD","EdD"],"specialties":["NEUROLOGY","ANESTHESIOLOGY"],"spokenLanguages":["id_ID"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'rejected',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T13:43:00.228Z',
                '2025-11-06T13:43:00.228Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                'ddfc8b70-ae55-4ee7-99b3-87322bbb2d44', 
                'https://unselfish-dirndl.biz/', 
                'Krista Kozey', 
                '["nl_BE","hi_IN"]', 
                '{"nameEn":"Mayert Group","nameJa":"合名会社清水水産","mapLatitude":35.6797,"mapLongitude":139.5292,"contact":{"googleMapsUrl":"https://sneaky-hyphenation.net/","email":"MayertGroup_Kunze2@hotmail.com","phone":"2107249978 x986","website":"https://smooth-goddess.com/","address":{"addressLine1En":"502 Orchard Lane","addressLine2En":"Suite 537","addressLine1Ja":"737 鈴木Fall","addressLine2Ja":"Apt. 400","cityEn":"Tokyo","cityJa":"東京","postalCode":"117-4764","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"キミ","lastName":"小林","locale":"ja_JP"}],"degrees":["PhD","DVM"],"specialties":["NEUROLOGY","PHYSICAL_MEDICINE_AND_REHABILITATION"],"spokenLanguages":["pl_PL","ak_GH"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Eldora","middleName":"Robin","lastName":"Sipes","locale":"en_US"}],"degrees":["DSW","DVM"],"specialties":["PSYCHIATRY","RADIATION_ONCOLOGY"],"spokenLanguages":["vi_VN"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T13:43:00.229Z',
                '2025-11-06T13:43:00.229Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                'e8ee29d5-31d2-40d7-9f21-a86fdba4d63b', 
                'https://slight-team.biz/', 
                'Clifton Predovic', 
                '["sw_KE","zh_HK"]', 
                '{"nameEn":"Krajcik LLC","nameJa":"合名会社中村鉱業","mapLatitude":43.0376,"mapLongitude":141.3715,"contact":{"googleMapsUrl":"https://late-buck.name/","email":"KrajcikLLC.Hauck@yahoo.com","phone":"3964691360 x60031","website":"https://teeming-fishbone.name/","address":{"addressLine1En":"1755 Jacey Falls","addressLine2En":"Apt. 689","addressLine1Ja":"95334 勉Centers","addressLine2Ja":"Apt. 801","cityEn":"Sapporo","cityJa":"札幌","postalCode":"030-9782","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
                '[{"names":[{"firstName":"友美","lastName":"井上","locale":"ja_JP"}],"degrees":["DNP","MD"],"specialties":["OPHTHALMOLOGY","COSMETIC_SURGERY"],"spokenLanguages":["kab_DZ","ee_GH"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Deven","middleName":"North","lastName":"Ebert","locale":"en_US"}],"degrees":["OD","MPH"],"specialties":["FAMILY_MEDICINE","NEUROLOGY"],"spokenLanguages":["sr_Cyrl"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T13:43:00.229Z',
                '2025-11-06T13:43:00.229Z'
            );