window.GIAPHA = {
  "clan": {
    "name": "Dòng họ Nguyễn",
    "subtitle": "Gia phả mẫu phụ hệ",
    "model": "ID, giới tính, ID cha, thứ tự con. Đời = đời cha + 1. Con của con gái thuộc họ ngoại, không nằm trong cây này."
  },
  "thresholds": {
    "nguPhuc": 4,
    "rutGon": 6
  },
  "people": [
    {
      "id": "P01",
      "name": "Nguyễn Văn Tổ",
      "gender": "Nam",
      "fatherId": null,
      "order": null,
      "generation": 1,
      "note": "Thủy tổ"
    },
    {
      "id": "P02",
      "name": "Nguyễn Văn Bình",
      "gender": "Nam",
      "fatherId": "P01",
      "order": 1,
      "generation": 2,
      "note": "Chi 1 (chi trưởng)"
    },
    {
      "id": "P03",
      "name": "Nguyễn Văn Cường",
      "gender": "Nam",
      "fatherId": "P01",
      "order": 2,
      "generation": 2,
      "note": "Chi 2"
    },
    {
      "id": "P04",
      "name": "Nguyễn Thị Dung",
      "gender": "Nữ",
      "fatherId": "P01",
      "order": 3,
      "generation": 2,
      "note": "Con gái (con cháu vào họ ngoại)"
    },
    {
      "id": "P05",
      "name": "Nguyễn Văn Hùng",
      "gender": "Nam",
      "fatherId": "P02",
      "order": 1,
      "generation": 3,
      "note": "Chi 1"
    },
    {
      "id": "P06",
      "name": "Nguyễn Thị Lan",
      "gender": "Nữ",
      "fatherId": "P02",
      "order": 2,
      "generation": 3,
      "note": "Chi 1"
    },
    {
      "id": "P07",
      "name": "Nguyễn Văn Khoa",
      "gender": "Nam",
      "fatherId": "P03",
      "order": 1,
      "generation": 3,
      "note": "Chi 2"
    },
    {
      "id": "P08",
      "name": "Nguyễn Văn Lâm",
      "gender": "Nam",
      "fatherId": "P03",
      "order": 2,
      "generation": 3,
      "note": "Chi 2"
    },
    {
      "id": "P09",
      "name": "Nguyễn Văn Minh",
      "gender": "Nam",
      "fatherId": "P05",
      "order": 1,
      "generation": 4,
      "note": "Chi 1"
    },
    {
      "id": "P10",
      "name": "Nguyễn Văn Nam",
      "gender": "Nam",
      "fatherId": "P05",
      "order": 2,
      "generation": 4,
      "note": "Chi 1"
    },
    {
      "id": "P11",
      "name": "Nguyễn Văn Phúc",
      "gender": "Nam",
      "fatherId": "P07",
      "order": 1,
      "generation": 4,
      "note": "Chi 2"
    },
    {
      "id": "P12",
      "name": "Nguyễn Văn Quang",
      "gender": "Nam",
      "fatherId": "P08",
      "order": 1,
      "generation": 4,
      "note": "Chi 2"
    },
    {
      "id": "P13",
      "name": "Nguyễn Văn Sơn",
      "gender": "Nam",
      "fatherId": "P09",
      "order": 1,
      "generation": 5,
      "note": "Chi 1"
    },
    {
      "id": "P14",
      "name": "Nguyễn Văn Thái",
      "gender": "Nam",
      "fatherId": "P11",
      "order": 1,
      "generation": 5,
      "note": "Chi 2"
    },
    {
      "id": "P15",
      "name": "Nguyễn Văn Tuấn",
      "gender": "Nam",
      "fatherId": "P12",
      "order": 1,
      "generation": 5,
      "note": "Chi 2"
    },
    {
      "id": "P16",
      "name": "Nguyễn Văn Vinh",
      "gender": "Nam",
      "fatherId": "P13",
      "order": 1,
      "generation": 6,
      "note": "Chi 1"
    },
    {
      "id": "P17",
      "name": "Nguyễn Văn Yên",
      "gender": "Nam",
      "fatherId": "P14",
      "order": 1,
      "generation": 6,
      "note": "Chi 2"
    },
    {
      "id": "P18",
      "name": "Nguyễn Văn Ân",
      "gender": "Nam",
      "fatherId": "P16",
      "order": 1,
      "generation": 7,
      "note": "Chi 1"
    },
    {
      "id": "P19",
      "name": "Nguyễn Văn Bảo",
      "gender": "Nam",
      "fatherId": "P17",
      "order": 1,
      "generation": 7,
      "note": "Chi 2"
    }
  ],
  "rules": {
    "0-1": {
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "lcaX": "X là tổ chung",
      "lcaY": "Cha",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Tử"
    },
    "0-2": {
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "lcaX": "X là tổ chung",
      "lcaY": "Ông",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Tôn"
    },
    "0-3": {
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "lcaX": "X là tổ chung",
      "lcaY": "Cụ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Tằng tôn"
    },
    "0-4": {
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "lcaX": "X là tổ chung",
      "lcaY": "Kỵ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Huyền tôn"
    },
    "0-5": {
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "lcaX": "X là tổ chung",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Lai tôn"
    },
    "0-6": {
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "lcaX": "X là tổ chung",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Hậu duệ xa"
    },
    "0-7": {
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "lcaX": "X là tổ chung",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Hậu duệ xa"
    },
    "0-8": {
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "lcaX": "X là tổ chung",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Hậu duệ xa"
    },
    "1-0": {
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "lcaX": "Cha",
      "lcaY": "Y là tổ chung",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Phụ / mẫu"
    },
    "1-1": {
      "type": "Anh chị em ruột (cùng cha)",
      "lcaX": "Cha",
      "lcaY": "Cha",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Thân huynh đệ"
    },
    "1-2": {
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "lcaX": "Cha",
      "lcaY": "Ông",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "1-3": {
      "type": "Bậc dưới 2 đời – Y thuộc hàng cháu",
      "lcaX": "Cha",
      "lcaY": "Cụ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "1-4": {
      "type": "Bậc dưới 3 đời – Y thuộc hàng cháu xa",
      "lcaX": "Cha",
      "lcaY": "Kỵ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "1-5": {
      "type": "Bậc dưới 4 đời – Y thuộc hàng cháu xa",
      "lcaX": "Cha",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "1-6": {
      "type": "Bậc dưới 5 đời – Y thuộc hàng cháu xa",
      "lcaX": "Cha",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "1-7": {
      "type": "Bậc dưới 6 đời – Y thuộc hàng cháu xa",
      "lcaX": "Cha",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "1-8": {
      "type": "Bậc dưới 7 đời – Y thuộc hàng cháu xa",
      "lcaX": "Cha",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "2-0": {
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "lcaX": "Ông",
      "lcaY": "Y là tổ chung",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Tổ phụ / tổ mẫu"
    },
    "2-1": {
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "lcaX": "Ông",
      "lcaY": "Cha",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "*Nữ nhánh trên: Bắc thường gọi bác, Nam thường gọi cô"
    },
    "2-2": {
      "type": "Anh chị em họ gần – cùng ông (con chú con bác)",
      "lcaX": "Ông",
      "lcaY": "Ông",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Đường huynh đệ"
    },
    "2-3": {
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "lcaX": "Ông",
      "lcaY": "Cụ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "2-4": {
      "type": "Bậc dưới 2 đời – Y thuộc hàng cháu",
      "lcaX": "Ông",
      "lcaY": "Kỵ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "2-5": {
      "type": "Bậc dưới 3 đời – Y thuộc hàng cháu xa",
      "lcaX": "Ông",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "2-6": {
      "type": "Bậc dưới 4 đời – Y thuộc hàng cháu xa",
      "lcaX": "Ông",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "2-7": {
      "type": "Bậc dưới 5 đời – Y thuộc hàng cháu xa",
      "lcaX": "Ông",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "2-8": {
      "type": "Bậc dưới 6 đời – Y thuộc hàng cháu xa",
      "lcaX": "Ông",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "3-0": {
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "lcaX": "Cụ",
      "lcaY": "Y là tổ chung",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Tằng tổ"
    },
    "3-1": {
      "type": "Bậc trên 2 đời – Y thuộc hàng ông",
      "lcaX": "Cụ",
      "lcaY": "Cha",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "3-2": {
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "lcaX": "Cụ",
      "lcaY": "Ông",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "*Nữ nhánh trên: Bắc thường gọi bác, Nam thường gọi cô"
    },
    "3-3": {
      "type": "Họ 2 đời – cùng cụ",
      "lcaX": "Cụ",
      "lcaY": "Cụ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Tái tòng huynh đệ"
    },
    "3-4": {
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "lcaX": "Cụ",
      "lcaY": "Kỵ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "3-5": {
      "type": "Bậc dưới 2 đời – Y thuộc hàng cháu",
      "lcaX": "Cụ",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "3-6": {
      "type": "Bậc dưới 3 đời – Y thuộc hàng cháu xa",
      "lcaX": "Cụ",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "3-7": {
      "type": "Bậc dưới 4 đời – Y thuộc hàng cháu xa",
      "lcaX": "Cụ",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "3-8": {
      "type": "Bậc dưới 5 đời – Y thuộc hàng cháu xa",
      "lcaX": "Cụ",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "4-0": {
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "lcaX": "Kỵ",
      "lcaY": "Y là tổ chung",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Cao tổ"
    },
    "4-1": {
      "type": "Bậc trên 3 đời – Y thuộc hàng cụ",
      "lcaX": "Kỵ",
      "lcaY": "Cha",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "4-2": {
      "type": "Bậc trên 2 đời – Y thuộc hàng ông",
      "lcaX": "Kỵ",
      "lcaY": "Ông",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "4-3": {
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "lcaX": "Kỵ",
      "lcaY": "Cụ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "*Nữ nhánh trên: Bắc thường gọi bác, Nam thường gọi cô"
    },
    "4-4": {
      "type": "Họ 3 đời – cùng kỵ",
      "lcaX": "Kỵ",
      "lcaY": "Kỵ",
      "scope": "Trong ngũ phục (cùng cao tổ)",
      "tone": "Gọi chính xác theo vai vế",
      "han": "Tam tòng huynh đệ"
    },
    "4-5": {
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "lcaX": "Kỵ",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "4-6": {
      "type": "Bậc dưới 2 đời – Y thuộc hàng cháu",
      "lcaX": "Kỵ",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "4-7": {
      "type": "Bậc dưới 3 đời – Y thuộc hàng cháu xa",
      "lcaX": "Kỵ",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "4-8": {
      "type": "Bậc dưới 4 đời – Y thuộc hàng cháu xa",
      "lcaX": "Kỵ",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "5-0": {
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Y là tổ chung",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Viễn tổ / tiên tổ"
    },
    "5-1": {
      "type": "Bậc trên 4 đời – Y thuộc hàng kỵ",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Cha",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "5-2": {
      "type": "Bậc trên 3 đời – Y thuộc hàng cụ",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Ông",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "5-3": {
      "type": "Bậc trên 2 đời – Y thuộc hàng ông",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Cụ",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "5-4": {
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Kỵ",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "*Nữ nhánh trên: Bắc thường gọi bác, Nam thường gọi cô"
    },
    "5-5": {
      "type": "Họ xa – đồng tộc (cùng tổ 5 đời trên)",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Tộc huynh đệ"
    },
    "5-6": {
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "5-7": {
      "type": "Bậc dưới 2 đời – Y thuộc hàng cháu",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "5-8": {
      "type": "Bậc dưới 3 đời – Y thuộc hàng cháu xa",
      "lcaX": "Tổ (5 đời trên)",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "6-0": {
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Y là tổ chung",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Viễn tổ / tiên tổ"
    },
    "6-1": {
      "type": "Bậc trên 5 đời – Y thuộc hàng tổ (rất xa)",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Cha",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "6-2": {
      "type": "Bậc trên 4 đời – Y thuộc hàng kỵ",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Ông",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "6-3": {
      "type": "Bậc trên 3 đời – Y thuộc hàng cụ",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Cụ",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "6-4": {
      "type": "Bậc trên 2 đời – Y thuộc hàng ông",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Kỵ",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "6-5": {
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "*Nữ nhánh trên: Bắc thường gọi bác, Nam thường gọi cô"
    },
    "6-6": {
      "type": "Họ xa – đồng tộc (cùng tổ 6 đời trên)",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Giữ vai vế nếu biết rõ; có thể rút gọn",
      "han": "Tộc huynh đệ"
    },
    "6-7": {
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "6-8": {
      "type": "Bậc dưới 2 đời – Y thuộc hàng cháu",
      "lcaX": "Tổ (6 đời trên)",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "7-0": {
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Y là tổ chung",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Viễn tổ / tiên tổ"
    },
    "7-1": {
      "type": "Bậc trên 6 đời – Y thuộc hàng tổ (rất xa)",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Cha",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "7-2": {
      "type": "Bậc trên 5 đời – Y thuộc hàng tổ (rất xa)",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Ông",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "7-3": {
      "type": "Bậc trên 4 đời – Y thuộc hàng kỵ",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Cụ",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "7-4": {
      "type": "Bậc trên 3 đời – Y thuộc hàng cụ",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Kỵ",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "7-5": {
      "type": "Bậc trên 2 đời – Y thuộc hàng ông",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "7-6": {
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "*Nữ nhánh trên: Bắc thường gọi bác, Nam thường gọi cô"
    },
    "7-7": {
      "type": "Họ xa – đồng tộc (cùng tổ 7 đời trên)",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Tộc huynh đệ"
    },
    "7-8": {
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "lcaX": "Tổ (7 đời trên)",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Người trên gọi người dưới là 'cháu'; người dưới gọi người trên theo dòng tương ứng (tra dòng đảo b,a)"
    },
    "8-0": {
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Y là tổ chung",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Viễn tổ / tiên tổ"
    },
    "8-1": {
      "type": "Bậc trên 7 đời – Y thuộc hàng tổ (rất xa)",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Cha",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "8-2": {
      "type": "Bậc trên 6 đời – Y thuộc hàng tổ (rất xa)",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Ông",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "8-3": {
      "type": "Bậc trên 5 đời – Y thuộc hàng tổ (rất xa)",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Cụ",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "8-4": {
      "type": "Bậc trên 4 đời – Y thuộc hàng kỵ",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Kỵ",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "8-5": {
      "type": "Bậc trên 3 đời – Y thuộc hàng cụ",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Tổ (5 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "8-6": {
      "type": "Bậc trên 2 đời – Y thuộc hàng ông",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Tổ (6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Chỉ xét vai vế bậc trên; tên bác/chú chỉ dùng cho bậc cha chú và bậc ông"
    },
    "8-7": {
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Tổ (7 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "*Nữ nhánh trên: Bắc thường gọi bác, Nam thường gọi cô"
    },
    "8-8": {
      "type": "Họ xa – đồng tộc (cùng tổ 8 đời trên)",
      "lcaX": "Tổ (8 đời trên)",
      "lcaY": "Tổ (8 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)",
      "tone": "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi",
      "han": "Tộc huynh đệ"
    }
  },
  "ranks": [
    {
      "level": "Gia đình (hộ)",
      "ancestor": "Cha / ông",
      "how": "Cùng cha hoặc cùng ông, sống chung hoặc gần",
      "example": "Anh chị em ruột, bác chú cô, ông bà",
      "note": "Đơn vị nhỏ nhất; thờ cúng tại nhà."
    },
    {
      "level": "Ngành",
      "ancestor": "Cụ / kỵ trong ngành",
      "how": "Cùng nhánh nhỏ, vài đời gần nhau",
      "example": "Anh em con chú bác, họ 2–3 đời",
      "note": "Thường có trưởng ngành."
    },
    {
      "level": "Phái",
      "ancestor": "Tổ của phái",
      "how": "Nhánh nhỏ trong chi",
      "example": "Họ 3–5 đời, vẫn trong ngũ phục",
      "note": "Có trưởng phái, có thể có nhà thờ phái."
    },
    {
      "level": "Chi",
      "ancestor": "Con trai của thủy tổ (tổ chi)",
      "how": "Nhánh lớn tách từ các con trai của tổ. Chi trưởng nối từ trưởng nam, còn lại là chi thứ",
      "example": "Họ xa hơn 5 đời, vẫn gọi theo đời",
      "note": "Chi trưởng giữ từ đường, phả gốc, giỗ tổ chính."
    },
    {
      "level": "Họ (tông tộc)",
      "ancestor": "Thủy tổ / thỉ tổ / tổ khai canh",
      "how": "Mọi hậu duệ nam hệ của thủy tổ, kể cả con gái sinh ra trong họ",
      "example": "Đồng tông, đồng tộc, bà con trong họ",
      "note": "Khác chi thì tìm tổ chung ở cấp này. Cùng họ nhưng khác gốc (không cùng tổ) thì KHÔNG phải đồng tộc."
    },
    {
      "level": "Họ ngoại / họ vợ (tam tộc)",
      "ancestor": "Không nằm trong cây phụ hệ",
      "how": "Tạo cây riêng, nối bằng quan hệ mẹ / vợ",
      "example": "Cậu, dì, mợ, thông gia",
      "note": "Xem sheet 'Vùng miền & hôn nhân'."
    }
  ],
  "regions": [
    {
      "relation": "Cha",
      "bac": "Bố / thầy",
      "trung": "Ba / bố",
      "nam": "Ba / tía",
      "note": "Thay đổi theo địa phương."
    },
    {
      "relation": "Mẹ",
      "bac": "Mẹ / u / bầm",
      "trung": "Mạ / mế",
      "nam": "Má",
      "note": ""
    },
    {
      "relation": "Con đầu lòng",
      "bac": "Cả",
      "trung": "Cả",
      "nam": "Hai",
      "note": "Miền Nam không dùng 'Cả', người con đầu là 'Hai'."
    },
    {
      "relation": "Anh của cha",
      "bac": "Bác",
      "trung": "Bác",
      "nam": "Bác",
      "note": ""
    },
    {
      "relation": "Em trai của cha",
      "bac": "Chú",
      "trung": "Chú",
      "nam": "Chú",
      "note": "Vợ chú gọi là thím."
    },
    {
      "relation": "Chị của cha",
      "bac": "Bác (gái)",
      "trung": "Bác / o",
      "nam": "Cô (thường)",
      "note": "Nam thường gọi cô theo thứ bậc (cô Hai, cô Ba)."
    },
    {
      "relation": "Em gái của cha",
      "bac": "Cô",
      "trung": "O",
      "nam": "Cô",
      "note": "Chồng cô: chú hoặc dượng."
    },
    {
      "relation": "Anh / em trai của mẹ",
      "bac": "Cậu",
      "trung": "Cậu",
      "nam": "Cậu",
      "note": "Vợ cậu gọi là mợ."
    },
    {
      "relation": "Chị / em gái của mẹ",
      "bac": "Dì (chị có nơi gọi bác)",
      "trung": "Dì",
      "nam": "Dì",
      "note": "Chồng dì: dượng hoặc chú."
    },
    {
      "relation": "Ông bà nội / ngoại",
      "bac": "Ông bà nội / ngoại",
      "trung": "Ông bà / mệ",
      "nam": "Ông bà nội / ngoại",
      "note": ""
    },
    {
      "relation": "Mức nghiêm ngặt vai vế",
      "bac": "Rất chặt ở làng quê; gọi sai vai là mất lễ",
      "trung": "Khá chặt",
      "nam": "Linh hoạt hơn, thường theo tuổi và mức thân",
      "note": "Tham số 'ngưỡng rút gọn' nên thấp hơn ở các họ đô thị / xa quê."
    }
  ],
  "marriage": [
    {
      "person": "Vợ của bác",
      "call": "Bác gái",
      "via": "Chồng",
      "note": ""
    },
    {
      "person": "Vợ của chú",
      "call": "Thím",
      "via": "Chồng",
      "note": ""
    },
    {
      "person": "Chồng của cô",
      "call": "Chú / dượng",
      "via": "Vợ",
      "note": "Vùng miền khác nhau."
    },
    {
      "person": "Vợ của cậu",
      "call": "Mợ",
      "via": "Chồng",
      "note": ""
    },
    {
      "person": "Chồng của dì",
      "call": "Dượng / chú",
      "via": "Vợ",
      "note": ""
    },
    {
      "person": "Vợ của anh",
      "call": "Chị (dâu)",
      "via": "Chồng",
      "note": ""
    },
    {
      "person": "Vợ của em trai",
      "call": "Em (dâu)",
      "via": "Chồng",
      "note": ""
    },
    {
      "person": "Chồng của chị / em gái",
      "call": "Anh / em (rể)",
      "via": "Vợ",
      "note": ""
    },
    {
      "person": "Bố mẹ vợ / chồng",
      "call": "Bố, mẹ (hoặc ba, má)",
      "via": "Con dâu / con rể",
      "note": ""
    }
  ],
  "cases": [
    {
      "n": 1,
      "title": "Khác chi, tổ chung xa",
      "desc": "Hai người ở hai chi khác nhau, tổ chung ở cấp họ hoặc ở đời tách chi.",
      "handle": "Đi ngược cây tới tổ chung gần nhất (LCA). Tra bảng 'Quy tắc' như thường.",
      "effect": "a, b có thể lớn; tra bình thường."
    },
    {
      "n": 2,
      "title": "Cùng đời nhưng nhỏ tuổi hơn hẳn người trên",
      "desc": "Cháu lớn tuổi hơn 'ông' hoặc 'chú'.",
      "handle": "Luôn gọi theo vai vế (d), không dùng tuổi.",
      "effect": "Không ảnh hưởng."
    },
    {
      "n": 3,
      "title": "Họ xa (max(a,b) lớn hơn ngưỡng rút gọn)",
      "desc": "Khó nhớ ai anh ai em ở đời xa.",
      "handle": "Giữ ranh giới trên/dưới (d khác 0); cùng đời (d = 0) cho phép gọi theo tuổi nếu cấu hình bật.",
      "effect": "Dùng cột 'Mức độ xưng hô khi xa'."
    },
    {
      "n": 4,
      "title": "Mất gia phả, không biết tổ chung",
      "desc": "Chỉ biết cùng họ, cùng chữ đệm hoặc cùng đời thứ mấy.",
      "handle": "So 'đời thứ' tính từ thủy tổ. Cùng đời gọi anh em, lệch đời thì bên đời trên là bậc trên. Đánh dấu 'ước lượng'.",
      "effect": "Suy ra d = hiệu hai đời; không xác định được nhánh."
    },
    {
      "n": 5,
      "title": "Đời không đồng bộ giữa các chi",
      "desc": "Chi này tới đời 8 nhưng chi kia mới đời 6 dù cùng tuổi.",
      "handle": "Luôn tính a, b từ tổ chung, không so đời tuyệt đối.",
      "effect": "a, b chỉ từ LCA."
    },
    {
      "n": 6,
      "title": "Con thứ, con vợ lẽ",
      "desc": "Cha nhiều vợ, thứ tự đích - thứ.",
      "handle": "Vai vế anh/em theo thứ tự sinh chung của các con cùng cha. Quyền thờ cúng theo quy tắc đích - thứ riêng.",
      "effect": "Nhánh theo thứ tự sinh chung."
    },
    {
      "n": 7,
      "title": "Anh em cùng cha khác mẹ",
      "desc": "Cùng cha, mẹ khác nhau.",
      "handle": "Nối theo cha; vẫn là anh chị em (a=b=1).",
      "effect": "a=b=1."
    },
    {
      "n": 8,
      "title": "Song sinh",
      "desc": "Hai người sinh cùng ngày.",
      "handle": "Theo giờ sinh; nếu không rõ, theo thứ tự đã ghi trong phả.",
      "effect": "Quyết định nhánh Lớn hơn / Nhỏ hơn."
    },
    {
      "n": 9,
      "title": "Con gái",
      "desc": "Con gái thuộc họ khi sinh ra, nhưng con của cô theo họ ngoại.",
      "handle": "Giữ con gái trong cây (có thứ tự). Con của con gái đưa sang cây họ ngoại.",
      "effect": "Con gái tính a, b bình thường; hậu duệ của cô không tính."
    },
    {
      "n": 10,
      "title": "Con nuôi / con thừa tự",
      "desc": "Nhận nuôi trong hoặc ngoài họ, nối dõi.",
      "handle": "Gắn vào cha nuôi như con ruột. Cần cờ 'con nuôi' và ngày nhập tộc để xác định thứ tự.",
      "effect": "Tính như con của cha nuôi."
    },
    {
      "n": 11,
      "title": "Ở rể / theo họ mẹ",
      "desc": "Con ở rể hoặc mang họ mẹ.",
      "handle": "Tách khỏi cây phụ hệ, nối bằng quan hệ riêng (ngoại).",
      "effect": "Không tính vào a, b."
    },
    {
      "n": 12,
      "title": "Đổi họ hoặc ban họ",
      "desc": "Đổi họ để kỵ húy, tị nạn, vua ban họ.",
      "handle": "Giữ ID dòng họ gốc; cho phép nhiều tên họ trên cùng một cây.",
      "effect": "Không ảnh hưởng."
    },
    {
      "n": 13,
      "title": "Trùng họ nhưng khác gốc",
      "desc": "Cùng họ Nguyễn nhưng không chung tổ.",
      "handle": "Không nối chung cây, không phải đồng tộc.",
      "effect": "Không tính."
    },
    {
      "n": 14,
      "title": "Thiếu thông tin thứ tự",
      "desc": "Không biết ai sinh trước giữa hai nhánh.",
      "handle": "Mặc định theo năm sinh nếu có, đánh dấu 'cần xác minh'.",
      "effect": "Nhánh có cờ chưa chắc chắn."
    },
    {
      "n": 15,
      "title": "a hoặc b lớn hơn 8",
      "desc": "Vượt phạm vi bảng 80 trường hợp.",
      "handle": "Áp dụng quy tắc tổng quát ở sheet Hướng dẫn mục 4.",
      "effect": "Dùng d và độ xa."
    }
  ],
  "tests": [
    {
      "x": "P09",
      "y": "P10",
      "ancestor": "P05",
      "a": 1,
      "b": 1,
      "branch": "Nhỏ hơn",
      "xCallsY": "Em trai ruột",
      "yCallsX": "Anh ruột",
      "type": "Anh chị em ruột (cùng cha)",
      "scope": "Trong ngũ phục (cùng cao tổ)"
    },
    {
      "x": "P05",
      "y": "P06",
      "ancestor": "P02",
      "a": 1,
      "b": 1,
      "branch": "Nhỏ hơn",
      "xCallsY": "Em gái ruột",
      "yCallsX": "Anh ruột",
      "type": "Anh chị em ruột (cùng cha)",
      "scope": "Trong ngũ phục (cùng cao tổ)"
    },
    {
      "x": "P06",
      "y": "P09",
      "ancestor": "P02",
      "a": 1,
      "b": 2,
      "branch": "Lớn hơn",
      "xCallsY": "Cháu trai",
      "yCallsX": "Cô",
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "scope": "Trong ngũ phục (cùng cao tổ)"
    },
    {
      "x": "P09",
      "y": "P11",
      "ancestor": "P01",
      "a": 3,
      "b": 3,
      "branch": "Nhỏ hơn",
      "xCallsY": "Em trai họ",
      "yCallsX": "Anh họ",
      "type": "Họ 2 đời – cùng cụ",
      "scope": "Trong ngũ phục (cùng cao tổ)"
    },
    {
      "x": "P13",
      "y": "P11",
      "ancestor": "P01",
      "a": 4,
      "b": 3,
      "branch": "Nhỏ hơn",
      "xCallsY": "Chú",
      "yCallsX": "Cháu trai",
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "scope": "Trong ngũ phục (cùng cao tổ)"
    },
    {
      "x": "P11",
      "y": "P13",
      "ancestor": "P01",
      "a": 3,
      "b": 4,
      "branch": "Lớn hơn",
      "xCallsY": "Cháu trai",
      "yCallsX": "Chú",
      "type": "Bậc dưới 1 đời – Y thuộc hàng cháu",
      "scope": "Trong ngũ phục (cùng cao tổ)"
    },
    {
      "x": "P18",
      "y": "P14",
      "ancestor": "P01",
      "a": 6,
      "b": 4,
      "branch": "Nhỏ hơn",
      "xCallsY": "Ông chú",
      "yCallsX": "Cháu trai",
      "type": "Bậc trên 2 đời – Y thuộc hàng ông",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)"
    },
    {
      "x": "P19",
      "y": "P18",
      "ancestor": "P01",
      "a": 6,
      "b": 6,
      "branch": "Lớn hơn",
      "xCallsY": "Anh họ (đồng tộc)",
      "yCallsX": "Em trai họ (đồng tộc)",
      "type": "Họ xa – đồng tộc (cùng tổ 6 đời trên)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)"
    },
    {
      "x": "P01",
      "y": "P18",
      "ancestor": "P01",
      "a": 0,
      "b": 6,
      "branch": "-",
      "xCallsY": "Hậu duệ đời thứ 6 (trai)",
      "yCallsX": "Ông tổ (6 đời trên)",
      "type": "Hậu duệ trực hệ (X là tổ của Y)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)"
    },
    {
      "x": "P19",
      "y": "P01",
      "ancestor": "P01",
      "a": 6,
      "b": 0,
      "branch": "-",
      "xCallsY": "Ông tổ (6 đời trên)",
      "yCallsX": "Hậu duệ đời thứ 6 (trai)",
      "type": "Tổ tiên trực hệ (Y là tổ của X)",
      "scope": "Ngoài ngũ phục (hết phục, vẫn đồng tộc)"
    },
    {
      "x": "P12",
      "y": "P09",
      "ancestor": "P01",
      "a": 3,
      "b": 3,
      "branch": "Lớn hơn",
      "xCallsY": "Anh họ",
      "yCallsX": "Em trai họ",
      "type": "Họ 2 đời – cùng cụ",
      "scope": "Trong ngũ phục (cùng cao tổ)"
    },
    {
      "x": "P15",
      "y": "P10",
      "ancestor": "P01",
      "a": 4,
      "b": 3,
      "branch": "Lớn hơn",
      "xCallsY": "Bác",
      "yCallsX": "Cháu trai",
      "type": "Bậc trên 1 đời – Y thuộc hàng cha chú bác cô",
      "scope": "Trong ngũ phục (cùng cao tổ)"
    }
  ]
};
