# Agent notes

## City vocabulary

`docs/city-rules.md` is the frozen search-city decision. Follow it. Do not invent a second naming scheme in code, migrations, or issues.

- Tokyo: the search city is one of the 23 special wards. `Minato City` is Minato. Japanese keeps 区.
- Everywhere else: the search city is the municipality. A ward of a designated city rolls up to that city. Fukuoka's East Ward and Higashi Ward are both Fukuoka.
- A city is unique per prefecture. Tokyo Chuo (中央区), Osaka's Chuo ward, and Yamanashi's Chuo city (中央市) are different places.
- Prefecture keys come from `utils/japanesePrefectures.ts`.
- A district (郡), a street, or an English/Japanese pair that names two different places stays unresolved. Do not guess. Osaka and Sakai both have Kita and Nishi, so a bare North Ward is not Osaka.

Alias lookup lives in `src/vocabulary/`. Resolvers and services do not import it. `utils/backfillFacilityCities.ts` is the #1011 run: it writes `city_id` only when the facility maps to one official municipality, leaves anything else as `UNVERIFIED_LOCATION`, and does not change a confirmed facility's stored name or address. A district row uses the town named in the address line. Dry-run is the default. It does not call Places. It writes nothing unless every facility maps and no published row is still a generic East, West, North, South, or Chuo Ward. The city table is #1009: every current municipality from the Address Base Registry, shaped by the rules above. Designated-city wards are not rows. Tokyo's 23 wards are. Refresh with `utils/buildMunicipalityVocabulary.py` and match on `lg_code`. The alias map only returns a row that already exists.

## Affiliations

A society or collaboration is a row in `affiliations`, not a Postgres enum (#1029). The first row is the Intercultural Psychiatric Society of Japan. Japanese name, website, and logo stay empty until that society sends them.

`affiliation_memberships` attaches that row to one facility or one healthcare professional. Do not attach the existing directory in this change. Bulk CSV import and the profile-card mark are later tickets.

## Equality

Compare values with `===` and `!==`. Do not use `==` or `!=`. That includes `== null` and `!= null`. A missing value is `=== null` or `=== undefined`.

## Languages

`src/languages/publishedLocales.ts` is the search-facet allowlist (#1015). Spreadsheet codes map through `src/vocabulary/languageMap.ts`. Services do not import that map.

`facilities.supported_languages` is language support with no named professional. Do not create a healthcare professional to hold a hospital-level language. A language-only search matches that list or one professional who speaks every requested language. A specialty filter still requires the same professional to match both. Existing `spoken_languages` stay on the professional, including `en_US` and `ja_JP`. A Locale that is not on the allowlist is not a facet.

## Licenses

A professional has one primary clinical license. PhD, MPH, and DSc are additional credentials. DVM, EdD, and DSW stay in the enum and stay hidden from the moderation picker.

`utils/backfillProfessionalLicenses.ts` is the #1014 run. Dry-run is the default. It does not rewrite `degrees`. MD+DO is queued as `NEEDS_REVIEW` with recommendation `MD`. DDS+DMD is queued with recommendation `one_dental_license`. The 18 Sep notes disagree about that dental count, so the run counts the rows it reads and does not collapse them. A row with `license_review = CONFIRMED`, or a row that already has `primary_license`, is left alone. A new professional is not given a license. The moderator chooses one.

## Places

`docs/places-storage.md` is the storage rule. Follow it. Do not open a Places write path that contradicts it.

- Store `place_id`. Refresh it if it is older than 12 months.
- Places latitude and longitude last at most 30 days, then delete or refresh.
- Do not store a Places display name, formatted address, phone, website, hours, photos, or reviews as directory data.
- The Maps URL enrichment path is gone (#1008). Do not copy a Places payload into a submission. The picker is #1012. The facility resolver is #1013.
