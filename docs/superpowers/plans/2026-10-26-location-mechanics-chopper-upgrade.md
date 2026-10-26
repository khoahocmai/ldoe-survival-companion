# Location Mechanics & Chopper Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống Công trình & Cơ chế Địa điểm mở rộng (hỗ trợ cả 2 dạng: `one_time` vĩnh viễn/1 lần và `recurring` định kỳ có reset), triển khai toàn diện công cụ Nâng cấp xe Chopper (Jane Mechanic ở Gas Station), và bổ sung công trình Ống cống ngầm Port Sewer (The Port).

**Architecture:** 
- Mở rộng kiểu dữ liệu `LocationStructure` trong `src/types/index.ts` để hỗ trợ `frequency: 'one_time' | 'recurring'` cùng `cycleConfig` linh hoạt (chu kỳ reset, danh sách nguyên liệu nộp kèm daily limit, exp/points, khuyến nghị tier kinh tế và perk guide).
- Bổ sung các phụ tùng xe máy còn thiếu (`chopper_fork`, `chopper_gas_tank`, `chopper_magazine`) vào `public/data/items.json`.
- Cập nhật `public/data/locationStructures.json` bổ sung cơ chế định kỳ `struct_gas_station_chopper` (Gas Station Jane Workshop) và công trình 1 lần `struct_port_sewer_pipes` (The Port).
- Xây dựng engine tính toán thuần túy `src/lib/calculators/chopperCalculator.ts` kèm bộ kiểm thử `chopperCalculator.test.ts` (kiểm tra tính EXP, lên cấp, cảnh báo lãng phí tài nguyên quý, gợi ý combo rác tối ưu).
- Xây dựng giao diện trang công cụ `src/pages/ChopperCalculator.tsx`, đăng ký route `/chopper` và điều hướng trong `src/components/layout/navigation.ts` và `src/App.tsx`.
- Cập nhật trang `LocationsPage.tsx` và `ConstructionCalculator.tsx` để phân loại trực quan công trình 1 lần vs định kỳ có reset, hiển thị nút dẫn trực tiếp sang công cụ nâng cấp.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, React Router v6, Vitest.

**Spec:** Thiết kế thống nhất về 2 trường phái tương tác nộp đồ tại địa điểm (`one_time` vs `recurring`), chi tiết cơ chế Jane tại Trạm Xăng (bảng 12 nguyên liệu, EXP, daily cap, tier cảnh báo tài nguyên, perk priority).

## Global Constraints
- Duy trì 100% kiểm thử tự động Vitest không bị phá vỡ (toàn bộ test files hiện tại và mới đều pass).
- Tuân thủ nghiêm ngặt design system của ứng dụng: CSS semantic tokens (`bg-surface`, `bg-subtle`, `border-line`, `text-muted`, `accent`, `ok`, `warn`, `danger`), không lặp `dark:` thủ công.
- Hỗ trợ tốt trên cả màn hình Desktop và Mobile responsive.
- Giữ nguyên dữ liệu địa điểm và công trình hiện có, chỉ mở rộng thêm tính năng.

## Review Focus
1. Cấp xe Chopper và EXP: Tính toán chính xác khi người chơi nhập cấp bất kỳ (1-100), EXP hiện tại, nộp vật liệu nhiều cấp nhảy vọt không bị lỗi tràn số hay sai số.
2. Cảnh báo đồ hiếm: Khi người chơi chọn nộp Đồng (Copper Bar), Nhôm tấm (Aluminum Plate), Linh kiện động cơ (Engine Parts), Lò xo (Springs) phải hiển thị Callout cảnh báo rõ ràng.
3. Nút tiện ích "Max hạn mức" và "Chọn combo đồ rác": Tự động điền đúng giới hạn ngày mà không nộp nhầm đồ hiếm.
4. Trang Bách khoa Địa điểm (`/wiki/locations`): Khi xem Gas Station và The Port, hiển thị badge phân loại rõ `[Vĩnh viễn]` vs `[Định kỳ · Reset 24h]` và nút hành động thích hợp.
5. `npm run test` và `npm run build` chạy thành công không có lỗi TypeScript hay Vite build.

---

### Task 1: Mở rộng Kiểu dữ liệu & Bổ sung Item Phụ tùng Xe máy

**Files:**
- Modify: `src/types/index.ts`
- Modify: `public/data/items.json`
- Modify: `src/types/types.test.ts`

- [ ] **Step 1: Viết test kiểm tra kiểu dữ liệu `LocationStructure` mở rộng và item phụ tùng xe**
  Cập nhật `src/types/types.test.ts` để kiểm tra các trường `frequency`, `cycleConfig` của `LocationStructure`, và xác nhận các phụ tùng xe máy (`chopper_wheel`, `chopper_fork`, `chopper_gas_tank`, `chopper_magazine`) có mặt trong `items.json`.

- [ ] **Step 2: Chạy test để xác nhận test fail**
  Run: `npx vitest run src/types/types.test.ts`
  Expected: FAIL vì `chopper_fork`, `chopper_gas_tank`, `chopper_magazine` chưa có trong `items.json`.

- [ ] **Step 3: Cập nhật `src/types/index.ts`**
  Thêm `StructureFrequency = 'one_time' | 'recurring'`, mở rộng `LocationStructure` với `frequency?: StructureFrequency` và `cycleConfig`.

- [ ] **Step 4: Bổ sung phụ tùng xe máy vào `public/data/items.json`**
  Thêm `chopper_fork` (Chopper Fork / Ghi-đông xe máy), `chopper_gas_tank` (Chopper Gas Tank / Bình xăng Chopper), `chopper_magazine` (Chopper Magazine / Tạp chí xe máy).

- [ ] **Step 5: Chạy test để xác nhận test pass**
  Run: `npx vitest run src/types/types.test.ts`
  Expected: PASS

---

### Task 2: Cập nhật Cơ sở Dữ liệu Địa điểm & Công trình (`locationStructures.json`)

**Files:**
- Modify: `public/data/locationStructures.json`
- Modify: `src/services/dataLoader.test.ts`

- [ ] **Step 1: Viết test kiểm tra nạp dữ liệu công trình định kỳ**
  Cập nhật `src/services/dataLoader.test.ts` để xác minh `locationStructures` nạp thành công các cấu trúc cả `one_time` và `recurring`.

- [ ] **Step 2: Cập nhật `public/data/locationStructures.json`**
  - Thêm trường `frequency: "one_time"` cho các công trình hiện có (Northern Watchtower, Farm Bridge, Bunker Terminal, Eastern Watchtower, Swamp Watchtower, Port Sewer Elevator, Transport Hub Bridge).
  - Thêm công trình 1 lần: `struct_port_sewer_pipes` tại `port` (Sửa các đoạn ống nước cống ngầm).
  - Thêm cơ chế định kỳ: `struct_gas_station_chopper` tại `gas_station` (Gara xe máy Jane: chu kỳ 24h, 12 acceptedItems với EXP, dailyLimit, tier và note).

- [ ] **Step 3: Chạy test để xác nhận test pass**
  Run: `npx vitest run src/services/dataLoader.test.ts`
  Expected: PASS

---

### Task 3: Xây dựng Engine Tính toán Nâng cấp Chopper (TDD)

**Files:**
- Create: `src/lib/calculators/chopperCalculator.ts`
- Create: `src/lib/calculators/chopperCalculator.test.ts`

- [ ] **Step 1: Viết test suite cho `chopperCalculator.test.ts`**
  Test các hàm:
  - `getChopperLevelRequiredExp(level)`: kiểm tra công thức EXP các cấp.
  - `calculateChopperUpgrade(params)`:
    - Nộp đủ EXP lên 1 cấp (tính đúng cấp mới, EXP còn lại, số lần chọn perk).
    - Nộp nhiều EXP nhảy nhiều cấp (multi-level jump).
    - Giới hạn cấp tối đa (Level 100 max cap).
    - Quét phát hiện cảnh báo nộp tài nguyên quý hiếm (`warnings` cho copper_bar, aluminum_plate, engine_part, spring).
    - Hàm gợi ý combo đồ rác tối ưu (`getOptimalJunkCombo`).

- [ ] **Step 2: Chạy test để xác nhận test fail**
  Run: `npx vitest run src/lib/calculators/chopperCalculator.test.ts`
  Expected: FAIL vì file chưa được implement.

- [ ] **Step 3: Triển khai code `src/lib/calculators/chopperCalculator.ts`**
  Xây dựng đầy đủ logic tính toán, công thức EXP chuẩn LDOE, logic phát hiện cảnh báo, và combo tối ưu.

- [ ] **Step 4: Chạy test để xác nhận test pass**
  Run: `npx vitest run src/lib/calculators/chopperCalculator.test.ts`
  Expected: PASS

---

### Task 4: Xây dựng Giao diện Trang Công cụ Nâng cấp Chopper (`ChopperCalculator.tsx`)

**Files:**
- Create: `src/pages/ChopperCalculator.tsx`
- Modify: `src/components/layout/navigation.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Đăng ký Navigation và Route**
  - Thêm mục `Nâng cấp Chopper` (icon `Bike` / `Wrench`) vào nhóm "Công cụ" trong `NAV_SECTIONS` của `navigation.ts`.
  - Khai báo route `/chopper` trong `src/App.tsx`.

- [ ] **Step 2: Triển khai component `ChopperCalculator.tsx`**
  - Header: `PageHeader` kèm mô tả và link nhanh sang Trạm xăng Gas Station.
  - Cột trái:
    - Bảng thông tin xe hiện tại: Nhập Cấp (1-100), EXP hiện tại, thanh `ProgressBar`.
    - Lưới 12 vật phẩm Jane nhận (gồm ảnh `EntityImage`, tên, EXP cộng, ô nhập số lượng, nút `Max` điền nhanh, nhãn phân loại màu Xanh/Vàng/Đỏ).
  - Cột phải:
    - Thẻ thống kê tức thì: Tổng EXP hiến, cấp dự kiến sau nâng, số lần chọn Perk.
    - Hộp cảnh báo lãng phí tài nguyên (`Callout` đỏ/vàng khi nộp đồng/nhôm/máy móc).
    - Nút bấm *"Chọn nhanh combo đồ rác tối ưu"* (auto-fill bolts, bearings, iron plates).
    - Bảng cẩm nang Perks Tier List (Cốp xe S-Tier, Tiết kiệm xăng A-Tier, Bình xăng B-Tier, Sát thương C-Tier).

- [ ] **Step 3: Kiểm tra build và render**
  Run: `npm run build`
  Expected: Build thành công không có lỗi cú pháp hay TypeScript.

---

### Task 5: Cập nhật Trang Địa điểm (`LocationsPage.tsx`) & Máy tính Công trình (`ConstructionCalculator.tsx`)

**Files:**
- Modify: `src/pages/encyclopedia/LocationsPage.tsx`
- Modify: `src/pages/ConstructionCalculator.tsx`

- [ ] **Step 1: Cập nhật `LocationsPage.tsx`**
  - Trong panel chi tiết của từng địa điểm, duyệt danh sách công trình/cơ chế:
    - Nếu là `frequency === 'recurring'` (hoặc có `cycleConfig`): Hiển thị badge `[Định kỳ · Reset 24h]` màu tím/vàng và nút bấm *"Nâng cấp xe Chopper"* dẫn tới `/chopper`.
    - Nếu là `frequency === 'one_time'`: Hiển thị badge `[Vĩnh viễn]` màu xanh và nút *"Tính vật liệu"* dẫn tới `/construction?structure=...`.

- [ ] **Step 2: Cập nhật `ConstructionCalculator.tsx`**
  - Thêm badge phân loại `Vĩnh viễn` / `Định kỳ` cho danh sách dropdown các công trình.
  - Nếu người dùng chọn một công trình định kỳ (như Jane Chopper), hiển thị Callout gợi ý nút chuyển nhanh sang máy tính chuyên dụng `/chopper`.

- [ ] **Step 3: Chạy toàn bộ test suites**
  Run: `npm run test`
  Expected: Tất cả bài test đều PASS.

---

### Task 6: Kiểm thử Toàn diện & Xác thực (Verification)

**Files:**
- Toàn bộ codebase liên quan

- [ ] **Step 1: Chạy toàn bộ test Vitest**
  Run: `npm run test`
  Expected: 100% tests PASS (tất cả các test cũ + test mới).

- [ ] **Step 2: Chạy kiểm tra TypeScript và Production Build**
  Run: `npm run build`
  Expected: Thành công 0 lỗi.

- [ ] **Step 3: Kiểm tra giao diện và luồng hoạt động trên trình duyệt**
  Kiểm tra trang `/chopper`, trang `/wiki/locations` (Gas Station và The Port), và trang `/construction`.
