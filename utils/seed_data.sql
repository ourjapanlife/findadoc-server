-- Clean up existing data to ensure a fresh start
DELETE FROM hps_facilities;
DELETE FROM hps;
DELETE FROM facilities;
DELETE FROM submissions;
------------------------------------


            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'a070057b-8a52-4216-b2b5-3f1ca9161ba9', 
                'Connelly, Hickle and Hagenes', 
                '有限会社佐々木水産', 
                35.6887, 
                139.3034, 
                '{"googleMapsUrl":"https://narrow-prevalence.org/","email":"ConnellyHickleandHagenes_Windler@hotmail.com","phone":"9924611995 x186","website":"https://numb-heartache.net","address":{"addressLine1En":"63580 Henry Street","addressLine2En":"Apt. 902","addressLine1Ja":"64268 佐藤Mountain","addressLine2Ja":"Apt. 487","cityEn":"Tokyo","cityJa":"東京","postalCode":"114-4336","prefectureEn":"Tokyo","prefectureJa":"東京都"}}',
                '2025-11-11T22:26:47.649Z',
                '2025-11-11T22:26:47.650Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'cf7ed869-a7eb-4ade-884a-a9f5badf354c', 
                'Erdman - Monahan', 
                '鈴木運輸合同会社', 
                35.0194, 
                135.7343, 
                '{"googleMapsUrl":"https://urban-entree.com/","email":"Erdman-Monahan.Mohr97@gmail.com","phone":"18323693267 x738","website":"https://intent-grass.net/","address":{"addressLine1En":"483 Warren Close","addressLine2En":"Apt. 916","addressLine1Ja":"6276 田中Station","addressLine2Ja":"Suite 755","cityEn":"Kyoto","cityJa":"京都","postalCode":"604-3071","prefectureEn":"Kyoto","prefectureJa":"京都府"}}',
                '2025-11-11T22:26:47.650Z',
                '2025-11-11T22:26:47.650Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'cc9f4a62-6802-4a4b-bea9-30200149cb42', 
                'Abernathy and Sons', 
                '佐藤電気合名会社', 
                35.7414, 
                139.4924, 
                '{"googleMapsUrl":"https://svelte-contest.net/","email":"AbernathyandSons_Beahan@hotmail.com","phone":"15666645037 x8317","website":"https://enormous-bill.biz","address":{"addressLine1En":"785 Carli Parkways","addressLine2En":"Suite 910","addressLine1Ja":"85885 愛莉Alley","addressLine2Ja":"Apt. 689","cityEn":"Tokyo","cityJa":"東京","postalCode":"136-0486","prefectureEn":"Tokyo","prefectureJa":"東京都"}}',
                '2025-11-11T22:26:47.650Z',
                '2025-11-11T22:26:47.650Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'e6fc2bee-35c8-40d5-b26e-3ccf48425ec1', 
                'Cartwright, Yundt and Gulgowski', 
                '合同会社中村保険', 
                43.0809, 
                141.3906, 
                '{"googleMapsUrl":"https://dutiful-event.net/","email":"CartwrightYundtandGulgowski59@gmail.com","phone":"439.535.4173","website":"https://bite-sized-offence.org","address":{"addressLine1En":"804 Elody Roads","addressLine2En":"Apt. 549","addressLine1Ja":"259 理恵Pine","addressLine2Ja":"Suite 473","cityEn":"Sapporo","cityJa":"札幌","postalCode":"005-2295","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}',
                '2025-11-11T22:26:47.650Z',
                '2025-11-11T22:26:47.651Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'ad16840e-42b0-4b92-90bd-2f95c9791a3a', 
                'Grant, Harris and Rutherford', 
                '山田保険有限会社', 
                35.0001, 
                135.7603, 
                '{"googleMapsUrl":"https://comfortable-deadline.biz","email":"GrantHarrisandRutherford74@yahoo.com","phone":"(611) 7017022","website":"https://far-off-green.com","address":{"addressLine1En":"1535 Ziemann Circle","addressLine2En":"Apt. 380","addressLine1Ja":"40110 早紀Extensions","addressLine2Ja":"Apt. 551","cityEn":"Kyoto","cityJa":"京都","postalCode":"654-1634","prefectureEn":"Kyoto","prefectureJa":"京都府"}}',
                '2025-11-11T22:26:47.651Z',
                '2025-11-11T22:26:47.651Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                '89c25188-b55f-4331-9cfe-e0d8d676785d', 
                '[{"firstName":"未来","lastName":"木村","locale":"ja_JP"}]', 
                '["DMD","PharmD"]', 
                '["SPORTS_MEDICINE","INFECTIOUS_DISEASES"]', 
                '["he_IL"]', 
                '["JAPANESE_HEALTH_INSURANCE"]', 
                '',
                '2025-11-11T22:26:47.652Z',
                '2025-11-11T22:26:47.652Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                '39a499af-bd41-430c-9113-7eeefe93ba9b', 
                '[{"firstName":"彩香","lastName":"山口","locale":"ja_JP"}]', 
                '["DPT","PsyD"]', 
                '["OPHTHALMOLOGY","PSYCHIATRY"]', 
                '["he_IL"]', 
                '["INTERNATIONAL_HEALTH_INSURANCE"]', 
                '',
                '2025-11-11T22:26:47.652Z',
                '2025-11-11T22:26:47.652Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                'e6a64afc-df4e-48be-af73-38ca4304a696', 
                '[{"firstName":"Charlene","middleName":"Jules","lastName":"Herzog","locale":"en_US"}]', 
                '["NP","PhD"]', 
                '["SPORTS_MEDICINE","PLASTIC_SURGERY"]', 
                '["km_KH"]', 
                '["TRAVEL_INSURANCE"]', 
                '',
                '2025-11-11T22:26:47.652Z',
                '2025-11-11T22:26:47.652Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                'b7cbd4f1-edf8-4a4f-9260-89e189288f99', 
                '[{"firstName":"智子","lastName":"松本","locale":"ja_JP"}]', 
                '["DNP","DVM"]', 
                '["SPORTS_MEDICINE","ANESTHESIOLOGY"]', 
                '["ko_KR"]', 
                '["INTERNATIONAL_HEALTH_INSURANCE"]', 
                '',
                '2025-11-11T22:26:47.652Z',
                '2025-11-11T22:26:47.652Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                'e7dc5e33-2bc8-4f6d-b8e3-9ad49d97a2df', 
                '[{"firstName":"Renee","middleName":"Harper","lastName":"O''Kon","locale":"en_US"}]', 
                '["DVM","DO"]', 
                '["EMERGENCY_MEDICINE","PATHOLOGY"]', 
                '["zh_TW","cs_CZ"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                '',
                '2025-11-11T22:26:47.652Z',
                '2025-11-11T22:26:47.652Z'
            );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '89c25188-b55f-4331-9cfe-e0d8d676785d', 
                    'e6fc2bee-35c8-40d5-b26e-3ccf48425ec1'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '39a499af-bd41-430c-9113-7eeefe93ba9b', 
                    'cf7ed869-a7eb-4ade-884a-a9f5badf354c'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '39a499af-bd41-430c-9113-7eeefe93ba9b', 
                    'ad16840e-42b0-4b92-90bd-2f95c9791a3a'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '39a499af-bd41-430c-9113-7eeefe93ba9b', 
                    'cc9f4a62-6802-4a4b-bea9-30200149cb42'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'e6a64afc-df4e-48be-af73-38ca4304a696', 
                    'cf7ed869-a7eb-4ade-884a-a9f5badf354c'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'e6a64afc-df4e-48be-af73-38ca4304a696', 
                    'a070057b-8a52-4216-b2b5-3f1ca9161ba9'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'e6a64afc-df4e-48be-af73-38ca4304a696', 
                    'e6fc2bee-35c8-40d5-b26e-3ccf48425ec1'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'b7cbd4f1-edf8-4a4f-9260-89e189288f99', 
                    'ad16840e-42b0-4b92-90bd-2f95c9791a3a'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'b7cbd4f1-edf8-4a4f-9260-89e189288f99', 
                    'e6fc2bee-35c8-40d5-b26e-3ccf48425ec1'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'b7cbd4f1-edf8-4a4f-9260-89e189288f99', 
                    'cf7ed869-a7eb-4ade-884a-a9f5badf354c'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'e7dc5e33-2bc8-4f6d-b8e3-9ad49d97a2df', 
                    'cf7ed869-a7eb-4ade-884a-a9f5badf354c'
                );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '787a8e7e-a8e3-4c6c-9936-89002bd0dbf7', 
                'https://barren-marble.org/', 
                'Ricky Bechtelar', 
                '["lag_TZ","es_ES"]', 
                '{"nameEn":"Casper - Moore","nameJa":"合同会社高橋建設","mapLatitude":35.7754,"mapLongitude":139.4811,"contact":{"googleMapsUrl":"https://petty-tear.net/","email":"Casper-Moore.Rosenbaum@yahoo.com","phone":"274.762.0689","website":"https://motherly-ear.info/","address":{"addressLine1En":"7539 Nannie Radial","addressLine2En":"Suite 595","addressLine1Ja":"82729 山田Grove","addressLine2Ja":"Suite 896","cityEn":"Tokyo","cityJa":"東京","postalCode":"191-9083","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"心優","lastName":"渡辺","locale":"ja_JP"}],"degrees":["PharmD","NP"],"specialties":["PEDIATRICS","PREVENTIVE_MEDICINE"],"spokenLanguages":["hy_AM","si_LK"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"恵美子","lastName":"伊藤","locale":"ja_JP"}],"degrees":["DSW","MPH"],"specialties":["DERMATOLOGY","GENERAL_MEDICINE"],"spokenLanguages":["id_ID","nb_NO"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-11T22:26:47.654Z',
                '2025-11-11T22:26:47.654Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                'de617923-a818-476e-a4e1-1463007a486a', 
                'https://coordinated-identification.info/', 
                'Victor Walker', 
                '["da_DK","nb_NO"]', 
                '{"nameEn":"Smith LLC","nameJa":"合同会社高橋水産","mapLatitude":35.6785,"mapLongitude":139.8365,"contact":{"googleMapsUrl":"https://tragic-train.name","email":"SmithLLC99@hotmail.com","phone":"8367226345","website":"https://innocent-gosling.org/","address":{"addressLine1En":"1355 E River Road","addressLine2En":"Suite 466","addressLine1Ja":"9656 田中Lodge","addressLine2Ja":"Apt. 448","cityEn":"Tokyo","cityJa":"東京","postalCode":"166-4908","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"進","lastName":"渡辺","locale":"ja_JP"}],"degrees":["DSc","DNP"],"specialties":["INTERNAL_MEDICINE","DIAGNOSTIC_RADIOLOGY"],"spokenLanguages":["tr_TR"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"瞳","lastName":"井上","locale":"ja_JP"}],"degrees":["PA","DSW"],"specialties":["PHYSIOTHERAPY","PATHOLOGY"],"spokenLanguages":["lag_TZ","pt_BR"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-11T22:26:47.655Z',
                '2025-11-11T22:26:47.655Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '0328bb86-2d3a-4b0d-ae27-8bf7bc4f434b', 
                'https://honorable-finer.org', 
                'Samuel Willms', 
                '["nl_BE","guz_KE"]', 
                '{"nameEn":"Abbott, Vandervort and Williamson","nameJa":"有限会社田中情報","mapLatitude":43.0688,"mapLongitude":141.3723,"contact":{"googleMapsUrl":"https://constant-gator.name","email":"AbbottVandervortandWilliamson.Lowe66@gmail.com","phone":"(628) 5802536","website":"https://real-sock.name","address":{"addressLine1En":"44212 Atlantic Avenue","addressLine2En":"Apt. 269","addressLine1Ja":"267 佐藤Land","addressLine2Ja":"Apt. 919","cityEn":"Sapporo","cityJa":"札幌","postalCode":"084-9515","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
                '[{"names":[{"firstName":"Cecil","middleName":"Avery","lastName":"Gottlieb","locale":"en_US"}],"degrees":["PA","MD"],"specialties":["PHYSIOTHERAPY","UROLOGY"],"spokenLanguages":["en_US","lag_TZ"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"菜摘","lastName":"鈴木","locale":"ja_JP"}],"degrees":["MPH","OD"],"specialties":["PLASTIC_SURGERY","SPORTS_MEDICINE"],"spokenLanguages":["ko_KR"],"acceptedInsurance":["JAPANESE_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'rejected',
                NULL,
                NULL,
                FALSE,
                '2025-11-11T22:26:47.655Z',
                '2025-11-11T22:26:47.655Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '3051f056-aa52-4809-a652-ac20da85d3c8', 
                'https://faint-bacterium.biz', 
                'Jordan Pfeffer', 
                '["chr_US","ee_GH"]', 
                '{"nameEn":"Dietrich Inc","nameJa":"山田建設株式会社","mapLatitude":43.0595,"mapLongitude":141.3564,"contact":{"googleMapsUrl":"https://cute-tonic.biz/","email":"DietrichInc_Davis31@yahoo.com","phone":"3685602877 x57876","website":"https://lovely-derivation.org/","address":{"addressLine1En":"35137 Oak Drive","addressLine2En":"Suite 186","addressLine1Ja":"54160 正三Garden","addressLine2Ja":"Suite 413","cityEn":"Sapporo","cityJa":"札幌","postalCode":"077-9566","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
                '[{"names":[{"firstName":"Lempi","middleName":"Kennedy","lastName":"O''Conner","locale":"en_US"}],"degrees":["CNM","DSW"],"specialties":["PATHOLOGY","ANESTHESIOLOGY"],"spokenLanguages":["zh_HK"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"亮太","lastName":"山田","locale":"ja_JP"}],"degrees":["CNM","EdD"],"specialties":["UROLOGY","DENTISTRY"],"spokenLanguages":["mn_MN","nl_BE"],"acceptedInsurance":["JAPANESE_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-11T22:26:47.656Z',
                '2025-11-11T22:26:47.656Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '12b797f1-4f99-4838-9384-1aa4dfd80456', 
                'https://trusting-sinuosity.net', 
                'Meghan Orn', 
                '["und","pl_PL"]', 
                '{"nameEn":"Ward - Boehm","nameJa":"木村印刷有限会社","mapLatitude":35.7309,"mapLongitude":139.327,"contact":{"googleMapsUrl":"https://meager-emu.com/","email":"Ward-Boehm94@hotmail.com","phone":"7029742852 x857","website":"https://far-flung-rowboat.info","address":{"addressLine1En":"7370 Grayce Landing","addressLine2En":"Apt. 265","addressLine1Ja":"54431 栄子Ford","addressLine2Ja":"Apt. 116","cityEn":"Tokyo","cityJa":"東京","postalCode":"114-1983","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"Seth","middleName":"Emerson","lastName":"McCullough","locale":"en_US"}],"degrees":["PharmD","DSc"],"specialties":["OPHTHALMOLOGY","ENT_SPECIALIST"],"spokenLanguages":["bn_BD","hi_IN"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Lonie","middleName":"London","lastName":"Shields","locale":"en_US"}],"degrees":["DDS","OD"],"specialties":["PLASTIC_SURGERY","PROCTOLOGY"],"spokenLanguages":["he_IL"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-11T22:26:47.656Z',
                '2025-11-11T22:26:47.656Z'
            );