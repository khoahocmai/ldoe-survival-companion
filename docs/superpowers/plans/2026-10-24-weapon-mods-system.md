# Weapon Mods System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai hệ thống bản độ vũ khí (Weapon Mods) toàn diện: mô hình dữ liệu `weaponMods.json`, tích hợp vào DataLoader/DataContext/Storage, giao diện tương tác Bàn lắp ráp tại `/wiki/weapon-mods`, và kết nối tương tác chéo giữa Vật phẩm (Items) ➔ Bản độ (Mods) ➔ Máy tính chiến đấu (Combat) / Kế hoạch chế tạo (Planner).

**Architecture:** 
- Mở rộng kiểu dữ liệu cốt lõi (`WeaponMod`, `WeaponModSlot`, `WeaponModStatBonus`) trong `src/types/index.ts`, đồng thời bổ sung các nguyên liệu chế tạo mod còn thiếu vào `public/data/items.json`.
- Thêm file dữ liệu chuẩn LDOE `public/data/weaponMods.json` cho 6 vũ khí chủ lực (Cleaver, Machete, Glock 17, M16, AK-47, Shotgun) với đầy đủ mod meta và phẩm cấp.
- Cập nhật `dataLoader.ts` và `storageService.ts` để nạp, lập chỉ mục O(1) theo ID và theo weaponId, hỗ trợ lưu trữ tuỳ biến qua `WikiOverrides`.
- Xây dựng thư viện tính toán độc lập `weaponModCalculator.ts` kiểm thử bằng unit test.
- Xây dựng trang `/wiki/weapon-mods` với bộ chọn vũ khí, bàn nâng cấp tương tác trực quan theo từng slot, bảng so sánh chỉ số trước/sau lắp và tổng hợp nguyên liệu craft.
- Tích hợp điều hướng và liên kết chéo: Nút "Độ vũ khí" từ `ItemsPage`, nút "Đưa vào máy tính chiến đấu" sang `CombatCalculator` (nhận tham số `customDamage`), và nút "Gom nguyên liệu" sang `CraftingPlanner` (hỗ trợ danh sách nguyên liệu tổng hợp).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, React Router v6, Vitest.

**Spec:** Thiết kế chi tiết được phê duyệt từ yêu cầu người dùng (Mô hình `weaponMods.json`, UX tại `/wiki/weapon-mods`, và luồng liên kết chéo 3 trang).

## Global Constraints
- Không phá vỡ các cấu trúc dữ liệu hiện có trong `items.json`, `recipes.json`, `enemies.json` hay các bài test hiện có.
- Tuân thủ hệ màu UI chuẩn Tailwind hiện hành của dự án (`bg-bg`, `text-fg`, `border-line`, `bg-subtle`, `text-muted`, `accent`, `ok`, `danger`).
- Màu sắc phẩm cấp mod tuân thủ quy ước: Thường / Common (Trắng/Xám), Hiếm / Rare (Xanh dương), Cực hiếm / Extremely Rare (Tím).
- Tất cả text giao diện hiển thị bằng tiếng Việt chuẩn LDOE, giữ nguyên tên tiếng Anh chuẩn của mod để người chơi dễ tra cứu.

## Review Focus
1. Vũ khí không có mod nào được lắp (hoặc lắp từng phần): Không bị NaN hay crash chỉ số, fallback an toàn về base stats.
2. Các mod có chỉ số giảm (debuff như -Tốc đánh, +Độ ồn): Hiển thị màu đỏ và tính toán chính xác số liệu cộng trừ.
3. Tham số URL `customDamage` trong `CombatCalculator`: Nhận đúng giá trị từ URL khi chuyển từ trang Mods sang và tính toán ngay số hit diệt quái.
4. Điều hướng từ `ItemsPage` sang `weapon-mods`: Chọn sẵn đúng vũ khí đã click từ Bách khoa vật phẩm.
5. Tổng hợp nguyên liệu craft: Gom nhóm các nguyên liệu trùng nhau giữa các slot, chuyển sang `CraftingPlanner` hiển thị đầy đủ danh sách kiểm tra.

---

### Task 1: Định nghĩa kiểu dữ liệu & Bổ sung nguyên liệu chế tạo Mod

**Files:**
- Modify: `src/types/index.ts:1-269`
- Modify: `public/data/items.json`
- Test: `src/types/types.test.ts`

**Interfaces:**
- Produces: `WeaponModSlot`, `WeaponModStatBonus`, `WeaponMod`, cập nhật `GameDatabase`, `WikiOverrides`.

- [ ] **Step 1: Viết test kiểm tra tính toàn vẹn của kiểu dữ liệu và item nguyên liệu**
Tạo test `src/types/types.test.ts` kiểm tra các kiểu dữ liệu và xác nhận các nguyên liệu chế tạo súng (factory_parts, carbon_composite, spring, hi_tech_component, oil, lens) tồn tại trong `items.json`.

- [ ] **Step 2: Chạy test để xác nhận test ban đầu fail**
Run: `npx vitest run src/types/types.test.ts`
Expected: FAIL vì các item nguyên liệu mới chưa có trong `items.json`.

- [ ] **Step 3: Mở rộng `src/types/index.ts`**
Thêm `WeaponModSlot`, `WeaponModStatBonus`, `WeaponMod`, cập nhật `WikiOverrides` (thêm `customWeaponMods`) và `GameDatabase` (thêm `weaponMods`, `weaponModsMap`, `weaponModsByWeaponIdMap`).

- [ ] **Step 4: Cập nhật `public/data/items.json`**
Bổ sung các item nguyên liệu mod chuyên dụng còn thiếu: `factory_parts` (Bộ phận vũ khí), `carbon_composite` (Sợi carbon tổng hợp), `spring` (Lò xo), `hi_tech_component` (Linh kiện công nghệ cao), `oil` (Dầu súng), `lens` (Thấu kính).

- [ ] **Step 5: Chạy test để xác nhận test pass**
Run: `npx vitest run src/types/types.test.ts`
Expected: PASS

---

### Task 2: Tạo bộ dữ liệu khởi tạo `weaponMods.json` chuẩn Meta LDOE

**Files:**
- Create: `public/data/weaponMods.json`
- Test: `src/services/weaponModsData.test.ts`

**Interfaces:**
- Produces: `weaponMods.json` chứa danh sách bản độ của 6 vũ khí: `cleaver`, `machete`, `glock_17`, `m16`, `ak47`, `shotgun`.

- [ ] **Step 1: Viết test kiểm tra cấu trúc dữ liệu `weaponMods.json`**
Tạo `src/services/weaponModsData.test.ts`:
- Kiểm tra file JSON hợp lệ và không rỗng.
- Kiểm tra mọi mod đều trỏ tới 1 `weaponId` hợp lệ trong `items.json`.
- Kiểm tra mọi `materials` trong mod đều có `itemId` tồn tại trong `items.json` và `quantity > 0`.
- Kiểm tra các vũ khí Cleaver, Machete, Glock 17, M16, AK-47, Shotgun đều có bản mod.

- [ ] **Step 2: Chạy test để xác nhận test fail do chưa có file**
Run: `npx vitest run src/services/weaponModsData.test.ts`
Expected: FAIL

- [ ] **Step 3: Tạo `public/data/weaponMods.json`**
Xây dựng dữ liệu bản độ cho:
- `cleaver`: Slot `blade` (Tactical Butcher Blade, Heavy Blade, Hunter's Blade), Slot `handle` (Hunter Handle, Bone Handle, Reinforced Handle).
- `machete`: Slot `blade` (Gut Hook, Ripper Blade, Bone Blade), Slot `handle` (Bone Handle, Light Handle, Reinforced Handle).
- `glock_17`: Slot `muzzle` (Silencer, Muzzle Brake), Slot `magazine` (Extended Magazine, Large Magazine), Slot `sight` (Red Dot Sight, Laser Sight), Slot `grip` (Tactical Grip).
- `m16`: Slot `muzzle` (Muzzle Brake, Silencer), Slot `magazine` (Drum Magazine, Double Magazine), Slot `sight` (Red Dot Sight, 4x Scope), Slot `stock` (Tactical Stock, Heavy Stock), Slot `grip` (Grip).
- `ak47`: Slot `muzzle` (Muzzle Brake, Tactical Silencer), Slot `magazine` (Drum Magazine, Large Magazine), Slot `sight` (4x Scope, Red Dot Sight), Slot `stock` (Tactical Stock), Slot `grip` (Grenade Launcher, Tactical Knife, Ergonomic Grip).
- `shotgun`: Slot `muzzle` (Choke, Heavy Muzzle), Slot `grip` (Heavy Grip, Big Ammo / Spread), Slot `stock` (Tactical Stock).

- [ ] **Step 4: Chạy test để xác nhận dữ liệu chuẩn xác**
Run: `npx vitest run src/services/weaponModsData.test.ts`
Expected: PASS

---

### Task 3: Tích hợp Weapon Mods vào `dataLoader.ts` & `storageService.ts`

**Files:**
- Modify: `src/services/storageService.ts`
- Modify: `src/services/dataLoader.ts`
- Test: `src/services/dataLoader.test.ts`

**Interfaces:**
- Consumes: `public/data/weaponMods.json`, `customWeaponMods` từ `storageService`.
- Produces: `db.weaponMods`, `db.weaponModsMap`, `db.weaponModsByWeaponIdMap`.

- [ ] **Step 1: Viết test cho `dataLoader` nạp weaponMods**
Tạo hoặc mở rộng `src/services/dataLoader.test.ts` kiểm tra `loadGameData()` nạp `weaponMods`, lập map O(1) và gom nhóm theo `weaponId`.

- [ ] **Step 2: Chạy test để xác nhận fail**
Run: `npx vitest run src/services/dataLoader.test.ts`
Expected: FAIL

- [ ] **Step 3: Cập nhật `storageService.ts`**
Bổ sung `customWeaponMods: []` vào `EMPTY_OVERRIDES` và trong hàm `load()`.

- [ ] **Step 4: Cập nhật `dataLoader.ts`**
Nạp `data/weaponMods.json`, gộp với `overrides.customWeaponMods`, tạo `weaponModsMap` và `weaponModsByWeaponIdMap`.

- [ ] **Step 5: Chạy test để xác nhận pass**
Run: `npx vitest run src/services/dataLoader.test.ts`
Expected: PASS

---

### Task 4: Thư viện tính toán Mod `weaponModCalculator.ts`

**Files:**
- Create: `src/lib/calculators/weaponModCalculator.ts`
- Create: `src/lib/calculators/weaponModCalculator.test.ts`

**Interfaces:**
- Produces:
  - `calculateModdedStats(baseWeapon: Item, selectedMods: WeaponMod[]): ModdedWeaponResult`
  - `aggregateModMaterials(selectedMods: WeaponMod[]): Array<{ itemId: string; quantity: number }>`
  - `extractActiveSkills(selectedMods: WeaponMod[]): string[]`

- [ ] **Step 1: Viết failing test cho `weaponModCalculator.test.ts`**
Test tính sát thương tăng, tốc đánh thay đổi, độ bền cộng thêm, DPS tính lại, tổng hợp nguyên liệu gộp và lọc skill kích hoạt.

- [ ] **Step 2: Chạy test để xác nhận fail**
Run: `npx vitest run src/lib/calculators/weaponModCalculator.test.ts`
Expected: FAIL

- [ ] **Step 3: Cài đặt logic tính toán trong `src/lib/calculators/weaponModCalculator.ts`**
Cộng dồn stats, format làm tròn tốc đánh 2 chữ số thập phân, tính DPS = Damage * Speed, gom nguyên liệu trùng ID.

- [ ] **Step 4: Chạy test để xác nhận pass**
Run: `npx vitest run src/lib/calculators/weaponModCalculator.test.ts`
Expected: PASS

---

### Task 5: Xây dựng giao diện Bàn lắp ráp Mod `/wiki/weapon-mods`

**Files:**
- Create: `src/pages/encyclopedia/WeaponModsPage.tsx`
- Modify: `src/components/layout/navigation.ts`
- Modify: `src/App.tsx`
- Test: `src/pages/encyclopedia/WeaponModsPage.test.tsx`

**Interfaces:**
- Consumes: `useGameData()`, `weaponModCalculator`.
- Renders:
  - Bộ chọn vũ khí (Cận chiến / Súng / Tất cả).
  - Bàn lắp ráp theo Slot (Blade, Handle, Muzzle, Magazine, Sight, Grip, Stock...).
  - Thẻ Mod trực quan theo phẩm cấp (Trắng / Xanh / Tím), chỉ số tăng/giảm (+buff, -debuff), nguyên liệu.
  - Bảng tổng kết chỉ số (Base ➔ Modded, Delta, Active skills).
  - Nút "Đưa vào máy tính chiến đấu" và "Gom nguyên liệu".

- [ ] **Step 1: Viết component test cho `WeaponModsPage`**
Tạo `src/pages/encyclopedia/WeaponModsPage.test.tsx` kiểm tra render danh sách vũ khí, hiển thị slot, chọn mod và cập nhật chỉ số tổng kết.

- [ ] **Step 2: Chạy test để xác nhận fail**
Run: `npx vitest run src/pages/encyclopedia/WeaponModsPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Triển khai `WeaponModsPage.tsx`**
Xây dựng đầy đủ UX theo đặc tả thiết kế, bao gồm selector, slot builder, preview stats và action handlers.

- [ ] **Step 4: Cập nhật route trong `App.tsx` và menu trong `navigation.ts`**
Thêm menu item "Bản độ vũ khí" trong `NAV_SECTIONS` và đăng ký route `/wiki/weapon-mods`.

- [ ] **Step 5: Chạy test để xác nhận pass**
Run: `npx vitest run src/pages/encyclopedia/WeaponModsPage.test.tsx`
Expected: PASS

---

### Task 6: Tích hợp luồng tương tác chéo (Items ➔ Mods ➔ Combat / Planner)

**Files:**
- Modify: `src/pages/encyclopedia/ItemsPage.tsx`
- Modify: `src/pages/CombatCalculator.tsx`
- Modify: `src/pages/CraftingPlanner.tsx`
- Test: `src/lib/calculators/crossPageIntegration.test.ts`

**Interfaces:**
- `ItemsPage`: Nút "Độ vũ khí này" ➔ `/wiki/weapon-mods?weapon=${id}`.
- `CombatCalculator`: Nhận query param `customDamage` và tự động áp dụng.
- `CraftingPlanner`: Nhận danh sách nguyên liệu tổng hợp qua URL param `materials` hoặc gom nguyên liệu.

- [ ] **Step 1: Viết test tích hợp logic liên kết chéo**
Tạo `src/lib/calculators/crossPageIntegration.test.ts` kiểm thử chuyển đổi query params `customDamage` cho CombatCalculator và danh sách `materials` cho CraftingPlanner.

- [ ] **Step 2: Chạy test để xác định điểm cần xử lý**
Run: `npx vitest run src/lib/calculators/crossPageIntegration.test.ts`
Expected: FAIL

- [ ] **Step 3: Cập nhật `ItemsPage.tsx`**
Bổ sung nút "Độ vũ khí này" trong phần chi tiết vũ khí nếu vũ khí có bản độ trong `db.weaponModsByWeaponIdMap`.

- [ ] **Step 4: Cập nhật `CombatCalculator.tsx`**
Đọc param `customDamage` từ `searchParams` khi mount/thay đổi param và gán vào `customDamage` state.

- [ ] **Step 5: Cập nhật `CraftingPlanner.tsx`**
Hỗ trợ hiển thị danh sách nguyên liệu chuyển từ bản độ vũ khí sang (nhận `materials` dạng `id:qty,id:qty` và tiêu đề), cho phép survivor kiểm tra kho đồ và tick checklist.

- [ ] **Step 6: Chạy test tích hợp và toàn bộ test suite**
Run: `npm test`
Expected: Toàn bộ test suite pass.

---

### Task 7: Kiểm thử tổng thể & Hoàn thiện xác minh

**Files:**
- Run: `npm run build`
- Run: `npm test`

- [ ] **Step 1: Chạy toàn bộ test suite**
Run: `npm test`
Expected: Tất cả test files đều PASS.

- [ ] **Step 2: Chạy lệnh build kiểm tra compile & bundle**
Run: `npm run build`
Expected: Build thành công không có lỗi type error hay bundling error.
