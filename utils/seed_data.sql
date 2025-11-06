-- Clean up existing data to ensure a fresh start
DELETE FROM hps_facilities;
DELETE FROM hps;
DELETE FROM facilities;
DELETE FROM submissions;
------------------------------------


            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                'bfaa649c-4a06-40e1-a454-7030b9caec0c', 
                'Daniel Group', 
                '合名会社松本銀行', 
                35.0498, 
                135.7443, 
                '{"googleMapsUrl":"https://quick-justification.com","email":"DanielGroup45@hotmail.com","phone":"2936540293","website":"https://ample-possibility.biz/","address":{"addressLine1En":"4688 Ferry Road","addressLine2En":"Apt. 241","addressLine1Ja":"79096 佳奈Port","addressLine2Ja":"Apt. 567","cityEn":"Kyoto","cityJa":"京都","postalCode":"664-6639","prefectureEn":"Kyoto","prefectureJa":"京都府"}}'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                'd22b8531-f8e3-4d45-b66b-b2cb8f35c88d', 
                'Mertz LLC', 
                '山口水産有限会社', 
                35.0091, 
                135.7187, 
                '{"googleMapsUrl":"https://angry-macrofauna.org","email":"MertzLLC.Ward32@gmail.com","phone":"19557285313 x44293","website":"https://mortified-harm.info","address":{"addressLine1En":"740 York Road","addressLine2En":"Apt. 629","addressLine1Ja":"970 淳Spurs","addressLine2Ja":"Suite 150","cityEn":"Kyoto","cityJa":"京都","postalCode":"634-4260","prefectureEn":"Kyoto","prefectureJa":"京都府"}}'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                '6093b040-368c-47ed-9158-b6f0104675d3', 
                'Gerhold - Schroeder', 
                '有限会社加藤水産', 
                35.7979, 
                139.6011, 
                '{"googleMapsUrl":"https://tame-barge.com","email":"Gerhold-Schroeder_Walter@yahoo.com","phone":"8209044296 x18462","website":"https://hairy-motivation.org/","address":{"addressLine1En":"9710 Bedford Road","addressLine2En":"Apt. 732","addressLine1Ja":"89207 結翔Valley","addressLine2Ja":"Suite 406","cityEn":"Tokyo","cityJa":"東京","postalCode":"156-6947","prefectureEn":"Tokyo","prefectureJa":"東京都"}}'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                '09235899-6f1d-42b2-a1b6-81bdaa363e2b', 
                'Aufderhar, Walsh and Ryan', 
                '合名会社清水水産', 
                35.648, 
                139.6472, 
                '{"googleMapsUrl":"https://immaculate-variation.biz","email":"AufderharWalshandRyan.Wyman30@hotmail.com","phone":"9603012568 x531","website":"https://infantile-goal.name","address":{"addressLine1En":"1127 Auer Ridges","addressLine2En":"Apt. 218","addressLine1Ja":"1123 三郎Crossing","addressLine2Ja":"Suite 641","cityEn":"Tokyo","cityJa":"東京","postalCode":"167-3712","prefectureEn":"Tokyo","prefectureJa":"東京都"}}'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                '88d286f1-aa0c-49c5-b9b4-b27c8f2e4590', 
                'Russel, Rosenbaum and Feil', 
                '渡辺印刷合名会社', 
                43.0603, 
                141.394, 
                '{"googleMapsUrl":"https://triangular-adulthood.info/","email":"RusselRosenbaumandFeil.Kunde@yahoo.com","phone":"3614261919 x2566","website":"https://vigilant-boogeyman.biz","address":{"addressLine1En":"271 Pansy Causeway","addressLine2En":"Suite 641","addressLine1Ja":"3778 海翔Hills","addressLine2Ja":"Apt. 662","cityEn":"Sapporo","cityJa":"札幌","postalCode":"058-0052","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                'd7f32f2f-a9e0-4880-afa9-18776de38cce', 
                '[{"firstName":"実","lastName":"山本","locale":"ja_JP"}]', 
                '["DDS","PhD"]', 
                '["PEDIATRICS","ENT_SPECIALIST"]', 
                '["nl_BE","hi_IN"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                ''
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                'c43025c3-af40-4799-b76e-97e510036bc7', 
                '[{"firstName":"恵美","lastName":"佐藤","locale":"ja_JP"}]', 
                '["PharmD","DVM"]', 
                '["INFECTIOUS_DISEASES","EMERGENCY_MEDICINE"]', 
                '["he_IL"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                ''
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                '354139a1-abc0-44c3-a36a-3aac3c76e95d', 
                '[{"firstName":"勝利","lastName":"渡辺","locale":"ja_JP"}]', 
                '["DSc","DC"]', 
                '["PHYSICAL_MEDICINE_AND_REHABILITATION","ALLERGY_AND_IMMUNOLOGY"]', 
                '["nl_BE","pl_PL"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                ''
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                '01ba87c2-4168-4a13-89fe-6b584c1bbc87', 
                '[{"firstName":"Alisa","middleName":"Harper","lastName":"Kuphal","locale":"en_US"}]', 
                '["DO","PsyD"]', 
                '["EMERGENCY_MEDICINE","PREVENTIVE_MEDICINE"]', 
                '["sq_AL","en_US"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                ''
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                '8f0e0d2d-dcaf-4067-a587-808e818de0c6', 
                '[{"firstName":"Jermey","middleName":"Charlie","lastName":"Bergnaum","locale":"en_US"}]', 
                '["PA","NP"]', 
                '["SURGERY","SPORTS_MEDICINE"]', 
                '["fi_FI","en_US"]', 
                '["INTERNATIONAL_HEALTH_INSURANCE"]', 
                ''
            );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'd7f32f2f-a9e0-4880-afa9-18776de38cce', 
                    '6093b040-368c-47ed-9158-b6f0104675d3'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'c43025c3-af40-4799-b76e-97e510036bc7', 
                    '09235899-6f1d-42b2-a1b6-81bdaa363e2b'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'c43025c3-af40-4799-b76e-97e510036bc7', 
                    '6093b040-368c-47ed-9158-b6f0104675d3'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'c43025c3-af40-4799-b76e-97e510036bc7', 
                    '88d286f1-aa0c-49c5-b9b4-b27c8f2e4590'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '354139a1-abc0-44c3-a36a-3aac3c76e95d', 
                    '09235899-6f1d-42b2-a1b6-81bdaa363e2b'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '01ba87c2-4168-4a13-89fe-6b584c1bbc87', 
                    'd22b8531-f8e3-4d45-b66b-b2cb8f35c88d'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '01ba87c2-4168-4a13-89fe-6b584c1bbc87', 
                    'bfaa649c-4a06-40e1-a454-7030b9caec0c'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '8f0e0d2d-dcaf-4067-a587-808e818de0c6', 
                    '88d286f1-aa0c-49c5-b9b4-b27c8f2e4590'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '8f0e0d2d-dcaf-4067-a587-808e818de0c6', 
                    'bfaa649c-4a06-40e1-a454-7030b9caec0c'
                );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '05bde372-f79d-43c6-8ce8-3b8c9ce2d8bf', 
                'https://great-grey.net/', 
                'Arlene Funk', 
                '["bn_BD","fi_FI"]', 
                '{"nameEn":"Moore, Miller and Lubowitz","nameJa":"斎藤建設有限会社","mapLatitude":35.0894,"mapLongitude":135.7919,"contact":{"googleMapsUrl":"https://every-platypus.org/","email":"MooreMillerandLubowitz82@gmail.com","phone":"9434251233 x548","website":"https://used-letter.name","address":{"addressLine1En":"98106 E Pine Street","addressLine2En":"Suite 944","addressLine1Ja":"311 洋子Meadows","addressLine2Ja":"Apt. 177","cityEn":"Kyoto","cityJa":"京都","postalCode":"676-3856","prefectureEn":"Kyoto","prefectureJa":"京都府"}}}', 
                '[{"names":[{"firstName":"Dennis","middleName":"Corey","lastName":"Larson","locale":"en_US"}],"degrees":["DSc","PharmD"],"specialties":["MEDICAL_GENETICS","ALLERGY_AND_IMMUNOLOGY"],"spokenLanguages":["sr_Cyrl","is_IS"],"acceptedInsurance":["JAPANESE_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Daniella","middleName":"North","lastName":"Buckridge","locale":"en_US"}],"degrees":["MPH","EdD"],"specialties":["DIAGNOSTIC_RADIOLOGY","FAMILY_MEDICINE"],"spokenLanguages":["vi_VN","ja_JP"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T18:08:48.679Z',
                '2025-11-06T18:08:48.680Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '2d2c9bee-d5dd-4f0b-8de9-d64572e1e894', 
                'https://assured-stockings.org/', 
                'Malcolm Powlowski', 
                '["zh_HK","el_GR"]', 
                '{"nameEn":"Ryan - Kshlerin","nameJa":"松本鉱業有限会社","mapLatitude":43.0837,"mapLongitude":141.313,"contact":{"googleMapsUrl":"https://velvety-tunnel.biz","email":"Ryan-Kshlerin_Klocko@yahoo.com","phone":"15973536130 x9807","website":"https://lucky-oval.name/","address":{"addressLine1En":"26211 White Extension","addressLine2En":"Suite 936","addressLine1Ja":"7365 萌Harbor","addressLine2Ja":"Apt. 392","cityEn":"Sapporo","cityJa":"札幌","postalCode":"049-9019","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
                '[{"names":[{"firstName":"Willow","middleName":"James","lastName":"Grady","locale":"en_US"}],"degrees":["NP","PA"],"specialties":["PHARMACY","UROLOGY"],"spokenLanguages":["sw_KE","cy_GB"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Lyric","middleName":"Sawyer","lastName":"Hilll","locale":"en_US"}],"degrees":["DVM","DO"],"specialties":["MEDICAL_GENETICS","TRAUMATOLOGY"],"spokenLanguages":["pl_PL"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T18:08:48.680Z',
                '2025-11-06T18:08:48.680Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                'deb89312-42f8-4458-9bbe-0edce3697d89', 
                'https://cute-fiction.org/', 
                'Ramiro Konopelski', 
                '["fr_FR","bs_BA"]', 
                '{"nameEn":"Davis and Sons","nameJa":"中村水産合名会社","mapLatitude":35.6481,"mapLongitude":139.5572,"contact":{"googleMapsUrl":"https://plastic-fax.info/","email":"DavisandSons.Turcotte91@hotmail.com","phone":"(604) 6347951 x441","website":"https://prickly-bottom-line.name","address":{"addressLine1En":"36283 Grange Avenue","addressLine2En":"Suite 870","addressLine1Ja":"59033 正Lakes","addressLine2Ja":"Suite 383","cityEn":"Tokyo","cityJa":"東京","postalCode":"107-1098","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"咲良","lastName":"吉田","locale":"ja_JP"}],"degrees":["CNM","DNP"],"specialties":["PREVENTIVE_MEDICINE","INFECTIOUS_DISEASES"],"spokenLanguages":["es_ES"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"美月","lastName":"田中","locale":"ja_JP"}],"degrees":["DSW","DO"],"specialties":["PEDIATRICS","CARDIOLOGY"],"spokenLanguages":["ig_NG","ru_RU"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'rejected',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T18:08:48.681Z',
                '2025-11-06T18:08:48.681Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '3b9bf5c0-71ce-4b0e-bfe5-8966dfa34197', 
                'https://favorable-tract.name/', 
                'Diana Ritchie', 
                '["bs_BA","pl_PL"]', 
                '{"nameEn":"Rempel Group","nameJa":"田中情報合同会社","mapLatitude":35.6625,"mapLongitude":139.8191,"contact":{"googleMapsUrl":"https://agile-signal.org","email":"RempelGroup14@gmail.com","phone":"437.488.6630 x0905","website":"https://curvy-recorder.name/","address":{"addressLine1En":"536 Waterside","addressLine2En":"Suite 549","addressLine1Ja":"30081 山口Garden","addressLine2Ja":"Suite 415","cityEn":"Tokyo","cityJa":"東京","postalCode":"186-3793","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"Shayna","middleName":"Corey","lastName":"Miller","locale":"en_US"}],"degrees":["CNM","DSW"],"specialties":["PREVENTIVE_MEDICINE","COSMETIC_SURGERY"],"spokenLanguages":["chr_US"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Justina","middleName":"Bailey","lastName":"Ledner","locale":"en_US"}],"degrees":["PharmD","PsyD"],"specialties":["PEDIATRICS","CARDIOLOGY"],"spokenLanguages":["bm_ML"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T18:08:48.681Z',
                '2025-11-06T18:08:48.681Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '422d4d35-7304-44d2-acaf-4f6050af49da', 
                'https://joyful-hound.biz/', 
                'Wendell Waters', 
                '["zh_TW","is_IS"]', 
                '{"nameEn":"Stokes, Wolf and Terry","nameJa":"合資会社山田水産","mapLatitude":35.6326,"mapLongitude":139.8614,"contact":{"googleMapsUrl":"https://grubby-limo.name","email":"StokesWolfandTerry2@yahoo.com","phone":"3238370671","website":"https://flamboyant-provider.name/","address":{"addressLine1En":"485 Wellington Road","addressLine2En":"Apt. 868","addressLine1Ja":"128 照子Plaza","addressLine2Ja":"Apt. 622","cityEn":"Tokyo","cityJa":"東京","postalCode":"116-8084","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"Josh","middleName":"Angel","lastName":"Cremin","locale":"en_US"}],"degrees":["DPT","MPH"],"specialties":["EMERGENCY_MEDICINE","SPORTS_MEDICINE"],"spokenLanguages":["am_ET"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"純子","lastName":"山本","locale":"ja_JP"}],"degrees":["DSc","DPT"],"specialties":["TRAUMATOLOGY","ENT_SPECIALIST"],"spokenLanguages":["he_IL"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-06T18:08:48.682Z',
                '2025-11-06T18:08:48.682Z'
            );