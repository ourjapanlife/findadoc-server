SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."action_type_enum" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE'
);


ALTER TYPE "public"."action_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."object_type_enum" AS ENUM (
    'Facility',
    'HealthcareProfessional',
    'Submission'
);


ALTER TYPE "public"."object_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."schema_version_enum" AS ENUM (
    'V1'
);


ALTER TYPE "public"."schema_version_enum" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Reservation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."action_type_enum",
    "meeting_link" "text",
    "slot_id" "uuid"
);


ALTER TABLE "public"."Reservation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ReservationSlot" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "is_booked" boolean,
    "hp_id" "uuid",
    "facility_id" "uuid"
);


ALTER TABLE "public"."ReservationSlot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_type" "public"."action_type_enum" NOT NULL,
    "object_type" "public"."object_type_enum" NOT NULL,
    "schema_version" "public"."schema_version_enum" NOT NULL,
    "new_value" "jsonb",
    "old_value" "jsonb",
    "updated_by" "text" NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying,
    "nameEn" character varying,
    "contact" "jsonb" NOT NULL,
    "mapLatitude" double precision NOT NULL,
    "mapLongitude" double precision NOT NULL,
    "createdDate" timestamp with time zone,
    "updatedDate" timestamp with time zone,
    "firestore_id" character varying,
    "nameJa" character varying
);


ALTER TABLE "public"."facilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "names" "jsonb" NOT NULL,
    "additionalInfoForPatients" character varying,
    "degrees" "jsonb" NOT NULL,
    "specialties" "jsonb" NOT NULL,
    "spokenLanguages" "jsonb" NOT NULL,
    "acceptedInsurance" "jsonb" NOT NULL,
    "email" character varying,
    "createdDate" timestamp with time zone,
    "updatedDate" timestamp with time zone,
    "firestore_id" character varying
);


ALTER TABLE "public"."hps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hps_facilities" (
    "hps_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "facilities_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."hps_facilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" character varying NOT NULL,
    "createdDate" timestamp with time zone,
    "updatedDate" timestamp with time zone,
    "hps_id" "uuid" NOT NULL,
    "facilities_id" "uuid" NOT NULL,
    "googleMapsUrl" "text",
    "healthcareProfessionalName" "text",
    "spokenLanguages" "jsonb",
    "notes" "text",
    "autofillPlaceFromSubmissionUrl" boolean DEFAULT false NOT NULL,
    "firestore_id" "text"
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone,
    "display_name" "text",
    "profile_pic_url" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."user" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ReservationSlot"
    ADD CONSTRAINT "ReservationSlot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Reservation"
    ADD CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_firestore_id_key" UNIQUE ("firestore_id");



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hps_facilities"
    ADD CONSTRAINT "hps_facilities_pkey" PRIMARY KEY ("hps_id", "facilities_id");



ALTER TABLE ONLY "public"."hps"
    ADD CONSTRAINT "hps_firestore_id_key" UNIQUE ("firestore_id");



ALTER TABLE ONLY "public"."hps"
    ADD CONSTRAINT "hps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_firestore_id_key" UNIQUE ("firestore_id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ReservationSlot"
    ADD CONSTRAINT "ReservationSlot_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id");



ALTER TABLE ONLY "public"."ReservationSlot"
    ADD CONSTRAINT "ReservationSlot_hp_id_fkey" FOREIGN KEY ("hp_id") REFERENCES "public"."hps"("id");



ALTER TABLE ONLY "public"."Reservation"
    ADD CONSTRAINT "Reservation_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."ReservationSlot"("id");



ALTER TABLE ONLY "public"."Reservation"
    ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id");



ALTER TABLE ONLY "public"."hps_facilities"
    ADD CONSTRAINT "hps_facilities_facilities_id_fkey" FOREIGN KEY ("facilities_id") REFERENCES "public"."facilities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hps_facilities"
    ADD CONSTRAINT "hps_facilities_hps_id_fkey" FOREIGN KEY ("hps_id") REFERENCES "public"."hps"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_facilities_id_fkey" FOREIGN KEY ("facilities_id") REFERENCES "public"."facilities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_hps_id_fkey" FOREIGN KEY ("hps_id") REFERENCES "public"."hps"("id") ON UPDATE CASCADE ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."Reservation" TO "anon";
GRANT ALL ON TABLE "public"."Reservation" TO "authenticated";
GRANT ALL ON TABLE "public"."Reservation" TO "service_role";



GRANT ALL ON TABLE "public"."ReservationSlot" TO "anon";
GRANT ALL ON TABLE "public"."ReservationSlot" TO "authenticated";
GRANT ALL ON TABLE "public"."ReservationSlot" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."facilities" TO "anon";
GRANT ALL ON TABLE "public"."facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."facilities" TO "service_role";



GRANT ALL ON TABLE "public"."hps" TO "anon";
GRANT ALL ON TABLE "public"."hps" TO "authenticated";
GRANT ALL ON TABLE "public"."hps" TO "service_role";



GRANT ALL ON TABLE "public"."hps_facilities" TO "anon";
GRANT ALL ON TABLE "public"."hps_facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."hps_facilities" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

