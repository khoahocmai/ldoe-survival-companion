# Ảnh chụp từ game

Đặt ảnh vào đúng thư mục, đặt tên file theo `id` của mục (xem trong file JSON ở `public/data/`):

| Thư mục | Dùng cho | Ví dụ |
| --- | --- | --- |
| `items/` | Vật phẩm (và công thức của vật phẩm đó) | `items/spear.png` |
| `enemies/` | Quái vật, boss | `enemies/roamer.png` |
| `locations/` | Địa điểm | `locations/bunker_alfa.png` |
| `quests/` | Nhiệm vụ | `quests/quest_xxx.png` |

Định dạng hỗ trợ: `png`, `jpg`, `jpeg`, `webp`. Ảnh hiện trong bảng chi tiết của mục; bấm vào để phóng to.

Muốn dùng tên file khác, thêm trường `"image": "images/items/ten-khac.png"` vào mục trong JSON.
