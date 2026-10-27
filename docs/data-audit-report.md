# Báo cáo đối chiếu và chuẩn hóa dữ liệu Last Day on Earth (LDoE)

Ngày cập nhật: 2026-10-26  
Phiên bản mục tiêu: **v1.52.99** (Late 2026 Meta)  
Phạm vi: Toàn bộ dữ liệu game trong `public/data/*.json` và các type/giao diện liên quan.

---

## 1. Nguồn đối chiếu chuẩn

1. **LDoE Fandom Wiki**: `https://last-day-on-earth-survival.fandom.com/wiki/Last_Day_on_Earth:_Survival_Wiki`
2. **Kefir Support (Helpshift)**: `https://kefirgames.helpshift.com/hc/en/5-last-day-on-earth/`
3. **Kefir Dev Blog**: `https://kefirgames.com/dev-blog/last-day-on-earth`

---

## 2. Các đợt điều chỉnh & chuẩn hóa

### Đợt 1: Xử lý lỗi Schema, Type TypeScript & Dữ liệu bịa đặt (Fake Data)
- **Chuẩn hóa danh mục Item (`items.json`)**: Sửa 10 mục mang type union sai (`resource_wood`, `resource_metal`, `resource_basic`, `weapon_ranged` $\rightarrow$ `resource_raw`, `resource_processed`, `weapon_firearm`).
- **Gỡ bỏ công thức chế tạo sai (`recipes.json`)**: Loại bỏ 42 công thức chế tạo workbench ảo tưởng cho vũ khí Genesis (Equalizer, Neutralizer,...), vũ khí Anti-Spore, súng phun lửa Flamethrower, cưa máy Chainsaw, trực thăng Mi-24. Đánh dấu `craftable: false` trong `items.json`.
- **Thêm danh mục `machine` vào Enemy Category**: Phân loại súng máy tự động (`turret`) và súng máy hạng nặng (`heavy_turret`) thành `machine` thay vì `human`.
- **Gỡ bỏ Active Skill cận chiến hư cấu (`weaponMods.json`)**: Gỡ "Whirlwind Slash", "Deep Gouge", "Tearing Thrust" ở Cleaver, Machete, Spear; giữ nguyên Active Skills chính thống trên súng (AK-47 grenade, Glock leg shot, Shotgun spread).
- **Chuẩn hóa timer bản đồ**: Sửa Bunker Bravo về 48h, Port về 72h, Abandoned Factory về 48h.

---

### Đợt 2: Nâng cấp đồng bộ theo meta phiên bản mới nhất v1.52.99

#### 2.1. Cải tiến Nông Trại Crooked Creek Farm (v1.52 Farm Rework)
* **Chìa khóa chuồng Barn Key (`barn_key`)**:
  * Tỷ lệ rớt: **100% Guaranteed Drop** từ trùm The Ravager (thay vì cơ chế random mở cửa chuồng của các bản beta cũ).
  * Công dụng: Mở cửa chuồng lớn chứa rương kho báu nông trại và xác xe máy chứa bình xăng / linh kiện Chopper.
* **Cơ chế Cưa Hòm Xanh (Blue Crate)**:
  * Máy cưa khi hoạt động phát ra tiếng ồn liên tục, thu hút các đợt zombie tràn vào tấn công theo đợt suốt thời gian cắt.
* **Quái thú mới - Bò nhiễm bệnh (`infected_bull`)**:
  * Máu: 800 HP, phân loại `wildlife`.
  * Cơ chế: Húc càn gây sát thương cực lớn lên cả người chơi lẫn zombie trên đường chạy.
* **Boss The Ravager**:
  * Cập nhật đòn phun máu làm thối rữa và hỏng giáp trang bị của người chơi.

#### 2.2. Vùng đầm lầy mới - Boggy Region (v1.51 - v1.52)
* **Khu vực & Địa điểm mới**:
  * `western_watchtower`: Tháp canh phía Tây, được canh giữ bởi Boss dị biến bức xạ `alpha_irradiator`.
  * `wild_bogs`: Đầm lầy hoang dã chứa quặng Peat và rêu đầm lầy, yêu cầu xe ATV lội nước.
  * `swamp_forest`: Rừng đầm lầy - nơi duy nhất khai thác gỗ tần bì (`ash_log`) bằng máy cưa Chainsaw.
  * `leviathans_lair`: Hang ổ Boss tối thượng vùng đầm lầy - Thủy quái `leviathan`.
* **Tài nguyên mới đặc hữu v1.52**:
  * `ash_log` & `ash_plank`: Gỗ tần bì và ván gỗ tần bì dùng nâng cấp tường cấp 5 và chế tạo công nghệ cao.
  * `antimony`: Kim loại quý Antimon tinh luyện đầm lầy.
  * `corn`: Ngô đầm lầy dùng nấu nướng và ép cồn nhiên liệu sinh học.
  * `alligator_skin`: Da cá sấu đầm lầy dùng đóng giáp chống đầm lầy.
  * `genome_points`: Mẫu gen dị biến dùng nâng cấp cây kỹ năng tiến hóa.
* **Cơ chế xe ATV v1.52**:
  * Hệ thống 4 module nâng cấp ATV: `atv_module_engine`, `atv_module_tires`, `atv_module_suspension`, `atv_module_cargo_bed`.
  * Hệ thống cấp độ ATV (`atv_upgrade_station`).

#### 2.3. Khu vực phương Bắc (Northern Cold Region Update)
* **Cập nhật danh sách bản đồ chuẩn**:
  * Loại bỏ `oak_grove` (đã bị gỡ khỏi bản đồ thế giới từ v1.30+).
  * Giữ vững các địa điểm chính thống: `northern_watchtower` (Tháp canh phương Bắc canh giữ bởi Boss `screech`), `oak_bushes`, `wooded_foothills`, `quarantine_zone`, `frosty_backwoods`.

#### 2.4. Hệ thống bạn đồng hành mới (Companions System v1.49 - v1.52.99)
* **Chó Robot vận tải (`robodog`)**:
  * Trợ thủ robot đi theo chuyên mang vác trang bị và hỗ trợ hỏa lực.
  * Cơ chế hoạt động: Tiêu hao pin Drone Battery (`drone_battery`), sạc và bảo dưỡng tại Trạm tiếp nhiên liệu Robodog (`robodog_docking_station`).
* **Hệ thống mèo cưng (`cat_playpen`, `cat_tree`)**:
  * Chuồng mèo và cây leo cho mèo, thuần hóa và nuôi dưỡng bằng cá tươi đánh bắt từ Fishing Spot.

#### 2.5. Con đường sống sót - Survivor's Path (12 Chương chính thức)
Thay thế toàn bộ chuỗi nhiệm vụ thử nghiệm cũ bằng **12 Chương cốt truyện chính thức** chuẩn game hiện hành:
1. **Chương 1: Khởi đầu mới (New Beginning)** - Làm quen sinh tồn, xây nhà, học chế tạo cơ bản.
2. **Chương 2: Bạn thân thiết (True Friend)** - Xây chuồng chó, tìm cún con và nhân giống.
3. **Chương 3: Bắn cường lực (Powershot)** - Đột nhập Bunker Alfa, thu thập vũ khí súng.
4. **Chương 4: Chiến binh sắt thép (Iron Warrior)** - Khai thác mỏ sắt, tinh luyện thỏi sắt và đúc đinh.
5. **Chương 5: Tiến về phương Bắc (North)** - Mở khóa Tháp canh phương Bắc, khám phá rừng tuyết.
6. **Chương 6: Hướng ra biển lớn (Off to New Shores)** - Đóng Ca-nô Motorboat, thám hiểm Cảng Port và đầm than bùn.
7. **Chương 7: Quần đảo hoang sơ (Islands)** - Khám phá các đảo xa, Đảo Chết (Dead Island), khai thác Titanium.
8. **Chương 8: Những chuyến viễn chinh (Expeditions)** - Xây dựng Đội biệt kích và thám hiểm viễn chinh.
9. **Chương 9: Xây dựng Định cư (Settlement)** - Thành lập khu tái định cư cộng đồng, xây xưởng phát triển.
10. **Chương 10: Mạng lưới công kỹ nghệ (Engineering Networks)** - Cung cấp điện lưới, đường ống nước và công nghiệp hóa.
11. **Chương 11: Yểm trợ đường không (Air Support)** - Xây dựng căn cứ Drone, phóng máy bay không người lái trinh sát.
12. **Chương 12: Viễn chinh đầm lầy (Boggy Expedition)** - Hoàn thiện xe ATV, thâm nhập vùng đầm lầy Wild Bogs và tiêu diệt Leviathan.

#### 2.6. Bổ sung toàn diện công thức các Bàn chế tạo (Workstations Recipes)
Chuẩn hóa và lấp đầy toàn bộ công thức gia công/chế biến tại các bàn chế tạo chính thức từ LDoE Wiki (không bịa đặt):
- **Lửa trại (Campfire)**:
  - Nướng thịt: 1 Thịt sống (`raw_meat`) $\rightarrow$ 1 Bít tết chín (`steak`) (120s).
  - Nấu súp: 2 Cà rốt (`carrot`) $\rightarrow$ 1 Súp cà rốt (`carrot_stew`) (120s).
  - Hãm trà: 3 Quả mọng (`berry`) $\rightarrow$ 1 Trà quả mọng (`berry_tea`) (120s).
  - Nướng gà tây: 1 Gà tây sống (`raw_turkey`) $\rightarrow$ 1 Gà tây nướng (`roasted_turkey`) (2400s).
  - Đốt than: 1 Gỗ thông $\rightarrow$ 1 Than củi; 1 Ván thông $\rightarrow$ 2 Than củi (240s).
- **Bàn cưa gỗ (Woodworking Bench)**:
  - 1 Gỗ thông (`pine_log`) $\rightarrow$ 1 Ván thông (`pine_plank`) (240s).
  - 3 Gỗ sồi (`oak_log`) $\rightarrow$ 1 Ván sồi (`oak_plank`) (1200s).
  - 5 Gỗ tần bì (`ash_log`) $\rightarrow$ 1 Ván tần bì (`ash_plank`) (1800s).
- **Bàn cắt đá (Stonecutter's Table)**:
  - 2 Đá vôi (`limestone`) $\rightarrow$ 1 Gạch đá (`stone_brick`) (240s).
- **Lò nung (Melting Furnace)**:
  - 2 Quặng sắt (`iron_ore`) $\rightarrow$ 1 Sắt thỏi (`iron_bar`) (240s).
  - 4 Sắt vụn (`scrap_metal`) $\rightarrow$ 1 Sắt thỏi (`iron_bar`) (240s).
  - 4 Dây nhôm (`aluminium_wire`) $\rightarrow$ 1 Nhôm thỏi (`aluminium_bar`) (1560s).
  - 4 Bauxite (`bauxite`) $\rightarrow$ 1 Nhôm thỏi (`aluminium_bar`) (3600s).
  - 5 Quặng đồng (`copper_ore`) $\rightarrow$ 1 Đồng thỏi (`copper_bar`) (3600s).
- **Lò nung tinh chế (Refined Melting Furnace)**:
  - 1 Sắt thỏi + 1 Nhôm thỏi + 1 Đồng thỏi + 2 Than củi $\rightarrow$ 1 Thép thỏi (`steel_bar`) (5400s).
- **Bàn cơ khí gia công kim loại (Workbench)**:
  - 1 Sắt thỏi $\rightarrow$ 1 Sắt tấm (`iron_plate`) (1200s).
  - 1 Sắt thỏi $\rightarrow$ 2 Đinh (`nails`) (120s).
  - 2 Nhôm thỏi $\rightarrow$ 1 Nhôm tấm (`aluminium_plate`) (3600s).
  - 1 Thép thỏi $\rightarrow$ 1 Thép tấm (`steel_plate`) (5400s).
- **Bàn may (Sewing Table)**:
  - 2 Sợi thực vật (`plant_fiber`) $\rightarrow$ 1 Vải sợi (`cloth`) (120s).
  - 2 Vải sợi (`cloth`) $\rightarrow$ 1 Vải dày (`thick_fabric`) (120s).
  - 2 Lông cừu len (`piece_of_wool`) $\rightarrow$ 1 Vải len (`woolen_fabric`) (120s).
- **Khung thuộc da (Tanning Rack)**:
  - 1 Da thú thô (`raw_hide`) $\rightarrow$ 1 Da thuộc (`leather`) (240s).
  - 2 Sợi thực vật (`plant_fiber`) $\rightarrow$ 1 Dây thừng (`rope`) (20s).
  - 1 Lông thú (`fur`) $\rightarrow$ 1 Lông thú thuộc (`tanned_fur`) (240s).
- **Giá phơi thịt (Meat Dryer)**:
  - 1 Thịt sống (`raw_meat`) $\rightarrow$ 1 Thịt khô (`jerky`) (600s).
- **Bàn y tế (Medical Table)**:
  - 5 Quả mọng (`berry`) $\rightarrow$ 1 Cồn y tế (`alcohol`) (600s).
  - 2 Rong biển (`seaweed`) $\rightarrow$ 1 Cồn I-ốt (`iodine`) (600s).
- **Máng hứng nước mưa (Rain Catcher)**:
  - 1 Chai rỗng (`empty_bottle`) $\rightarrow$ 1 Chai nước đầy (`bottle_of_water`) (600s).
- **Luống rau (Garden Bed)**:
  - 1 Hạt giống cà rốt (`carrot_seeds`) $\rightarrow$ 2 Cà rốt (`carrot`) (3600s).
  - 1 Hạt giống ngô (`corn_seeds`) $\rightarrow$ 1 Ngô đầm lầy (`corn`) (5400s).
- **Máy ép (Pressing Machine)**:
  - 3 Quặng chì (`lead_ore`) $\rightarrow$ 1 Tấm chì (`lead_plate`) (3600s).
  - 20 Gioăng cao su (`rubber_parts`) $\rightarrow$ 1 Khối cao su đúc (`rubber`) (3600s).
  - 3 Than bùn (`peat`) $\rightarrow$ 1 Bánh than bùn ép (`fuel_briquette`) (1200s).
  - 15 Sắt vụn (`scrap_metal`) $\rightarrow$ 1 Sắt tấm (`iron_plate`) (1200s).
- **Trạm hóa chất (Chemistry Station)**:
  - 20 Lưu huỳnh (`sulfur`) + 20 Than củi (`charcoal`) $\rightarrow$ 1 Thuốc súng (`gunpowder`) (5400s).
  - 10 Lưu huỳnh (`sulfur`) + 20 Chai nước (`bottle_of_water`) $\rightarrow$ 1 Axit (`acid`) (3600s).
- **Hệ thống thủy canh (Hydroponic System)**:
  - 3 Mầm cây (`sprouts`) $\rightarrow$ 1 Gia vị (`spice`) (5400s).
- **Bếp gas nấu ăn (Kitchen Stove)**:
  - Cá trê xào rau củ: 1 Cá trê (`catfish`) + 1 Cà rốt + 1 Nấm $\rightarrow$ Tăng tỉ lệ câu cá hiếm.
  - Cá chó sốt nấm: 1 Cá chó (`pike`) + 1 Rượu mạnh + 1 Nấm $\rightarrow$ Tăng tốc độ chạy.
  - Cá chó nhồi: 1 Cá chó (`pike`) + 1 Ngô + 1 Cà rốt + 1 Nấm $\rightarrow$ Giảm hao năng lượng di chuyển bản đồ.
  - Hỗn hợp cá nướng: 1 Cá rô + 1 Cá chép + 1 Cá hồi $\rightarrow$ +10 điểm giáp trong 10 phút.

---

## 3. Kết quả kiểm thử và toàn vẹn dữ liệu

- **Thống kê dữ liệu chuẩn hóa**:
  - Vật phẩm (Items): 308 items.
  - Kẻ địch (Enemies): 23 kẻ địch & trùm.
  - Địa điểm (Locations): 42 bản đồ.
  - Công thức (Recipes): 160 công thức chuẩn.
  - Phụ kiện vũ khí (Weapon Mods): 49 mods.
  - Công trình (Structures): 11 công trình.
  - Nhiệm vụ (Quests): 13 nhiệm vụ (12 chương cốt truyện chính thức Survivor's Path).
- **Toàn vẹn khóa ngoại (Cross-References)**:
  - 100% item ID, recipe ID, enemy ID, location ID, structure ID khớp chéo nhau; không tồn tại item vô thừa nhận hoặc kẻ địch không có bản đồ.
- **Vitest Unit Tests**:
  - `17 passed (17 files)`
  - `84 passed (84 tests)`
- **TypeScript & Vite Build**:
  - `tsc -b && vite build` hoàn thành với exit code 0, không có lỗi kiểu dữ liệu.
