-- Clean up existing data to ensure a fresh start
DELETE FROM public.hps_facilities;
DELETE FROM public.healthcare_professionals;
DELETE FROM public.facilities;
DELETE FROM public.submissions;
------------------------------------


INSERT INTO public.facilities (
id, nameEn, nameJa, mapLatitude, mapLongitude, contact
) VALUES (
'f9676348-f989-4046-8762-36db0c2657a9', 
'Jacobson - Russel', 
'加藤通信合同会社', 
35.0405, 
135.7082, 
'{"googleMapsUrl":"https://puzzling-loading.com/","email":"Jacobson-Russel_Huel90@yahoo.com","phone":"402.541.3952 x934","website":"https://educated-freight.info","address":{"addressLine1En":"45780 Rath Passage","addressLine2En":"Apt. 710","addressLine1Ja":"143 斎藤Dam","addressLine2Ja":"Suite 885","cityEn":"Kyoto","cityJa":"京都","postalCode":"615-5313","prefectureEn":"Kyoto","prefectureJa":"京都府"}}'
);

INSERT INTO public.facilities (
id, nameEn, nameJa, mapLatitude, mapLongitude, contact
) VALUES (
'b147f044-037f-4b86-ba3d-059f84d53455', 
'Smith LLC', 
'林ガス有限会社', 
35.6006, 
139.4279, 
'{"googleMapsUrl":"https://flamboyant-legislature.com","email":"SmithLLC_Turcotte@hotmail.com","phone":"3055004111 x47060","website":"https://meaty-word.net","address":{"addressLine1En":"844 Nella Forest","addressLine2En":"Suite 493","addressLine1Ja":"5676 加藤Inlet","addressLine2Ja":"Suite 150","cityEn":"Tokyo","cityJa":"東京","postalCode":"138-7603","prefectureEn":"Tokyo","prefectureJa":"東京都"}}'
);

INSERT INTO public.facilities (
id, nameEn, nameJa, mapLatitude, mapLongitude, contact
) VALUES (
'4d79853d-65ed-4ab1-9f5e-5997bd115b00', 
'MacGyver, Marquardt and Grant', 
'田中農林合名会社', 
35.0164, 
135.7597, 
'{"googleMapsUrl":"https://corrupt-mill.biz","email":"MacGyverMarquardtandGrant.Keebler-Boehm@gmail.com","phone":"598.492.3596 x60117","website":"https://impartial-snowflake.com/","address":{"addressLine1En":"58179 Aliyah Lakes","addressLine2En":"Suite 770","addressLine1Ja":"6600 桃子Club","addressLine2Ja":"Apt. 933","cityEn":"Kyoto","cityJa":"京都","postalCode":"640-5857","prefectureEn":"Kyoto","prefectureJa":"京都府"}}'
);

INSERT INTO public.facilities (
id, nameEn, nameJa, mapLatitude, mapLongitude, contact
) VALUES (
'1ee12e1e-ab2f-4b0f-a66c-b59de44f58c5', 
'Blanda, Nitzsche and Walsh', 
'合名会社佐々木銀行', 
35.0333, 
135.7999, 
'{"googleMapsUrl":"https://inconsequential-rowing.org/","email":"BlandaNitzscheandWalsh.Mosciski56@yahoo.com","phone":"16572225945","website":"https://agreeable-pinto.biz/","address":{"addressLine1En":"222 Mann Lake","addressLine2En":"Apt. 738","addressLine1Ja":"50678 山本Cape","addressLine2Ja":"Apt. 611","cityEn":"Kyoto","cityJa":"京都","postalCode":"681-7554","prefectureEn":"Kyoto","prefectureJa":"京都府"}}'
);

INSERT INTO public.facilities (
id, nameEn, nameJa, mapLatitude, mapLongitude, contact
) VALUES (
'2014363e-f71d-4a64-891f-2ca259943533', 
'Jenkins Group', 
'合資会社山口ガス', 
35.0346, 
135.7111, 
'{"googleMapsUrl":"https://infamous-curve.net","email":"JenkinsGroup_Daugherty@yahoo.com","phone":"883.295.3736 x27679","website":"https://sarcastic-cartilage.name","address":{"addressLine1En":"10187 Vicente Canyon","addressLine2En":"Suite 758","addressLine1Ja":"35804 友美Fords","addressLine2Ja":"Apt. 851","cityEn":"Kyoto","cityJa":"京都","postalCode":"699-9491","prefectureEn":"Kyoto","prefectureJa":"京都府"}}'
);
INSERT INTO public.healthcare_professionals (
id, names, degrees, specialties, spoken_languages, accepted_insurance, additional_info_for_patients
) VALUES (
'2795fb8b-976a-41d5-85ac-f9873210f59a', 
'[{"firstName":"Erica","middleName":"Greer","lastName":"Hickle","locale":"en_US"}]', 
'["NP","DNP"]', 
'["DENTISTRY","OPHTHALMOLOGY"]', 
'["he_IL"]', 
'["JAPANESE_HEALTH_INSURANCE"]', 
''
);
INSERT INTO public.healthcare_professionals (
id, names, degrees, specialties, spoken_languages, accepted_insurance, additional_info_for_patients
) VALUES (
'7404a889-891c-4d75-94b7-af5bcf24fd0a', 
'[{"firstName":"駿","lastName":"井上","locale":"ja_JP"}]', 
'["DVM","EdD"]', 
'["INFECTIOUS_DISEASES","TRAUMATOLOGY"]', 
'["zh_HK"]', 
'["JAPANESE_HEALTH_INSURANCE"]', 
''
);
INSERT INTO public.healthcare_professionals (
id, names, degrees, specialties, spoken_languages, accepted_insurance, additional_info_for_patients
) VALUES (
'40ce380b-2b45-4f0f-a90b-8faefd66123e', 
'[{"firstName":"大翔","lastName":"吉田","locale":"ja_JP"}]', 
'["DSW","DPM"]', 
'["SURGERY","PEDIATRICS"]', 
'["ne_NP"]', 
'["INTERNATIONAL_HEALTH_INSURANCE"]', 
''
);
INSERT INTO public.healthcare_professionals (
id, names, degrees, specialties, spoken_languages, accepted_insurance, additional_info_for_patients
) VALUES (
'1b9f0b95-1af4-47cb-b5aa-7f74f216e0e6', 
'[{"firstName":"智也","lastName":"高橋","locale":"ja_JP"}]', 
'["DPM","DPT"]', 
'["ENT_SPECIALIST","PSYCHIATRY"]', 
'["vi_VN","ko_KR"]', 
'["TRAVEL_INSURANCE"]', 
''
);
INSERT INTO public.healthcare_professionals (
id, names, degrees, specialties, spoken_languages, accepted_insurance, additional_info_for_patients
) VALUES (
'1e591a39-e60e-4201-b0db-fadcca2b720e', 
'[{"firstName":"学","lastName":"佐々木","locale":"ja_JP"}]', 
'["DMD","EdD"]', 
'["ORTHOPEDIC_SURGERY","EMERGENCY_MEDICINE"]', 
'["sr_Cyrl"]', 
'["UNINSURED"]', 
''
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'2795fb8b-976a-41d5-85ac-f9873210f59a', 
'b147f044-037f-4b86-ba3d-059f84d53455'
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'2795fb8b-976a-41d5-85ac-f9873210f59a', 
'1ee12e1e-ab2f-4b0f-a66c-b59de44f58c5'
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'7404a889-891c-4d75-94b7-af5bcf24fd0a', 
'b147f044-037f-4b86-ba3d-059f84d53455'
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'40ce380b-2b45-4f0f-a90b-8faefd66123e', 
'b147f044-037f-4b86-ba3d-059f84d53455'
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'1b9f0b95-1af4-47cb-b5aa-7f74f216e0e6', 
'b147f044-037f-4b86-ba3d-059f84d53455'
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'1b9f0b95-1af4-47cb-b5aa-7f74f216e0e6', 
'2014363e-f71d-4a64-891f-2ca259943533'
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'1e591a39-e60e-4201-b0db-fadcca2b720e', 
'1ee12e1e-ab2f-4b0f-a66c-b59de44f58c5'
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'1e591a39-e60e-4201-b0db-fadcca2b720e', 
'4d79853d-65ed-4ab1-9f5e-5997bd115b00'
);
INSERT INTO public.hps_facilities (hp_id, facility_id) VALUES (
'1e591a39-e60e-4201-b0db-fadcca2b720e', 
'f9676348-f989-4046-8762-36db0c2657a9'
);
INSERT INTO public.submissions (
id, google_maps_url, healthcare_professional_name, spoken_languages, 
facility_data, healthcare_professionals_data, is_approved, is_rejected, is_under_review
) VALUES (
'fe773fdb-8e93-4eee-8652-4c084d47c5ef', 
'https://beloved-pulse.info', 
'Jeff Kemmer', 
'["zh_CN","und"]', 
'{"nameEn":"Olson Inc","nameJa":"吉田農林合名会社","mapLatitude":43.046,"mapLongitude":141.3592,"contact":{"googleMapsUrl":"https://warped-spectacles.biz/","email":"OlsonInc.McClure@gmail.com","phone":"(692) 4245234 x46800","website":"https://teeming-tunnel.biz/","address":{"addressLine1En":"745 Johns Wall","addressLine2En":"Suite 121","addressLine1Ja":"361 啓子Circle","addressLine2Ja":"Suite 516","cityEn":"Sapporo","cityJa":"札幌","postalCode":"021-1718","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
'[{"names":[{"firstName":"恵美子","lastName":"佐々木","locale":"ja_JP"}],"degrees":["OD","PharmD"],"specialties":["GENERAL_MEDICINE","PATHOLOGY"],"spokenLanguages":["fi_FI"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"麻美","lastName":"松本","locale":"ja_JP"}],"degrees":["DMD","DDS"],"specialties":["PREVENTIVE_MEDICINE","TRAUMATOLOGY"],"spokenLanguages":["mn_MN","lg_UG"],"acceptedInsurance":["JAPANESE_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
TRUE, 
FALSE, 
FALSE
);
INSERT INTO public.submissions (
id, google_maps_url, healthcare_professional_name, spoken_languages, 
facility_data, healthcare_professionals_data, is_approved, is_rejected, is_under_review
) VALUES (
'ec7d1fda-a6cb-4c1a-86d2-f4d735cf486c', 
'https://ill-racer.org/', 
'Michelle Schowalter', 
'["hr_HR","hu_HU"]', 
'{"nameEn":"Lang - Herman","nameJa":"田中通信合同会社","mapLatitude":43.0002,"mapLongitude":141.3036,"contact":{"googleMapsUrl":"https://wary-performance.info/","email":"Lang-Herman.Daniel16@hotmail.com","phone":"744.808.1696 x4018","website":"https://high-involvement.net","address":{"addressLine1En":"65577 4th Street","addressLine2En":"Suite 246","addressLine1Ja":"19336 未来Orchard","addressLine2Ja":"Apt. 305","cityEn":"Sapporo","cityJa":"札幌","postalCode":"033-1854","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
'[{"names":[{"firstName":"心優","lastName":"小林","locale":"ja_JP"}],"degrees":["DC","DPT"],"specialties":["OPTOMETRY","PEDIATRICS"],"spokenLanguages":["und","en_US"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"正夫","lastName":"松本","locale":"ja_JP"}],"degrees":["DPT","DO"],"specialties":["PEDIATRICS","CARDIOLOGY"],"spokenLanguages":["kn_IN","sq_AL"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
FALSE, 
FALSE, 
TRUE
);
INSERT INTO public.submissions (
id, google_maps_url, healthcare_professional_name, spoken_languages, 
facility_data, healthcare_professionals_data, is_approved, is_rejected, is_under_review
) VALUES (
'7841c6f8-a8b7-4f4f-95c0-4327262d9e5e', 
'https://careless-ruckus.com/', 
'Claude McClure', 
'["zh_HK","th_TH"]', 
'{"nameEn":"Quitzon Group","nameJa":"株式会社渡辺情報","mapLatitude":43.0686,"mapLongitude":141.3491,"contact":{"googleMapsUrl":"https://medium-builder.net","email":"QuitzonGroup_Moen@gmail.com","phone":"688.508.7805 x316","website":"https://deep-commandment.info","address":{"addressLine1En":"209 Asia Vista","addressLine2En":"Suite 481","addressLine1Ja":"10290 結月Turnpike","addressLine2Ja":"Apt. 725","cityEn":"Sapporo","cityJa":"札幌","postalCode":"017-6195","prefectureEn":"Hokkaido","prefectureJa":"北海道"}}}', 
'[{"names":[{"firstName":"陽葵","lastName":"高橋","locale":"ja_JP"}],"degrees":["DVM","OD"],"specialties":["SPORTS_MEDICINE","INTERNAL_MEDICINE"],"spokenLanguages":["sw_KE"],"acceptedInsurance":["UNINSURED"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Sammy","middleName":"Bowie","lastName":"Barton","locale":"en_US"}],"degrees":["DPM","DPM"],"specialties":["DENTISTRY","PHARMACY"],"spokenLanguages":["si_LK","pl_PL"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
FALSE, 
TRUE, 
FALSE
);
INSERT INTO public.submissions (
id, google_maps_url, healthcare_professional_name, spoken_languages, 
facility_data, healthcare_professionals_data, is_approved, is_rejected, is_under_review
) VALUES (
'f8616b2c-eba7-4f67-bf1f-d14aa9359901', 
'https://likely-stitcher.biz/', 
'Travis Hettinger', 
'["si_LK","kab_DZ"]', 
'{"nameEn":"Hagenes, Rowe and Kunde","nameJa":"有限会社高橋建設","mapLatitude":35.0626,"mapLongitude":135.7721,"contact":{"googleMapsUrl":"https://used-grit.name","email":"HagenesRoweandKunde_Nienow74@gmail.com","phone":"427.838.4658 x37175","website":"https://obvious-mukluk.name","address":{"addressLine1En":"4606 Bechtelar Oval","addressLine2En":"Suite 137","addressLine1Ja":"951 斎藤Pass","addressLine2Ja":"Suite 507","cityEn":"Kyoto","cityJa":"京都","postalCode":"620-6643","prefectureEn":"Kyoto","prefectureJa":"京都府"}}}', 
'[{"names":[{"firstName":"Zack","middleName":"Dakota","lastName":"Konopelski","locale":"en_US"}],"degrees":["PhD","PA"],"specialties":["RADIATION_ONCOLOGY","ENT_SPECIALIST"],"spokenLanguages":["und","kn_IN"],"acceptedInsurance":["TRAVEL_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"功","lastName":"林","locale":"ja_JP"}],"degrees":["MPH","MPH"],"specialties":["DENTISTRY","PSYCHIATRY"],"spokenLanguages":["ee_GH","km_KH"],"acceptedInsurance":["INSURANCE_NOT_ACCEPTED"],"additionalInfoForPatients":"","facilityIds":[]}]', 
TRUE, 
FALSE, 
FALSE
);
INSERT INTO public.submissions (
id, google_maps_url, healthcare_professional_name, spoken_languages, 
facility_data, healthcare_professionals_data, is_approved, is_rejected, is_under_review
) VALUES (
'5f1001ef-712b-459e-8999-97a0e88a3507', 
'https://far-off-amount.info/', 
'Arthur Grady', 
'["guz_KE","ja_JP"]', 
'{"nameEn":"Block, Wuckert and Ebert","nameJa":"合同会社井上情報","mapLatitude":35.093,"mapLongitude":135.7442,"contact":{"googleMapsUrl":"https://unwritten-talent.info","email":"BlockWuckertandEbert.Bahringer@gmail.com","phone":"(200) 2024878 x044","website":"https://knowledgeable-half-brother.info/","address":{"addressLine1En":"956 New Lane","addressLine2En":"Suite 879","addressLine1Ja":"38121 林Branch","addressLine2Ja":"Apt. 125","cityEn":"Kyoto","cityJa":"京都","postalCode":"667-2664","prefectureEn":"Kyoto","prefectureJa":"京都府"}}}', 
'[{"names":[{"firstName":"秀樹","lastName":"中村","locale":"ja_JP"}],"degrees":["MD","DC"],"specialties":["UROLOGY","INFECTIOUS_DISEASES"],"spokenLanguages":["ar_AE"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]},{"names":[{"firstName":"Reilly","middleName":"Jules","lastName":"Hand","locale":"en_US"}],"degrees":["DDS","MD"],"specialties":["OPTOMETRY","NUCLEAR_MEDICINE"],"spokenLanguages":["lg_UG"],"acceptedInsurance":["INTERNATIONAL_HEALTH_INSURANCE"],"additionalInfoForPatients":"","facilityIds":[]}]', 
FALSE, 
FALSE, 
TRUE
);
