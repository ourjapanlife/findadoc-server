# Agent notes

## City vocabulary

`docs/city-rules.md` is the frozen search-city decision. Follow it. Do not invent a second naming scheme in code, migrations, or issues.

- Tokyo: the search city is one of the 23 special wards. `Minato City` is Minato. Japanese keeps 区.
- Everywhere else: the search city is the municipality. A ward of a designated city rolls up to that city. Fukuoka's East Ward and Higashi Ward are both Fukuoka.
- A city is unique per prefecture. Tokyo Chuo (中央区), Osaka's Chuo ward, and Yamanashi's Chuo city (中央市) are different places.
- Prefecture keys come from `utils/japanesePrefectures.ts`.
- A district (郡), a street, or an English/Japanese pair that names two different places stays unresolved. Do not guess. Osaka and Sakai both have Kita and Nishi, so a bare North Ward is not Osaka.

Alias lookup lives in `src/vocabulary/`. It is not imported by resolvers or services, so stored `cityEn` and `cityJa` stay as they are until #1011. The city table is #1009. Backfill: #1011.

## Places

`docs/places-storage.md` is the storage rule. Follow it. Do not open a Places write path that contradicts it.

- Store `place_id`. Refresh it if it is older than 12 months.
- Places latitude and longitude last at most 30 days, then delete or refresh.
- Do not store a Places display name, formatted address, phone, website, hours, photos, or reviews as directory data.
- The Maps URL enrichment path is gone (#1008). Do not copy a Places payload into a submission. The picker is #1012. The facility resolver is #1013.
