# Execution Ledger: Location Mechanics & Chopper Upgrade

**Plan:** `docs/superpowers/plans/2026-10-26-location-mechanics-chopper-upgrade.md`  
**Started:** 2026-10-26T13:59:00+07:00  
**Status:** In Progress  

## Task Status
- [x] Task 1: Mở rộng Kiểu dữ liệu & Bổ sung Item Phụ tùng Xe máy
- [x] Task 2: Cập nhật Cơ sở Dữ liệu Địa điểm & Công trình (`locationStructures.json`)
- [x] Task 3: Xây dựng Engine Tính toán Nâng cấp Chopper (TDD)
- [x] Task 4: Xây dựng Giao diện Trang Công cụ Nâng cấp Chopper (`ChopperCalculator.tsx`)
- [x] Task 5: Cập nhật Trang Địa điểm (`LocationsPage.tsx`) & Máy tính Công trình (`ConstructionCalculator.tsx`)
- [x] Task 6: Kiểm thử Toàn diện & Xác thực (Verification)

## Decisions and Rulings
* Ruling: Chopper Level EXP formula calibrated so Level 1 requires 1500 EXP, Level 42 requires exactly 4500 EXP (matching screenshot), and Level 100 is max cap.
* Ruling: Differentiated one_time vs recurring structures so ConstructionCalculator handles staged builds while ChopperCalculator handles daily turn-ins and perks. LocationsPage smoothly bridges both with distinct badges and buttons.

