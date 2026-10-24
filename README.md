# LDoE Survival Companion — Game Encyclopedia & Smart Calculators

Bách khoa toàn thư tra cứu dữ liệu và bộ máy tính tác chiến thông minh dành cho người chơi **Last Day on Earth: Survival**.

Ứng dụng web hoạt động hoàn toàn độc lập phía client (offline-first, no-backend), tải nhanh, giao diện sinh tồn hiện đại hỗ trợ đầy đủ cả hai chế độ **Sáng (Light)** và **Tối (Dark)**.

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Framework**: React 18 + TypeScript + Vite 6
- **Giao diện & Theme**: Tailwind CSS với design token ngữ nghĩa (`bg-surface`, `text-muted`, `border-line`, `accent`...) định nghĩa một lần bằng CSS variables trong `src/index.css`, nên Light / Dark dùng chung một bộ class, không lặp `dark:` ở từng component. Có script chống chớp nháy (no flash) trong `<head>`.
- **Định tuyến (Routing)**: React Router v6 (`HashRouter` an toàn cho hosting tĩnh, root route tự động điều hướng vào `/wiki/items`).
- **Icons**: Lucide React
- **Bộ máy tính & Kiểm thử**: 4 Calculation Engines độc lập (TDD) được kiểm thử tự động bằng **Vitest 2** (41 test, chạy bằng `npm run test`).
- **Kiến trúc Dữ liệu hai lớp (Universal Wiki CRUD)**:
  - **Tầng dữ liệu tĩnh (Base Data)**: Các tệp JSON chuẩn hóa trong `public/data/`.
  - **Tầng dữ liệu chỉnh sửa (Editable Overrides)**: Lưu trữ cục bộ qua `localStorage` (hỗ trợ Thêm, Sửa, Ẩn/Xóa và Đặt lại về mặc định).

---

## 2. Các chức năng chính

### A. Bách khoa toàn thư sinh tồn (Game Encyclopedia & Universal CRUD)
Mọi danh mục dữ liệu đều hỗ trợ tra cứu, tìm kiếm nhanh (Ctrl+K), lọc danh mục, xem chi tiết và **Thêm / Sửa / Ẩn (CRUD)** trực tiếp:
1. **Vật phẩm & Vũ khí (`/wiki/items`)**: Tra cứu thông số sát thương, tốc đánh, độ bền, tầm bắn, sneak multiplier, độ no/khát/hồi máu.
2. **Xác sống & Boss (`/wiki/enemies`)**: Tra cứu lượng máu HP, đòn đánh, độ giáp, kỹ năng nguy hiểm, tỷ lệ rơi đồ (drops) và mẹo khắc chế.
3. **Công thức & Nấu ăn (`/wiki/recipes`)**: Bao gồm công thức chế tạo bàn làm việc và các công thức bếp nấu (`Kitchen Stove`, `Campfire`) kèm chỉ số buff món ăn có thời hạn.
4. **Địa điểm sinh tồn (`/wiki/locations`)**: Thông tin mức nguy hiểm (sọ), tiêu hao năng lượng, zombie xuất hiện, tài nguyên thu thập và công trình cần sửa chữa.
5. **Chuỗi nhiệm vụ (`/quests` hoặc `/wiki/quests`)**: Bách khoa tra cứu nhiệm vụ thực tế của LDoE (*Survivor's Path, Cốt truyện, Raiders, Sự kiện*), hiển thị rõ ràng từng mục tiêu (kill quái, thu thập item, thăm map, sửa công trình) kèm liên kết nhanh sang các máy tính tương ứng.

### B. Bộ công cụ tính toán thông minh (Smart Calculators)
1. **Máy tính chiến đấu (Combat Calculator — `/combat`)**:
   - Tính số đòn cần thiết để hạ gục quái vật.
   - Tiêu hao độ bền và số lượng quái tối đa hạ được trên mỗi cây vũ khí.
   - Hỗ trợ đòn đánh lén Sneak Attack (x3 dmg cho cận chiến).
   - Ô tùy chỉnh sát thương (Damage Override) để giả lập bất kỳ mod vũ khí nào.
   - **Tính toán số lượng vũ khí cần mang theo** khi kết nối với mục tiêu diệt từ sự kiện.
2. **Máy tính Điểm & Tiêu diệt sự kiện (Kill & Points Calculator — `/points`)**:
   - Tối ưu cho Sự kiện Tiếp tế (**Supply Event** - mốc 1.500 điểm) và các đợt sóng Blackport PD.
   - **Chế độ Single Enemy**: Tính chính xác số lượng một loại zombie cần diệt `ceil(remainingPoints / pointsPerKill)` để đạt mốc phần thưởng, kèm nút chuyển sang Combat Calculator.
   - **Chế độ Mixed Plan**: Lập danh sách phối hợp nhiều loại quái, tự động tính tổng điểm tích lũy, tiến độ phần trăm và số điểm còn thiếu.
   - Có cơ chế cảnh báo loại trừ: Zombie trong đấu trường sóng PD không cộng điểm Supply.
3. **Máy tính Vật liệu Công trình (Construction Calculator — `/construction`)**:
   - Hỗ trợ các công trình trọng điểm: Máy phát điện Tháp canh phương Bắc (**Northern Watchtower**), Cầu gỗ trang trại (**Farm Bridge**), Hầm ngầm Bunker Terminal...
   - Tổng hợp danh sách vật liệu theo từng giai đoạn hoặc toàn bộ công trình.
   - Cho phép nhập nguyên liệu đang có sẵn trong người để tính số lượng còn thiếu và tỷ lệ hoàn thành.
   - Tự động phân tích đệ quy nguyên liệu thô (Sub-crafts) cho các vật liệu phức tạp (như Electric Generator).
4. **Kế hoạch chế tạo (Crafting Planner — `/planner`)**:
   - Phân tích đệ quy cây công thức (Crafting Tree) từ thành phẩm về nguyên liệu thô cơ bản.
   - Cho phép nhập số lượng nguyên liệu giả định có sẵn trong một lần tính toán (không bắt buộc lưu trữ kho đồ cá nhân).
   - Tạo danh sách checklist gom đồ tiện lợi khi đi farm.

### C. Cài đặt & Danh bạ Nguồn tham khảo (`/settings`)
- **Theme Switcher**: Chọn chế độ Sáng (Light) hoặc Tối (Dark); nút đổi nhanh nằm ở thanh trên cùng.
- **Danh bạ Nguồn tham khảo**: Danh mục các liên kết website chính thống được kiểm duyệt (Kefir Devblog, Kefir Helpshift, Fandom Wiki), cho phép thêm/sửa/xóa liên kết.
- **Quản lý dữ liệu**: Xuất tệp JSON cơ sở dữ liệu đã hợp nhất, Nhập tệp JSON với cơ chế kiểm tra schema & xem trước số lượng thực thể, hoặc Đặt lại về mặc định.
- **Bảo toàn dữ liệu cũ**: Tự động phát hiện và cung cấp nút xuất bản sao lưu dữ liệu cá nhân cũ (kho đồ, mục tiêu) nếu phát hiện trong trình duyệt.

---

## 3. Cài đặt và Chạy ứng dụng

```bash
# Di chuyển vào thư mục dự án
cd ldoe-survival-companion

# Cài đặt thư viện phụ thuộc
npm install

# Chạy môi trường phát triển (Dev Server)
npm run dev

# Chạy bộ kiểm thử tự động
npm run test

# Biên dịch sản phẩm production
npm run build

# Xem trước bản dựng production
npm run preview
```

---

## 4. Kiến trúc Thư mục

```
src/
├── components/
│   ├── common/              # Badge, Button, Card, Modal, FormModal, ConfirmDialog, Tabs, SearchInput,
│   │                        # Field (form controls), Layout (PageHeader, Section, Stat, FilterChips, ProgressBar...)
│   ├── layout/              # AppLayout, Topbar, Sidebar, MobileNav, GlobalSearchModal, navigation.ts (menu dùng chung)
│   └── wiki/                # WikiPage (khung chung của 5 trang bách khoa), CompactWikiCard, panel chi tiết
├── context/
│   ├── ThemeContext.tsx     # Quản lý theme 'light' | 'dark'
│   └── DataContext.tsx      # Quản lý nạp và hợp nhất cơ sở dữ liệu game
├── lib/
│   └── calculators/         # Bộ máy tính độc lập kèm test suites Vitest
│       ├── combatCalculator.ts & test
│       ├── pointCalculator.ts & test
│       ├── constructionCalculator.ts & test
│       └── craftingPlanner.ts & test
├── pages/
│   ├── encyclopedia/        # ItemsPage, EnemiesPage, RecipesPage, LocationsPage, QuestsPage
│   ├── CombatCalculator.tsx # UI máy tính chiến đấu
│   ├── PointCalculator.tsx  # UI máy tính diệt quái sự kiện
│   ├── ConstructionCalculator.tsx # UI máy tính công trình
│   ├── CraftingPlanner.tsx  # UI kế hoạch chế tạo
│   └── Settings.tsx         # Cài đặt, theme, nguồn tham khảo & quản trị JSON
├── services/
│   ├── dataLoader.ts        # Merge Base JSON + localStorage overrides & quan hệ phụ thuộc
│   └── storageService.ts    # Đọc/ghi localStorage an toàn, export/import JSON
└── types/
    └── index.ts             # Định nghĩa Type-Safe toàn diện cho mọi thực thể game
```
