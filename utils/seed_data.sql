-- Clean up existing data to ensure a fresh start
DELETE FROM hps_facilities;
DELETE FROM hps;
DELETE FROM facilities;
DELETE FROM submissions;
------------------------------------


            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'c7f3acaf-a96b-4ba5-9d2f-aa4f17b1f265', 
                'O''Conner, Monahan and Mayer', 
                '山口電気合資会社', 
                35.0166, 
                135.7125, 
                '{"googleMapsUrl":"https://cautious-contingency.net/","email":"OConnerMonahanandMayer90@gmail.com","phone":"4028474766","website":"https://crafty-commercial.net/","address":{"addressLine1En":"789 Wisoky Viaduct","addressLine2En":"Apt. 594","addressLine1Ja":"53410 百花Tunnel","addressLine2Ja":"Suite 502","cityEn":"Kyoto","cityJa":"京都","postalCode":"689-6339","prefectureEn":"Kyoto","prefectureJa":"京都府"}}',
                '2025-11-09T00:02:07.001Z',
                '2025-11-09T00:02:07.002Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                '2dffc7d2-89ae-44e1-957e-1caad3cfaf54', 
                'Murazik - Ankunding', 
                '佐々木保険合同会社', 
                35.711, 
                139.6072, 
                '{"googleMapsUrl":"https://meaty-deficit.org","email":"Murazik-Ankunding_Homenick@gmail.com","phone":"5029960515","website":"https://talkative-digestive.name","address":{"addressLine1En":"49816 Nelle Alley","addressLine2En":"Apt. 517","addressLine1Ja":"7651 斎藤Ford","addressLine2Ja":"Apt. 221","cityEn":"Tokyo","cityJa":"東京","postalCode":"112-2734","prefectureEn":"Tokyo","prefectureJa":"東京都"}}',
                '2025-11-09T00:02:07.002Z',
                '2025-11-09T00:02:07.002Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'e552f3bd-f99d-4295-855d-9da5c4758464', 
                'Barrows LLC', 
                '有限会社井上銀行', 
                43.0931, 
                141.3722, 
                '{"googleMapsUrl":"https://feline-loquat.com","email":"BarrowsLLC.Cormier@yahoo.com","phone":"331.770.3672","website":"https://nautical-storey.com","address":{"addressLine1En":"36540 Arne Bypass","addressLine2En":"Suite 402","addressLine1Ja":"388 直美Oval","addressLine2Ja":"Suite 607","cityEn":"Sapporo","cityJa":"札幌","postalCode":"027-1892","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}',
                '2025-11-09T00:02:07.002Z',
                '2025-11-09T00:02:07.002Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                '3f51724d-de94-4966-8a93-6f72415a9d5b', 
                'McLaughlin, Weimann and Lakin', 
                '有限会社井上ガス', 
                43.0503, 
                141.357, 
                '{"googleMapsUrl":"https://unusual-battalion.name","email":"McLaughlinWeimannandLakin.Paucek@gmail.com","phone":"3402355708","website":"https://satisfied-tachometer.biz","address":{"addressLine1En":"7138 Alvis Roads","addressLine2En":"Apt. 414","addressLine1Ja":"51037 幸子Loaf","addressLine2Ja":"Suite 987","cityEn":"Sapporo","cityJa":"札幌","postalCode":"017-0772","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}',
                '2025-11-09T00:02:07.002Z',
                '2025-11-09T00:02:07.002Z'
            );

            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact, "createdDate", "updatedDate"
            ) VALUES (
                'd8ddf387-c4ab-4f35-a61d-e45193e14746', 
                'Dare - Steuber', 
                '有限会社高橋農林', 
                35.0448, 
                135.7262, 
                '{"googleMapsUrl":"https://rich-verdict.com/","email":"Dare-Steuber93@hotmail.com","phone":"(994) 9638639 x941","website":"https://trusting-spike.name","address":{"addressLine1En":"1436 Wisoky Green","addressLine2En":"Apt. 125","addressLine1Ja":"85420 井上Square","addressLine2Ja":"Suite 736","cityEn":"Kyoto","cityJa":"京都","postalCode":"664-1466","prefectureEn":"Kyoto","prefectureJa":"京都府"}}',
                '2025-11-09T00:02:07.002Z',
                '2025-11-09T00:02:07.002Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                'e6efdda0-80b5-43d6-8a4f-e291984171fb', 
                '[{"firstName":"Maverick","middleName":"Finley","lastName":"Dicki","locale":"en_US"}]', 
                '["DMD","DC"]', 
                '["PLASTIC_SURGERY","OPTOMETRY"]', 
                '["ru_RU"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                '',
                '2025-11-09T00:02:07.003Z',
                '2025-11-09T00:02:07.003Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                '7b747aab-c9f8-468a-8b27-2a42e5ec1a0d', 
                '[{"firstName":"Esmeralda","middleName":"Blake","lastName":"Bartell","locale":"en_US"}]', 
                '["PhD","DPT"]', 
                '["MEDICAL_GENETICS","PEDIATRICS"]', 
                '["hu_HU","lv_LV"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                '',
                '2025-11-09T00:02:07.003Z',
                '2025-11-09T00:02:07.003Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                'a5f1d29e-3066-4024-b7c9-ad801ada5522', 
                '[{"firstName":"Reta","middleName":"Jordan","lastName":"Brown","locale":"en_US"}]', 
                '["PA","DC"]', 
                '["FAMILY_MEDICINE","MEDICAL_GENETICS"]', 
                '["pl_PL","el_GR"]', 
                '["JAPANESE_HEALTH_INSURANCE"]', 
                '',
                '2025-11-09T00:02:07.003Z',
                '2025-11-09T00:02:07.003Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                '1b753ef3-546c-47c8-87c7-858d8dcec62b', 
                '[{"firstName":"聡","lastName":"高橋","locale":"ja_JP"}]', 
                '["CNM","DO"]', 
                '["SPORTS_MEDICINE","PSYCHIATRY"]', 
                '["km_KH","vi_VN"]', 
                '["INSURANCE_NOT_ACCEPTED"]', 
                '',
                '2025-11-09T00:02:07.003Z',
                '2025-11-09T00:02:07.003Z'
            );
INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients", "createdDate", "updatedDate"
            ) VALUES (
                'fdc2d728-5887-4327-add5-a081b026f5f5', 
                '[{"firstName":"千代","lastName":"山田","locale":"ja_JP"}]', 
                '["DC","DDS"]', 
                '["PHYSICAL_MEDICINE_AND_REHABILITATION","PROCTOLOGY"]', 
                '["tr_TR","it_IT"]', 
                '["INTERNATIONAL_HEALTH_INSURANCE"]', 
                '',
                '2025-11-09T00:02:07.003Z',
                '2025-11-09T00:02:07.003Z'
            );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'e6efdda0-80b5-43d6-8a4f-e291984171fb', 
                    'e552f3bd-f99d-4295-855d-9da5c4758464'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'e6efdda0-80b5-43d6-8a4f-e291984171fb', 
                    'c7f3acaf-a96b-4ba5-9d2f-aa4f17b1f265'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'e6efdda0-80b5-43d6-8a4f-e291984171fb', 
                    'd8ddf387-c4ab-4f35-a61d-e45193e14746'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '7b747aab-c9f8-468a-8b27-2a42e5ec1a0d', 
                    'd8ddf387-c4ab-4f35-a61d-e45193e14746'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '7b747aab-c9f8-468a-8b27-2a42e5ec1a0d', 
                    'e552f3bd-f99d-4295-855d-9da5c4758464'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '7b747aab-c9f8-468a-8b27-2a42e5ec1a0d', 
                    '3f51724d-de94-4966-8a93-6f72415a9d5b'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'a5f1d29e-3066-4024-b7c9-ad801ada5522', 
                    '2dffc7d2-89ae-44e1-957e-1caad3cfaf54'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'a5f1d29e-3066-4024-b7c9-ad801ada5522', 
                    '3f51724d-de94-4966-8a93-6f72415a9d5b'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '1b753ef3-546c-47c8-87c7-858d8dcec62b', 
                    'e552f3bd-f99d-4295-855d-9da5c4758464'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '1b753ef3-546c-47c8-87c7-858d8dcec62b', 
                    '2dffc7d2-89ae-44e1-957e-1caad3cfaf54'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    '1b753ef3-546c-47c8-87c7-858d8dcec62b', 
                    '3f51724d-de94-4966-8a93-6f72415a9d5b'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'fdc2d728-5887-4327-add5-a081b026f5f5', 
                    'd8ddf387-c4ab-4f35-a61d-e45193e14746'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'fdc2d728-5887-4327-add5-a081b026f5f5', 
                    '2dffc7d2-89ae-44e1-957e-1caad3cfaf54'
                );
INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    'fdc2d728-5887-4327-add5-a081b026f5f5', 
                    'c7f3acaf-a96b-4ba5-9d2f-aa4f17b1f265'
                );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '2cc38c23-aeb1-4737-9c1c-dc2b1e97ff74', 
                'https://specific-sycamore.name', 
                'Connie Rolfson', 
                '["es_ES","nl_BE"]', 
                '{"nameEn":"Ziemann and Sons","nameJa":"有限会社高橋情報","mapLatitude":43.0504,"mapLongitude":141.37,"contact":{"googleMapsUrl":"https://rare-bandana.net","email":"ZiemannandSons_Wuckert@gmail.com","phone":"(864) 9069934","website":"https://frank-working.biz","address":{"addressLine1En":"579 Pine Street","addressLine2En":"Suite 250","addressLine1Ja":"712 直美Dam","addressLine2Ja":"Suite 647","cityEn":"Sapporo","cityJa":"札幌","postalCode":"090-2652","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
                '[{"names":[{"firstName":"浩","lastName":"高橋","locale":"ja_JP"}],"degrees":["PsyD","DPM"],"specialties":["OPHTHALMOLOGY","ORTHODONTICS"],"spokenLanguages":["bn_BD"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Dylan","middleName":"Corey","lastName":"Little","locale":"en_US"}],"degrees":["DDS","DNP"],"specialties":["DERMATOLOGY","NUCLEAR_MEDICINE"],"spokenLanguages":["it_IT"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-09T00:02:07.004Z',
                '2025-11-09T00:02:07.004Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                'f8d95258-25a2-4e3d-b1a3-2b3cfd8b4229', 
                'https://giddy-deadline.info', 
                'Jimmie Morar', 
                '["vi_VN","ak_GH"]', 
                '{"nameEn":"Wolff, Zulauf and Schroeder","nameJa":"有限会社林食品","mapLatitude":35.0116,"mapLongitude":135.7601,"contact":{"googleMapsUrl":"https://kindly-pine.com/","email":"WolffZulaufandSchroeder_Cruickshank38@yahoo.com","phone":"7724365786","website":"https://calm-synergy.biz","address":{"addressLine1En":"41858 Annamae Plaza","addressLine2En":"Apt. 358","addressLine1Ja":"29420 キヨHarbor","addressLine2Ja":"Apt. 278","cityEn":"Kyoto","cityJa":"京都","postalCode":"614-1366","prefectureEn":"Kyoto","prefectureJa":"京都府"}}}', 
                '[{"names":[{"firstName":"蒼","lastName":"加藤","locale":"ja_JP"}],"degrees":["EdD","DMD"],"specialties":["ALLERGY_AND_IMMUNOLOGY","PHARMACY"],"spokenLanguages":["km_KH"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"海翔","lastName":"渡辺","locale":"ja_JP"}],"degrees":["DMD","PharmD"],"specialties":["GENERAL_MEDICINE","PHYSIOTHERAPY"],"spokenLanguages":["da_DK"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-09T00:02:07.005Z',
                '2025-11-09T00:02:07.005Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '547f53bc-7167-4084-ac22-dbba3cc56bed', 
                'https://major-shingle.name', 
                'Miss Christie Kris', 
                '["km_KH","kab_DZ"]', 
                '{"nameEn":"Purdy - Schultz","nameJa":"佐藤運輸合名会社","mapLatitude":43.0145,"mapLongitude":141.3961,"contact":{"googleMapsUrl":"https://unacceptable-playground.com","email":"Purdy-Schultz99@hotmail.com","phone":"15286473931 x099","website":"https://pale-injury.org","address":{"addressLine1En":"95526 Rutherford Points","addressLine2En":"Suite 271","addressLine1Ja":"685 結菜Manors","addressLine2Ja":"Suite 705","cityEn":"Sapporo","cityJa":"札幌","postalCode":"093-4922","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
                '[{"names":[{"firstName":"Christophe","middleName":"North","lastName":"Kessler","locale":"en_US"}],"degrees":["MD","DPT"],"specialties":["PREVENTIVE_MEDICINE","OPTOMETRY"],"spokenLanguages":["si_LK","guz_KE"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Thora","middleName":"Phoenix","lastName":"Emmerich","locale":"en_US"}],"degrees":["DC","MD"],"specialties":["PHYSIOTHERAPY","EMERGENCY_MEDICINE"],"spokenLanguages":["cs_CZ"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'rejected',
                NULL,
                NULL,
                FALSE,
                '2025-11-09T00:02:07.005Z',
                '2025-11-09T00:02:07.005Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '0d62c78f-3b85-405b-b0ec-ec2d81f15f1d', 
                'https://exotic-allegation.info', 
                'Belinda O''Keefe', 
                '["hi_IN","ja_JP"]', 
                '{"nameEn":"Ullrich LLC","nameJa":"田中水産有限会社","mapLatitude":35.7939,"mapLongitude":139.8076,"contact":{"googleMapsUrl":"https://humming-condor.com/","email":"UllrichLLC.Sawayn70@hotmail.com","phone":"(893) 5948185 x441","website":"https://wiry-garlic.org/","address":{"addressLine1En":"36727 Grant Ville","addressLine2En":"Apt. 618","addressLine1Ja":"494 渡辺Green","addressLine2Ja":"Apt. 575","cityEn":"Tokyo","cityJa":"東京","postalCode":"143-3547","prefectureEn":"Tokyo","prefectureJa":"東京都"}}}', 
                '[{"names":[{"firstName":"Jonathon","middleName":"August","lastName":"Armstrong","locale":"en_US"}],"degrees":["MD","DMD"],"specialties":["PSYCHIATRY","INTERNAL_MEDICINE"],"spokenLanguages":["hy_AM","hy_AM"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"大雅","lastName":"田中","locale":"ja_JP"}],"degrees":["DNP","OD"],"specialties":["OTOLARYNGOLOGY","FAMILY_MEDICINE"],"spokenLanguages":["cy_GB","nl_BE"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'approved',
                NULL,
                NULL,
                FALSE,
                '2025-11-09T00:02:07.006Z',
                '2025-11-09T00:02:07.006Z'
            );
INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                '56e8907e-3394-457b-8dd8-c29a9e2acb2c', 
                'https://unequaled-ascent.net/', 
                'Pearl Yundt Sr.', 
                '["el_GR","th_TH"]', 
                '{"nameEn":"Nicolas - Runte","nameJa":"山口銀行合同会社","mapLatitude":35.0863,"mapLongitude":135.7623,"contact":{"googleMapsUrl":"https://junior-antelope.net/","email":"Nicolas-Runte_Rosenbaum0@gmail.com","phone":"4358540735 x89348","website":"https://gentle-vellum.org","address":{"addressLine1En":"27915 Station Street","addressLine2En":"Apt. 553","addressLine1Ja":"89323 陽斗Motorway","addressLine2Ja":"Apt. 607","cityEn":"Kyoto","cityJa":"京都","postalCode":"643-0220","prefectureEn":"Kyoto","prefectureJa":"京都府"}}}', 
                '[{"names":[{"firstName":"颯太","lastName":"佐々木","locale":"ja_JP"}],"degrees":["DSW","PhD"],"specialties":["INTERNAL_MEDICINE","OBSTETRICS_AND_GYNECOLOGY"],"spokenLanguages":["ru_RU","lv_LV"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"真由","lastName":"鈴木","locale":"ja_JP"}],"degrees":["DPT","PsyD"],"specialties":["ALLERGY_AND_IMMUNOLOGY","PATHOLOGY"],"spokenLanguages":["hu_HU"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
                'under_review',
                NULL,
                NULL,
                FALSE,
                '2025-11-09T00:02:07.007Z',
                '2025-11-09T00:02:07.007Z'
            );