# Places storage

Accepted for [#1007](https://github.com/ourjapanlife/findadoc-server/issues/1007) on 1 Oct 2026. This is the project's reading of Google's published Maps Platform terms, so later Places tickets can cite one rule. It is not a lawyer's sign-off. If the Maps billing account is in the European Economic Area, re-read the [EEA service terms](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms) before a Places write path merges. The citations below are the [non-EEA service terms](https://cloud.google.com/maps-platform/terms/maps-service-terms).

This gates the Places picker ([#1012](https://github.com/ourjapanlife/findadoc-server/issues/1012)) and the facility `place_id` resolver ([#1013](https://github.com/ourjapanlife/findadoc-server/issues/1013)). It does not gate the city table ([#1009](https://github.com/ourjapanlife/findadoc-server/issues/1009)).

## What we store

| Field | Rule |
| --- | --- |
| `place_id` | Store it. Place IDs are exempt from the general caching restriction. Refresh an id older than 12 months with a Place Details request that asks only for the place id field. That refresh is unbilled. A `NOT_FOUND` means the id is obsolete. Re-run the original lookup. Do not invent a replacement id. |
| Places latitude and longitude | Cache for at most 30 consecutive calendar days, then delete or refresh. Keep the fetch time on the cache row. |
| Display name, formatted address, phone, website, hours, photos, reviews, and any other Places content | Do not store as a shared directory cache. |

Sources: [Place IDs](https://developers.google.com/maps/documentation/places/web-service/place-id), service terms [section A.3](https://cloud.google.com/maps-platform/terms/maps-service-terms) (Google ID caching) and [section 14.3](https://cloud.google.com/maps-platform/terms/maps-service-terms) (Places lat/lng, 30 consecutive calendar days).

Our own listing fields are not Places content. Persist `cityId`, `prefectureId`, a confirmed name, address, phone, and website, `googlePlaceId`, and the submitted Maps URL. Coordinates already on a facility stay. The 30-day limit applies to a latitude and longitude taken from a Places response, not to those existing facility coordinates.

A moderator may look at a live suggestion and then save a name, address, phone, or website on the facility. That saved value is our column. Do not also keep the Places payload, the field-mask response, or a second copy marked as coming from Google. Do not refresh those facility columns from Places on a schedule.

## Live Google content

When a screen shows live Places content, attribute it the way the [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies) require. Our confirmed fields do not get Google attribution.

Places API (New) calls send a [field mask](https://developers.google.com/maps/documentation/places/web-service/choose-fields) for the fields that screen needs. Do not send a wildcard. The API key stays on the server.

## Do not extend the current enrichment path

`utils/submissionDataFromGoogleMaps.ts` copies a Places name, phone, website, and address into submission JSON. Do not add callers. Removing that path is [#1008](https://github.com/ourjapanlife/findadoc-server/issues/1008).
