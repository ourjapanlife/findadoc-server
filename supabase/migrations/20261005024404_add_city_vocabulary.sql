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
  google_place_id text,
  UNIQUE (prefecture_id, slug)
);

INSERT INTO prefectures (name_en, name_ja, slug) VALUES
  ('Hokkaido', '北海道', 'hokkaido'),
  ('Aomori', '青森県', 'aomori'),
  ('Iwate', '岩手県', 'iwate'),
  ('Miyagi', '宮城県', 'miyagi'),
  ('Akita', '秋田県', 'akita'),
  ('Yamagata', '山形県', 'yamagata'),
  ('Fukushima', '福島県', 'fukushima'),
  ('Ibaraki', '茨城県', 'ibaraki'),
  ('Tochigi', '栃木県', 'tochigi'),
  ('Gunma', '群馬県', 'gunma'),
  ('Saitama', '埼玉県', 'saitama'),
  ('Chiba', '千葉県', 'chiba'),
  ('Tokyo', '東京都', 'tokyo'),
  ('Kanagawa', '神奈川県', 'kanagawa'),
  ('Niigata', '新潟県', 'niigata'),
  ('Toyama', '富山県', 'toyama'),
  ('Ishikawa', '石川県', 'ishikawa'),
  ('Fukui', '福井県', 'fukui'),
  ('Yamanashi', '山梨県', 'yamanashi'),
  ('Nagano', '長野県', 'nagano'),
  ('Gifu', '岐阜県', 'gifu'),
  ('Shizuoka', '静岡県', 'shizuoka'),
  ('Aichi', '愛知県', 'aichi'),
  ('Mie', '三重県', 'mie'),
  ('Shiga', '滋賀県', 'shiga'),
  ('Kyoto', '京都府', 'kyoto'),
  ('Osaka', '大阪府', 'osaka'),
  ('Hyogo', '兵庫県', 'hyogo'),
  ('Nara', '奈良県', 'nara'),
  ('Wakayama', '和歌山県', 'wakayama'),
  ('Tottori', '鳥取県', 'tottori'),
  ('Shimane', '島根県', 'shimane'),
  ('Okayama', '岡山県', 'okayama'),
  ('Hiroshima', '広島県', 'hiroshima'),
  ('Yamaguchi', '山口県', 'yamaguchi'),
  ('Tokushima', '徳島県', 'tokushima'),
  ('Kagawa', '香川県', 'kagawa'),
  ('Ehime', '愛媛県', 'ehime'),
  ('Kochi', '高知県', 'kochi'),
  ('Fukuoka', '福岡県', 'fukuoka'),
  ('Saga', '佐賀県', 'saga'),
  ('Nagasaki', '長崎県', 'nagasaki'),
  ('Kumamoto', '熊本県', 'kumamoto'),
  ('Oita', '大分県', 'oita'),
  ('Miyazaki', '宮崎県', 'miyazaki'),
  ('Kagoshima', '鹿児島県', 'kagoshima'),
  ('Okinawa', '沖縄県', 'okinawa');

INSERT INTO cities (prefecture_id, slug, name_en, name_ja)
SELECT prefectures.id, seed.slug, seed.name_en, seed.name_ja
FROM (VALUES
  ('Tokyo', 'chiyoda', 'Chiyoda', '千代田区'),
  ('Tokyo', 'chuo', 'Chuo', '中央区'),
  ('Tokyo', 'minato', 'Minato', '港区'),
  ('Tokyo', 'shinjuku', 'Shinjuku', '新宿区'),
  ('Tokyo', 'bunkyo', 'Bunkyo', '文京区'),
  ('Tokyo', 'taito', 'Taito', '台東区'),
  ('Tokyo', 'sumida', 'Sumida', '墨田区'),
  ('Tokyo', 'koto', 'Koto', '江東区'),
  ('Tokyo', 'shinagawa', 'Shinagawa', '品川区'),
  ('Tokyo', 'meguro', 'Meguro', '目黒区'),
  ('Tokyo', 'ota', 'Ota', '大田区'),
  ('Tokyo', 'setagaya', 'Setagaya', '世田谷区'),
  ('Tokyo', 'shibuya', 'Shibuya', '渋谷区'),
  ('Tokyo', 'nakano', 'Nakano', '中野区'),
  ('Tokyo', 'suginami', 'Suginami', '杉並区'),
  ('Tokyo', 'toshima', 'Toshima', '豊島区'),
  ('Tokyo', 'kita', 'Kita', '北区'),
  ('Tokyo', 'arakawa', 'Arakawa', '荒川区'),
  ('Tokyo', 'itabashi', 'Itabashi', '板橋区'),
  ('Tokyo', 'nerima', 'Nerima', '練馬区'),
  ('Tokyo', 'adachi', 'Adachi', '足立区'),
  ('Tokyo', 'katsushika', 'Katsushika', '葛飾区'),
  ('Tokyo', 'edogawa', 'Edogawa', '江戸川区'),
  ('Fukuoka', 'kitakyushu', 'Kitakyushu', '北九州市'),
  ('Hokkaido', 'sapporo', 'Sapporo', '札幌市'),
  ('Miyagi', 'sendai', 'Sendai', '仙台市'),
  ('Saitama', 'saitama', 'Saitama', 'さいたま市'),
  ('Kanagawa', 'yokohama', 'Yokohama', '横浜市'),
  ('Osaka', 'osaka', 'Osaka', '大阪市'),
  ('Osaka', 'sakai', 'Sakai', '堺市'),
  ('Niigata', 'niigata', 'Niigata', '新潟市'),
  ('Kumamoto', 'kumamoto', 'Kumamoto', '熊本市'),
  ('Fukuoka', 'fukuoka', 'Fukuoka', '福岡市'),
  ('Hyogo', 'kobe', 'Kobe', '神戸市'),
  ('Fukui', 'tsuruga', 'Tsuruga', '敦賀市'),
  ('Osaka', 'ikeda', 'Ikeda', '池田市'),
  ('Hokkaido', 'kutchan', 'Kutchan', '倶知安町'),
  ('Hokkaido', 'hakodate', 'Hakodate', '函館市'),
  ('Hokkaido', 'esashi', 'Esashi', '江差町'),
  ('Miyagi', 'rifu', 'Rifu', '利府町'),
  ('Akita', 'akita', 'Akita', '秋田市'),
  ('Yamagata', 'yamagata', 'Yamagata', '山形市'),
  ('Fukui', 'fukui', 'Fukui', '福井市'),
  ('Yamanashi', 'chuo', 'Chuo', '中央市'),
  ('Toyama', 'toyama', 'Toyama', '富山市'),
  ('Osaka', 'minoh', 'Minoh', '箕面市'),
  ('Tokushima', 'tokushima', 'Tokushima', '徳島市'),
  ('Kochi', 'kochi', 'Kochi', '高知市'),
  ('Yamaguchi', 'yamaguchi', 'Yamaguchi', '山口市'),
  ('Nagasaki', 'nagasaki', 'Nagasaki', '長崎市'),
  ('Oita', 'oita', 'Oita', '大分市'),
  ('Kagoshima', 'kagoshima', 'Kagoshima', '鹿児島市'),
  ('Okinawa', 'okinawa', 'Okinawa', '沖縄市')
) AS seed(prefecture_en, slug, name_en, name_ja)
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
