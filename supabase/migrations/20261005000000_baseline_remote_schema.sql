-- Snapshot of the hosted public schema on 2026-10-06.
-- The hosted database already matches this file. Mark this version applied there
-- before pushing. The later migration files are the changes that were not on the host yet.

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."action_type_enum" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE'
);

CREATE TYPE "public"."object_type_enum" AS ENUM (
    'Facility',
    'HealthcareProfessional',
    'Submission'
);

CREATE TYPE "public"."schema_version_enum" AS ENUM (
    'V1'
);

CREATE TYPE "public"."submission_status_enum" AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected'
);

CREATE TABLE "public"."user" (
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone,
    "display_name" "text",
    "profile_pic_url" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

CREATE TABLE "public"."facilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying,
    "name_en" character varying NOT NULL,
    "contact" "jsonb" NOT NULL,
    "map_latitude" double precision NOT NULL,
    "map_longitude" double precision NOT NULL,
    "created_date" timestamp with time zone NOT NULL,
    "updated_date" timestamp with time zone NOT NULL,
    "firestore_id" character varying,
    "name_ja" character varying NOT NULL,
    "payment_options" "jsonb" DEFAULT '[]'::"jsonb"
);

CREATE TABLE "public"."hps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "names" "jsonb" NOT NULL,
    "additional_info_for_patients" character varying,
    "degrees" "jsonb" NOT NULL,
    "specialties" "jsonb" NOT NULL,
    "spoken_languages" "jsonb" NOT NULL,
    "accepted_insurance" "jsonb" NOT NULL,
    "email" character varying,
    "created_date" timestamp with time zone NOT NULL,
    "updated_date" timestamp with time zone NOT NULL,
    "firestore_id" character varying
);

CREATE TABLE "public"."ReservationSlot" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "is_booked" boolean,
    "hp_id" "uuid",
    "facility_id" "uuid"
);

CREATE TABLE "public"."Reservation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."action_type_enum",
    "meeting_link" "text",
    "slot_id" "uuid"
);

CREATE TABLE "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_type" "public"."action_type_enum" NOT NULL,
    "object_type" "public"."object_type_enum" NOT NULL,
    "schema_version" "public"."schema_version_enum" NOT NULL,
    "new_value" "jsonb",
    "old_value" "jsonb",
    "updated_by" "text" NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE "public"."hps_facilities" (
    "hps_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "facilities_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);

CREATE TABLE "public"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "public"."submission_status_enum" DEFAULT 'pending'::"public"."submission_status_enum" NOT NULL,
    "created_date" timestamp with time zone NOT NULL,
    "updated_date" timestamp with time zone NOT NULL,
    "hps_id" "uuid",
    "facilities_id" "uuid",
    "google_maps_url" "text",
    "healthcare_professional_name" "text",
    "spoken_languages" "jsonb",
    "notes" "text",
    "autofill_place_from_submission_url" boolean DEFAULT false NOT NULL,
    "facility_partial" "jsonb",
    "healthcare_professionals_partial" "jsonb",
    "firestore_id" "text"
);

ALTER TABLE "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."facilities"
    ADD CONSTRAINT "facilities_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."facilities"
    ADD CONSTRAINT "facilities_firestore_id_key" UNIQUE ("firestore_id");

ALTER TABLE "public"."hps"
    ADD CONSTRAINT "hps_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."hps"
    ADD CONSTRAINT "hps_firestore_id_key" UNIQUE ("firestore_id");

ALTER TABLE "public"."ReservationSlot"
    ADD CONSTRAINT "ReservationSlot_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."Reservation"
    ADD CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."hps_facilities"
    ADD CONSTRAINT "hps_facilities_pkey" PRIMARY KEY ("hps_id", "facilities_id");

ALTER TABLE "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."submissions"
    ADD CONSTRAINT "submissions_firestore_id_key" UNIQUE ("firestore_id");

ALTER TABLE "public"."ReservationSlot"
    ADD CONSTRAINT "ReservationSlot_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id");

ALTER TABLE "public"."ReservationSlot"
    ADD CONSTRAINT "ReservationSlot_hp_id_fkey" FOREIGN KEY ("hp_id") REFERENCES "public"."hps"("id");

ALTER TABLE "public"."Reservation"
    ADD CONSTRAINT "Reservation_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."ReservationSlot"("id");

ALTER TABLE "public"."Reservation"
    ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id");

ALTER TABLE "public"."hps_facilities"
    ADD CONSTRAINT "hps_facilities_facilities_id_fkey" FOREIGN KEY ("facilities_id") REFERENCES "public"."facilities"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."hps_facilities"
    ADD CONSTRAINT "hps_facilities_hps_id_fkey" FOREIGN KEY ("hps_id") REFERENCES "public"."hps"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."submissions"
    ADD CONSTRAINT "submissions_facilities_id_fkey" FOREIGN KEY ("facilities_id") REFERENCES "public"."facilities"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."submissions"
    ADD CONSTRAINT "submissions_hps_id_fkey" FOREIGN KEY ("hps_id") REFERENCES "public"."hps"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."facilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ReservationSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Reservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hps_facilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";

GRANT ALL ON TABLE "public"."facilities" TO "anon";
GRANT ALL ON TABLE "public"."facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."facilities" TO "service_role";

GRANT ALL ON TABLE "public"."hps" TO "anon";
GRANT ALL ON TABLE "public"."hps" TO "authenticated";
GRANT ALL ON TABLE "public"."hps" TO "service_role";

GRANT ALL ON TABLE "public"."ReservationSlot" TO "anon";
GRANT ALL ON TABLE "public"."ReservationSlot" TO "authenticated";
GRANT ALL ON TABLE "public"."ReservationSlot" TO "service_role";

GRANT ALL ON TABLE "public"."Reservation" TO "anon";
GRANT ALL ON TABLE "public"."Reservation" TO "authenticated";
GRANT ALL ON TABLE "public"."Reservation" TO "service_role";

GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";

GRANT ALL ON TABLE "public"."hps_facilities" TO "anon";
GRANT ALL ON TABLE "public"."hps_facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."hps_facilities" TO "service_role";

GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";

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
