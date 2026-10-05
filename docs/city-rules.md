# City rules

Frozen for [#1005](https://github.com/ourjapanlife/findadoc-server/issues/1005). The alias lookup is [#1006](https://github.com/ourjapanlife/findadoc-server/issues/1006) (`src/vocabulary/cityMap.ts`). Stored `cityEn` and `cityJa` stay as they are until the backfill in [#1011](https://github.com/ourjapanlife/findadoc-server/issues/1011). The city table in [#1009](https://github.com/ourjapanlife/findadoc-server/issues/1009) is every current municipality from the Digital Agency Address Base Registry (`mt_city_all.csv`, file dated 2024-03-12), shaped by the rules below. Regenerate it with `utils/buildMunicipalityVocabulary.py`. Match a later file by `lg_code`, the 全国地方公共団体コード. The alias map does not insert cities. Google does not either.

Checked against the live facilities API on 1 Oct 2026: 465 facilities, 214 `cityEn` values, 34 `prefectureEn` values. Same counts as the 18 Sep 2026 snapshot in the approved data-cleaning plan.

A search city is the place a person filters by. It is always paired with a prefecture from `utils/japanesePrefectures.ts`. The English string alone is not an identity.

## Search city

1. **Tokyo.** Each of the 23 special wards is a search city. The prefecture hub means anywhere in Tokyo. A facility in Shibuya is Shibuya, never Tokyo.
2. **Every other prefecture.** The search city is the municipality: a city (市), town (町), or village (村). Sapporo, Yokohama, Osaka, Fukuoka, Hakodate, and a named cho or mura are search cities.
3. **Wards of a designated city are not search cities.** Higashi-ku in Fukuoka, Chuo-ku in Osaka, and Kita-ku in Sapporo roll up to Fukuoka, Osaka, and Sapporo. The ward can stay in the address. It does not get its own hub.
4. **A district (郡) is not a search city.** Use the town or village named alongside it. `Kutchan, Abuta District` is Kutchan. A bare district, with no town or village, stays unresolved for a person.
5. **A street is not a search city.** A number, `dori`, or chome in `cityEn` (for example `Watanabedori 2-4-28`) stays in the address. Resolve the city from the Japanese side.

## Names

English `nameEn` has no `City`, `Ward`, `District`, or `ku` suffix, no fullwidth space, and no macron. That matches the prefecture keys in `utils/japanesePrefectures.ts` (`Hyogo`, `Kochi`, `Tokyo`).

Japanese `nameJa` keeps 区, 市, 町, or 村. Trim a stray leading 府 or 県 (`府箕面市` is 箕面市, `県富谷市` is 富谷市). Fold compatibility characters (`⾦沢市` is 金沢市).

Compass words are banned as published labels. Use the Japanese reading when a ward has to be matched:

| Banned | Reading | Japanese |
| --- | --- | --- |
| East | Higashi | 東 |
| West | Nishi | 西 |
| North | Kita | 北 |
| South | Minami | 南 |

Outside Tokyo that reading finds the parent municipality. It is not the published city name. `East Ward` and `Higashi Ward` in Fukuoka are both Fukuoka.

The slug is `nameEn`, lowercased and hyphenated. Suffixes are already gone, so they do not reappear in the slug. `/tokyo/chuo-ward` becomes `/tokyo/chuo`.

## Identity

A city is unique per prefecture. The same English name in two prefectures is two cities.

- Tokyo Chuo (中央区) is a search city.
- Osaka Chuo-ku, Fukuoka Chuo-ku, Kumamoto Chuo-ku, Niigata Chuo-ku, and Sapporo Chuo-ku are wards. They roll up to Osaka, Fukuoka, Kumamoto, Niigata, and Sapporo.
- Yamanashi Chuo (中央市) is its own municipality and its own search city.

When the Japanese value names the parent city (`堺市北区`, `札幌市東区`, `北九州市小倉北区`), that parent is the search city.

When the value is only a ward (`中央区`, `East Ward`) and exactly one municipality in that prefecture contains it, use that municipality. When two do, leave the row unresolved. Osaka city and Sakai both have Kita-ku and Nishi-ku, so a bare `North Ward` / 北区 or `West Ward` / 西区 in Osaka prefecture waits for a person. Do not guess Osaka.

When English and Japanese name different places, leave the row unresolved. Do not pick a winner. Live cases: Daisen and Niida stored with 秋田市, Ashiya stored with 兵庫県, Niigata `Konan Ward` stored with 港南区 (Yokohama's Konan-ku, not Niigata's 江南区).

## Same reading inside one prefecture

Two municipalities in one prefecture can share a reading, such as 釧路市 and 釧路町. The slug stays unique. The plain English name goes to the 市, otherwise the Tokyo 区, otherwise a name already published in this document, otherwise the 町, otherwise the smallest national code. The other row keeps that reading and adds the district when the district is a different word, so 府中町 is Fuchu Aki. When the district is the same word, or there is no district, the national code is appended, so 釧路町 is Kushiro 016616 and 枝幸町 is Esashi 015148. 江差町 stays Esashi. Japanese `nameJa` stays the official name. Do not invent a second spelling by hand. The generator applies this on the next register file.

## Tokyo wards

Publish these English names. Current production spellings fold into them. Wards with no row yet are still part of the vocabulary.

| nameEn | nameJa | Folds in |
| --- | --- | --- |
| Chiyoda | 千代田区 | Chiyoda City |
| Chuo | 中央区 | Chuo City, Chuo City with a fullwidth space |
| Minato | 港区 | Minato City |
| Shinjuku | 新宿区 | Shinjuku; 新宿 gains 区 |
| Bunkyo | 文京区 | Bunkyo City |
| Taito | 台東区 | Taito City |
| Sumida | 墨田区 | |
| Koto | 江東区 | |
| Shinagawa | 品川区 | Shinagawa |
| Meguro | 目黒区 | Meguro |
| Ota | 大田区 | |
| Setagaya | 世田谷区 | Setagaya; 世田谷 gains 区 |
| Shibuya | 渋谷区 | Shibuya |
| Nakano | 中野区 | Nakano |
| Suginami | 杉並区 | Suginami |
| Toshima | 豊島区 | |
| Kita | 北区 | Tokyo's Kita only. Kumamoto's Kita-ku rolls up to Kumamoto |
| Arakawa | 荒川区 | |
| Itabashi | 板橋区 | |
| Nerima | 練馬区 | Nerima |
| Adachi | 足立区 | |
| Katsushika | 葛飾区 | |
| Edogawa | 江戸川区 | |

## Same name as the prefecture

A city may share the prefecture's English name. These production rows are the municipality, and they stay:

| Prefecture | City | Japanese | Facilities |
| --- | --- | --- | --- |
| Tokushima | Tokushima | 徳島市 | 8 |
| Kagoshima | Kagoshima | 鹿児島市 | 8 |
| Akita | Akita | 秋田市 | 6 |
| Yamagata | Yamagata | 山形市 | 4 |
| Fukui | Fukui | 福井市 | 4 |
| Toyama | Toyama | 富山市 | 4 |
| Yamaguchi | Yamaguchi | 山口市 | 2 |
| Kochi | Kochi | 高知市 | 2 |
| Okinawa | Okinawa | 沖縄市 | 2 |
| Oita | Oita | 大分市 | 1 |
| Nagasaki | Nagasaki | 長崎市 | 1 |

Okinawa city is 沖縄市, a city inside the prefecture. The one row that does not survive this rule is Mie / 三重郡: that is a district, and it stays unresolved until the town or village is known.

## Production rows that illustrate the rollup

| Stored as | Search city |
| --- | --- |
| Fukuoka: Chuo, Higashi, East, Hakata, Sawara, South, Minami, West, Nishi, Jonan wards, including `Watanabedori 2-4-28` / 中央区 | Fukuoka |
| Hakata Ward / 博多区 with a blank prefecture | Fukuoka, in Fukuoka |
| Kitakyushu wards (Kokurakita, Kokuraminami, Tobata, Wakamatsu, Yahatanishi), whether or not the English value says Kitakyushu | Kitakyushu |
| Sapporo wards, including North, East, West, and Nishi for the same 西区 | Sapporo |
| Osaka city wards whose Japanese value is only the ward, once a person has confirmed they are not Sakai | Osaka |
| Sakai, West Ward; Sakai, South Ward; Sakai North Ward | Sakai |
| Sendai, Aoba Ward; Sendai, Miyagino Ward | Sendai |
| Kumamoto: Chuo, Minami, and Kita wards | Kumamoto |
| Niigata: Chuo Ward and West Ward | Niigata |
| Urawa Ward / 浦和区 | Saitama |
| Yamanashi Chuo / 中央市 | Chuo |
| Tsurgua / 敦賀市 | Tsuruga |
| Minoh / 府箕面市 and 箕面市 | Minoh |
| Ikeda / 池田 | Ikeda, with 池田市 |
| Miyagi District, Rifu | Rifu |
| Esashi, Hiyama District | Esashi |
| Kutchan, Abuta District, including the North 4 block | Kutchan |

Bare districts with no town (Kasuya, Setana, Abuta, Satsuma, Watarai, Taki, Kiso, Kitaazumi, Shimotakai, Nakagami, Shimajiri, Nakaniikawa, Myozai, Kaifu, Minamikoma, and Mie / 三重郡) stay unresolved.
