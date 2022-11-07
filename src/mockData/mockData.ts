// locale will be used for the site's language settings

// language is the spoken language

const healthcareProfessionals = [
  {
    id: "1",
    names: [
      {
        lastName: "Ermish",
        firstName: "Philip",
        middleName: "Michael",
        locale: "en",
      },
      {
        lastName: "アーミッシュ",
        firstName: "フィリップ",
        middleName: "マイケル",
        locale: "ja",
      },
    ],
    spokenLanguages: ["JAPANESE", "ENGLISH"],
    specialties: [
      {
        id: "1",
        name: "General Practice",
        locale: "en"
      },
      {
        id: "1",
        name: "一般診療",
        locale: "ja"
      }
    ]
  },
  {
    id: "2",
    names: [
      {
        lastName: "Kilzer",
        firstName: "Ann",
        middleName: "",
        locale: "en",
      },
      {
        lastName: "キルザー",
        firstName: "杏",
        middleName: "",
        locale: "ja",
      },
    ],
    spokenLanguages: ["JAPANESE"],
    specialties: [
      {
        id: "2",
        name: "Internal Medicine",
        locale: "en"
      },
      {
        id: "2",
        name: "内科",
        locale: "ja"
      }
    ]
  },
  {
    id: "3",
    names: [
      {
        lastName: "Toyoda",
        firstName: "LaShawn",
        middleName: "T",
        locale: "en",
      },
      {
        lastName: "豊田",
        firstName: "ラシァン",
        middleName: "ティ",
        locale: "ja",
      },
    ],
    spokenLanguages: ["ENGLISH"],
    specialties: [
      {
        id: "3",
        name: "Pediatrics",
        locale: "en"
      },
      {
        id: "3",
        name: "小児科",
        locale: "ja"
      }
    ]
  },
];

export default healthcareProfessionals;
