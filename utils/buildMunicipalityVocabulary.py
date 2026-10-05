"""Build the search-city vocabulary from the Digital Agency municipality master.

Source: Address Base Registry mt_city_all.csv
https://www.digital.go.jp/policies/base_registry_address
The codes are the Ministry of Internal Affairs 全国地方公共団体コード.
English readings come from the Geospatial Information Authority names in that file.
Frozen names in docs/city-rules.md replace those readings.

Download:
https://gov-csv-export-public.s3.ap-northeast-1.amazonaws.com/mt_city/mt_city_all.csv.zip

Usage: python utils/buildMunicipalityVocabulary.py path/to/mt_city_all.csv.zip
"""
import csv
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / 'src' / 'vocabulary' / 'municipalities.json'
SQL_PATH = ROOT / 'supabase' / 'migrations' / '20261005024404_add_city_vocabulary.sql'

PREFECTURE_EN = {
    '北海道': 'Hokkaido', '青森県': 'Aomori', '岩手県': 'Iwate', '宮城県': 'Miyagi',
    '秋田県': 'Akita', '山形県': 'Yamagata', '福島県': 'Fukushima', '茨城県': 'Ibaraki',
    '栃木県': 'Tochigi', '群馬県': 'Gunma', '埼玉県': 'Saitama', '千葉県': 'Chiba',
    '東京都': 'Tokyo', '神奈川県': 'Kanagawa', '新潟県': 'Niigata', '富山県': 'Toyama',
    '石川県': 'Ishikawa', '福井県': 'Fukui', '山梨県': 'Yamanashi', '長野県': 'Nagano',
    '岐阜県': 'Gifu', '静岡県': 'Shizuoka', '愛知県': 'Aichi', '三重県': 'Mie',
    '滋賀県': 'Shiga', '京都府': 'Kyoto', '大阪府': 'Osaka', '兵庫県': 'Hyogo',
    '奈良県': 'Nara', '和歌山県': 'Wakayama', '鳥取県': 'Tottori', '島根県': 'Shimane',
    '岡山県': 'Okayama', '広島県': 'Hiroshima', '山口県': 'Yamaguchi', '徳島県': 'Tokushima',
    '香川県': 'Kagawa', '愛媛県': 'Ehime', '高知県': 'Kochi', '福岡県': 'Fukuoka',
    '佐賀県': 'Saga', '長崎県': 'Nagasaki', '熊本県': 'Kumamoto', '大分県': 'Oita',
    '宮崎県': 'Miyazaki', '鹿児島県': 'Kagoshima', '沖縄県': 'Okinawa'
}

# English names already decided in docs/city-rules.md. Keyed by prefecture and Japanese name.
FROZEN_NAMES = {
    ('Tokyo', '千代田区'): 'Chiyoda',
    ('Tokyo', '中央区'): 'Chuo',
    ('Tokyo', '港区'): 'Minato',
    ('Tokyo', '新宿区'): 'Shinjuku',
    ('Tokyo', '文京区'): 'Bunkyo',
    ('Tokyo', '台東区'): 'Taito',
    ('Tokyo', '墨田区'): 'Sumida',
    ('Tokyo', '江東区'): 'Koto',
    ('Tokyo', '品川区'): 'Shinagawa',
    ('Tokyo', '目黒区'): 'Meguro',
    ('Tokyo', '大田区'): 'Ota',
    ('Tokyo', '世田谷区'): 'Setagaya',
    ('Tokyo', '渋谷区'): 'Shibuya',
    ('Tokyo', '中野区'): 'Nakano',
    ('Tokyo', '杉並区'): 'Suginami',
    ('Tokyo', '豊島区'): 'Toshima',
    ('Tokyo', '北区'): 'Kita',
    ('Tokyo', '荒川区'): 'Arakawa',
    ('Tokyo', '板橋区'): 'Itabashi',
    ('Tokyo', '練馬区'): 'Nerima',
    ('Tokyo', '足立区'): 'Adachi',
    ('Tokyo', '葛飾区'): 'Katsushika',
    ('Tokyo', '江戸川区'): 'Edogawa',
    ('Hokkaido', '札幌市'): 'Sapporo',
    ('Hokkaido', '函館市'): 'Hakodate',
    ('Hokkaido', '江差町'): 'Esashi',
    ('Hokkaido', '倶知安町'): 'Kutchan',
    ('Miyagi', '仙台市'): 'Sendai',
    ('Miyagi', '利府町'): 'Rifu',
    ('Akita', '秋田市'): 'Akita',
    ('Yamagata', '山形市'): 'Yamagata',
    ('Saitama', 'さいたま市'): 'Saitama',
    ('Kanagawa', '横浜市'): 'Yokohama',
    ('Niigata', '新潟市'): 'Niigata',
    ('Fukui', '福井市'): 'Fukui',
    ('Fukui', '敦賀市'): 'Tsuruga',
    ('Yamanashi', '中央市'): 'Chuo',
    ('Toyama', '富山市'): 'Toyama',
    ('Osaka', '大阪市'): 'Osaka',
    ('Osaka', '堺市'): 'Sakai',
    ('Osaka', '池田市'): 'Ikeda',
    ('Osaka', '箕面市'): 'Minoh',
    ('Hyogo', '神戸市'): 'Kobe',
    ('Tokushima', '徳島市'): 'Tokushima',
    ('Kochi', '高知市'): 'Kochi',
    ('Fukuoka', '北九州市'): 'Kitakyushu',
    ('Fukuoka', '福岡市'): 'Fukuoka',
    ('Yamaguchi', '山口市'): 'Yamaguchi',
    ('Nagasaki', '長崎市'): 'Nagasaki',
    ('Kumamoto', '熊本市'): 'Kumamoto',
    ('Oita', '大分市'): 'Oita',
    ('Kagoshima', '鹿児島市'): 'Kagoshima',
    ('Okinawa', '沖縄市'): 'Okinawa'
}

MACRONS = str.maketrans({
    'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u',
    'Ā': 'A', 'Ē': 'E', 'Ī': 'I', 'Ō': 'O', 'Ū': 'U'
})


def english_from_roma(roma: str) -> str:
    name = roma.strip().translate(MACRONS)
    name = re.sub(r'(?i)[-\s]+(shi|cho|machi|mura|son|ku|gun)$', '', name)
    parts = re.split(r'[-\s]+', name)
    return ''.join(part[:1].upper() + part[1:] for part in parts if part)


def sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def load_rows(zip_path: Path) -> list[dict[str, str]]:
    raw = zipfile.ZipFile(zip_path).read('mt_city_all.csv')
    for encoding in ('utf-8-sig', 'cp932'):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise SystemExit('could not decode mt_city_all.csv')
    return list(csv.DictReader(text.splitlines()))


def search_cities(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    cities = []
    for row in rows:
        if (row.get('ablt_date') or '').strip():
            continue
        if (row.get('ward') or '').strip():
            continue
        name_ja = (row.get('city') or '').strip()
        if not name_ja or name_ja.endswith('郡'):
            continue
        prefecture_en = PREFECTURE_EN.get((row.get('pref') or '').strip())
        if not prefecture_en:
            raise SystemExit(f"unknown prefecture: {row.get('pref')}")
        frozen = FROZEN_NAMES.get((prefecture_en, name_ja))
        name_en = frozen or english_from_roma(row.get('city_roma') or '')
        if not name_en:
            raise SystemExit(f'missing English name for {prefecture_en} {name_ja}')
        cities.append({
            'lgCode': row['lg_code'].strip(),
            'prefectureEn': prefecture_en,
            'nameEn': name_en,
            'nameJa': name_ja,
            'county': (row.get('county') or '').strip(),
            'countyRoma': (row.get('county_roma') or '').strip()
        })
    return cities


def slug_of(name_en: str) -> str:
    return name_en.strip().lower().replace(' ', '-')


def kind_rank(city: dict[str, str]) -> tuple[int, str]:
    """Plain English name goes to the city, then a Tokyo ward, then a frozen name, then a town."""
    name_ja = city['nameJa']
    if name_ja.endswith('市'):
        kind = 0
    elif name_ja.endswith('区'):
        kind = 1
    elif (city['prefectureEn'], name_ja) in FROZEN_NAMES:
        kind = 2
    elif name_ja.endswith('町'):
        kind = 3
    elif name_ja.endswith('村'):
        kind = 4
    else:
        kind = 5
    return (kind, city['lgCode'])


def disambiguate(cities: list[dict[str, str]]) -> None:
    """Same reading inside one prefecture. The winner keeps the plain name.

    The other municipality takes its district when that name differs. When the
    district is the same word, or there is no district, the national code is
    appended. Both pieces come from the source file, so the next refresh
    applies the same rule.
    """
    groups: dict[tuple[str, str], list[dict[str, str]]] = {}
    for city in cities:
        groups.setdefault((city['prefectureEn'], slug_of(city['nameEn'])), []).append(city)
    taken = {(city['prefectureEn'], slug_of(city['nameEn'])) for city in cities}
    for group in groups.values():
        if len(group) < 2:
            continue
        for city in sorted(group, key=kind_rank)[1:]:
            stem = english_from_roma(city['countyRoma']) if city['countyRoma'] else ''
            base = city['nameEn']
            if stem and slug_of(stem) != slug_of(base):
                candidate = f'{base} {stem}'
            else:
                candidate = f'{base} {city["lgCode"]}'
            key = (city['prefectureEn'], slug_of(candidate))
            if key in taken:
                candidate = f'{base} {city["lgCode"]}'
                key = (city['prefectureEn'], slug_of(candidate))
            if key in taken:
                raise SystemExit(f'could not disambiguate {city}')
            city['nameEn'] = candidate
            taken.add(key)


def assert_unique(cities: list[dict[str, str]]) -> None:
    slugs: set[str] = set()
    codes: set[str] = set()
    for city in cities:
        key = f"{city['prefectureEn']}|{slug_of(city['nameEn'])}"
        if key in slugs:
            raise SystemExit(f'slug collision {key} {city["nameJa"]}')
        slugs.add(key)
        if city['lgCode'] in codes:
            raise SystemExit(f"duplicate code {city['lgCode']}")
        codes.add(city['lgCode'])
        if re.search(r'(?i)(^|[\s-])(city|ward|district|shi|ku)$', city['nameEn']):
            raise SystemExit(f"suffix left on {city}")
        if re.search(r'[āēīōūĀĒĪŌŪ]', city['nameEn']):
            raise SystemExit(f'macron left on {city}')


def write_sql(cities: list[dict[str, str]]) -> None:
    # Preserve the prefecture key order from japanesePrefectures.ts.
    ordered = [
        'Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima', 'Ibaraki',
        'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa', 'Niigata', 'Toyama',
        'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi', 'Mie',
        'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara', 'Wakayama', 'Tottori', 'Shimane',
        'Okayama', 'Hiroshima', 'Yamaguchi', 'Tokushima', 'Kagawa', 'Ehime', 'Kochi',
        'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa'
    ]
    ja_by_en = {en: ja for ja, en in PREFECTURE_EN.items()}
    prefecture_values = ',\n'.join(
        f"  ({sql_string(en)}, {sql_string(ja_by_en[en])}, {sql_string(en.lower())})"
        for en in ordered
    )
    city_values = ',\n'.join(
        '  (' + ', '.join([
            sql_string(city['prefectureEn']),
            sql_string(city['nameEn'].strip().lower().replace(' ', '-')),
            sql_string(city['nameEn']),
            sql_string(city['nameJa']),
            sql_string(city['lgCode'])
        ]) + ')'
        for city in cities
    )
    sql = f"""-- Search cities from the Digital Agency Address Base Registry mt_city_all.csv
-- (file dated 2024-03-12). lg_code is the 全国地方公共団体コード.
-- Regenerated by utils/buildMunicipalityVocabulary.py. Do not edit city rows by hand.
CREATE TABLE prefectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL UNIQUE,
  name_ja text NOT NULL,
  slug text NOT NULL UNIQUE
);

CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prefecture_id uuid NOT NULL REFERENCES prefectures (id),
  slug text NOT NULL,
  name_en text NOT NULL,
  name_ja text NOT NULL,
  lg_code text NOT NULL UNIQUE,
  google_place_id text,
  UNIQUE (prefecture_id, slug)
);

INSERT INTO prefectures (name_en, name_ja, slug) VALUES
{prefecture_values};

INSERT INTO cities (prefecture_id, slug, name_en, name_ja, lg_code)
SELECT prefectures.id, seed.slug, seed.name_en, seed.name_ja, seed.lg_code
FROM (VALUES
{city_values}
) AS seed(prefecture_en, slug, name_en, name_ja, lg_code)
JOIN prefectures ON prefectures.name_en = seed.prefecture_en;

ALTER TABLE facilities
  ADD COLUMN city_id uuid REFERENCES cities (id),
  ADD COLUMN google_place_id text,
  ADD COLUMN source text,
  ADD COLUMN verification_status text NOT NULL DEFAULT 'UNVERIFIED_LOCATION';

ALTER TABLE facilities
  ADD CONSTRAINT facilities_source_check
    CHECK (source IS NULL OR source IN ('MANUAL', 'MHLW_MULTILINGUAL_INSTITUTIONS')),
  ADD CONSTRAINT facilities_verification_status_check
    CHECK (verification_status IN ('UNVERIFIED', 'CONFIRMED', 'UNVERIFIED_LOCATION')),
  ADD CONSTRAINT facilities_confirmed_requires_city
    CHECK (verification_status <> 'CONFIRMED' OR city_id IS NOT NULL);

CREATE INDEX facilities_city_id_idx ON facilities (city_id);
"""
    SQL_PATH.write_text(sql, encoding='utf-8', newline='\n')


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit('usage: python utils/buildMunicipalityVocabulary.py mt_city_all.csv.zip')
    cities = search_cities(load_rows(Path(sys.argv[1])))
    disambiguate(cities)
    assert_unique(cities)
    order = {en: index for index, en in enumerate([
        'Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima', 'Ibaraki',
        'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa', 'Niigata', 'Toyama',
        'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi', 'Mie',
        'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara', 'Wakayama', 'Tottori', 'Shimane',
        'Okayama', 'Hiroshima', 'Yamaguchi', 'Tokushima', 'Kagawa', 'Ehime', 'Kochi',
        'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa'
    ])}
    cities.sort(key=lambda city: (order[city['prefectureEn']], city['lgCode']))
    published = [
        {key: city[key] for key in ('lgCode', 'prefectureEn', 'nameEn', 'nameJa')}
        for city in cities
    ]
    JSON_PATH.write_text(json.dumps(published, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    write_sql(published)
    wards = [city for city in published if city['nameJa'].endswith('区')]
    homophones = [city for city in published if ' ' in city['nameEn']]
    print(f'{len(published)} search cities, {len(wards)} ward rows, {len(homophones)} disambiguated')


if __name__ == '__main__':
    main()
