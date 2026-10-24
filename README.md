# LDoE Survival Companion

Trợ lý tác chiến và tra cứu thông số thời gian thực dành cho người chơi **Last Day on Earth: Survival**.
Ứng dụng web hoạt động hoàn toàn độc lập phía client (offline-first), không yêu cầu máy chủ backend, sử dụng các tệp static JSON cho cơ sở dữ liệu game và `localStorage` để lưu trữ tiến độ cá nhân.

---

## 1. Tech Stack

- **Framework**: React 18 + TypeScript + Vite 6
- **Routing**: React Router v6 (`HashRouter` tối ưu cho hosting tĩnh không cần cấu hình server)
- **Styling**: Tailwind CSS với theme tác chiến chuyên biệt (*Dark Survival / Tactical OS*: Charcoal `#0b0d11`, Amber `#f59e0b`, Olive `#656d4a`, Danger Red `#ef4444`)
- **Icons**: Lucide Icons
- **Unit Testing**: Vitest 2
- **Data Persistence**: `localStorage` (quản lý qua `PersonalStorageService` có schema versioning)
- **Static Game Data**: Các tệp JSON đặt trong `public/data/`

---

## 2. Cách cài đặt và chạy ứng dụng

### Yêu cầu môi trường
- Node.js: phiên bản `>= 20.0.0`
- Trình quản lý gói: `npm`

### Các lệnh thực thi
```bash
# Di chuyển vào thư mục dự án
cd ldoe-survival-companion

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy máy chủ phát triển (Dev Server)
npm run dev

# Chạy bộ kiểm thử tự động (Unit Tests)
npm run test

# Biên dịch dự án cho production
npm run build

# Xem thử bản dựng production
npm run preview
```

---

## 3. Cấu trúc thư mục dự án

```
ldoe-survival-companion/
├── public/
│   └── data/                       # Dữ liệu game tĩnh chuẩn hóa (JSON only)
│       ├── items.json              # Vũ khí, giáp, nguyên liệu, thức ăn, y tế
│       ├── enemies.json            # Zombie, quái vật đột biến, boss hầm ngầm
│       ├── recipes.json            # Công thức chế tạo & bàn gia công
│       ├── locations.json          # Rừng thông, mỏ đá, Bunker Alfa, Farm
│       └── quests.json             # Chuỗi nhiệm vụ Survivor's Path & Raider
├── src/
│   ├── components/
│   │   ├── common/                 # UI components dùng chung (Button, Card, Badge, Modal...)
│   │   └── layout/                 # Layout (Sidebar, Topbar, MobileNav, GlobalSearchModal)
│   ├── context/
│   │   └── DataContext.tsx         # Tải, xác thực và cung cấp dữ liệu game toàn cục
│   ├── hooks/
│   │   └── usePersonalData.ts      # Hook kết nối reactive với localStorage
│   ├── lib/
│   │   └── calculators/            # Pure calculation engines (TDD)
│   │       ├── combatCalculator.ts       # Đòn hạ, độ bền, sneak, giáp
│   │       ├── combatCalculator.test.ts  # Test suite chiến đấu
│   │       ├── craftingPlanner.ts        # Phân rã đệ quy & trừ kho đồ
│   │       └── craftingPlanner.test.ts   # Test suite chế tạo
│   ├── pages/
│   │   ├── encyclopedia/           # Bách khoa toàn thư (Items, Enemies, Recipes, Locations)
│   │   ├── CombatCalculator.tsx    # Giao diện máy tính chiến đấu tương tác
│   │   ├── CraftingPlanner.tsx     # Giao diện kế hoạch chế tạo & checklist
│   │   ├── Inventory.tsx           # Quản lý kho & độ bền từng vũ khí
│   │   ├── QuestTracker.tsx        # Theo dõi nhiệm vụ & phần thưởng
│   │   ├── Goals.tsx               # Quản lý mục tiêu cá nhân
│   │   ├── Notes.tsx               # Sổ tay chiến thuật & gắn thẻ thực thể
│   │   ├── Settings.tsx            # Sao lưu / Khôi phục JSON / Đặt lại
│   │   └── Dashboard.tsx           # Bảng tin tổng quan sinh tồn
│   ├── services/
│   │   ├── dataLoader.ts           # Service nạp & validate dữ liệu game
│   │   └── storageService.ts       # Service lưu trữ, export/import JSON
│   ├── types/
│   │   └── index.ts                # Định nghĩa kiểu dữ liệu TypeScript
│   ├── App.tsx                     # Định tuyến và cấu hình Router
│   ├── main.tsx                    # Điểm khởi động ứng dụng
│   └── index.css                   # Tailwind styles và tactical scrollbar
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 4. Hướng dẫn quản trị & cập nhật dữ liệu game

Mọi dữ liệu game được định dạng chuẩn JSON và đặt tại `public/data/`. Bạn có thể cập nhật hoặc mở rộng trực tiếp mà không cần sửa code React.

### 4.1. Cách thêm một vật phẩm mới (`items.json`)
Thêm một đối tượng vào mảng trong `public/data/items.json`:
```json
{
  "id": "new_weapon_id",
  "name": "Tên tiếng Anh",
  "vietnameseName": "Tên tiếng Việt",
  "description": "Mô tả tính năng và cách sử dụng.",
  "category": "weapon_melee", // 'weapon_melee' | 'weapon_firearm' | 'resource_raw' | 'resource_processed' | 'medical' | 'tool'
  "rarity": "rare", // 'common' | 'rare' | 'epic' | 'legendary'
  "stackSize": 1,
  "craftable": true,
  "weaponStats": {
    "damage": 25,
    "attackSpeed": 1.2,
    "durability": 80,
    "range": 1.3,
    "sneakMultiplier": 3,
    "isFirearm": false,
    "dps": 30.0
  },
  "verificationStatus": "verified",
  "source": "In-game Verified",
  "verifiedAt": "2024-03-01",
  "gameVersion": "1.20+"
}
```

### 4.2. Cách thêm quái vật mới (`enemies.json`)
Thêm vào `public/data/enemies.json`:
```json
{
  "id": "new_zombie_id",
  "name": "Tên tiếng Anh",
  "vietnameseName": "Tên tiếng Việt",
  "category": "zombie", // 'zombie' | 'boss' | 'wildlife'
  "hp": 150,
  "damage": 20,
  "armor": 0,
  "attackSpeed": 1.0,
  "movementSpeed": "normal",
  "dangerRating": 2, // 1 - 5 sọ
  "description": "Đặc điểm nhận dạng...",
  "abilities": ["Cắn xé liên hoàn"],
  "drops": [
    { "itemId": "cloth", "chance": "50%", "quantity": "1-2" }
  ],
  "locations": ["pine_grove", "limestone_cliffs"],
  "combatTips": ["Giữ khoảng cách và dùng đòn sneak attack."],
  "verificationStatus": "verified",
  "source": "LDoE Fandom Wiki",
  "verifiedAt": "2024-03-01",
  "gameVersion": "1.20+"
}
```

### 4.3. Cách thêm công thức chế tạo mới (`recipes.json`)
Thêm vào `public/data/recipes.json`:
```json
{
  "id": "recipe_custom_item",
  "outputItemId": "new_weapon_id",
  "outputQuantity": 1,
  "workstation": "Workbench", // Bàn gia công hoặc để trống nếu chế tạo tay
  "craftTimeSeconds": 60,
  "levelRequired": 15,
  "ingredients": [
    { "itemId": "iron_bar", "quantity": 5 },
    { "itemId": "leather", "quantity": 3 }
  ],
  "verificationStatus": "verified",
  "source": "In-game Verified",
  "verifiedAt": "2024-03-01",
  "gameVersion": "1.20+"
}
```

### 4.4. Cập nhật thông số game
Nếu phiên bản cập nhật game LDoE thay đổi chỉ số sát thương hoặc công thức:
- Sửa trực tiếp thông số tương ứng trong tệp JSON.
- Cập nhật trường `verifiedAt` và `gameVersion`.
- Ứng dụng và các máy tính (Combat Calculator, Crafting Planner) sẽ tự động áp dụng thông số mới ngay lập tức khi tải trang.

---

## 5. Hướng dẫn sao lưu & khôi phục dữ liệu cá nhân (Backup / Restore)

1. Mở trang **Sao lưu & Dữ liệu** (`/settings`) trên thanh điều hướng.
2. **Xuất sao lưu (Export)**: Nhấn nút **Tải về tệp sao lưu (.json)**. Trình duyệt sẽ tải về tệp có cấu trúc `ldoe_companion_backup_YYYY-MM-DD.json`.
3. **Khôi phục (Import)**: Nhấn **Chọn tệp để khôi phục (.json)** và chọn tệp đã lưu trước đó. Hệ thống sẽ kiểm tra cú pháp, hiển thị bản xem trước số lượng tài nguyên, vũ khí, ghi chú, nhiệm vụ và yêu cầu bạn xác nhận trước khi áp dụng.

---

## 6. Giới hạn hiện tại

- **Môi trường hoạt động**: Ứng dụng chạy hoàn toàn trên client trình duyệt của người dùng. Để đồng bộ dữ liệu giữa máy tính và điện thoại, người dùng sử dụng tính năng Export / Import JSON.
- **Dữ liệu vũ khí gắn mod**: Bản phát hành hiện tại cung cấp chỉ số vũ khí nguyên bản (stock weapon stats) đã được xác minh. Người dùng có thể sử dụng ô **Tùy chỉnh sát thương mỗi phát (Damage override)** trong máy tính chiến đấu để giả lập bất kỳ mod súng/cận chiến nào.
