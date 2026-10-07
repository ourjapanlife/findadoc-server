# Agent notes

## City vocabulary

`docs/city-rules.md` is the frozen search-city decision. Follow it. Do not invent a second naming scheme in code, migrations, or issues.

- Tokyo: the search city is one of the 23 special wards. `Minato City` is Minato. Japanese keeps 区.
- Everywhere else: the search city is the municipality. A ward of a designated city rolls up to that city. Fukuoka's East Ward and Higashi Ward are both Fukuoka.
- A city is unique per prefecture. Tokyo Chuo (中央区), Osaka's Chuo ward, and Yamanashi's Chuo city (中央市) are different places.
- Prefecture keys come from `utils/japanesePrefectures.ts`.
- A district (郡), a street, or an English/Japanese pair that names two different places stays unresolved. Do not guess. Osaka and Sakai both have Kita and Nishi, so a bare North Ward is not Osaka.

Alias lookup lives in `src/vocabulary/`. Resolvers and services do not import it. `utils/backfillFacilityCities.ts` is the #1011 run: it writes `city_id` only when `resolveSearchCity` maps the row, leaves unmatched facilities as `UNVERIFIED_LOCATION`, and does not change a confirmed facility's stored name or address. Dry-run is the default. It does not call Places. It writes nothing unless mapped facilities are above 95 percent and no published row is still a generic East, West, North, South, or Chuo Ward. The 18 Sep 2026 snapshot is under that bar, so the run reports the misses and stops. Do not add an alias to clear the bar. The city table is #1009: every current municipality from the Address Base Registry, shaped by the rules above. Designated-city wards are not rows. Tokyo's 23 wards are. Refresh with `utils/buildMunicipalityVocabulary.py` and match on `lg_code`. The alias map only returns a row that already exists.

## Affiliations

A society or collaboration is a row in `affiliations`, not a Postgres enum (#1029). The first row is the Intercultural Psychiatric Society of Japan. Japanese name, website, and logo stay empty until that society sends them.

`affiliation_memberships` attaches that row to one facility or one healthcare professional. Do not attach the existing directory in this change. Bulk CSV import and the profile-card mark are later tickets.

## Places

`docs/places-storage.md` is the storage rule. Follow it. Do not open a Places write path that contradicts it.

- Store `place_id`. Refresh it if it is older than 12 months.
- Places latitude and longitude last at most 30 days, then delete or refresh.
- Do not store a Places display name, formatted address, phone, website, hours, photos, or reviews as directory data.
- The Maps URL enrichment path is gone (#1008). Do not copy a Places payload into a submission. The picker is #1012. The facility resolver is #1013.
