# Migration Notes & Technical Debt

Dokumen ini mencatat technical debt berupa casting `any` pada beberapa file komponen UI selama proses migrasi dari React + Vite ke Next.js 16 + Tailwind CSS v4. Ini bertujuan untuk menghindari build blocker dan harus diperiksa/dibersihkan sebelum aplikasi masuk ke tahap *production/go-live*.

## Daftar Komponen dengan Casting `any`

### 1. `src/components/ui/calendar.tsx`
* **Alasan Cast**: `react-day-picker` versi 9 memiliki perubahan interface yang signifikan (khususnya penamaan properti di dalam `classNames` dan `components`) dibandingkan shadcn UI template standar yang dikonfigurasi untuk versi 8.
* **Tindakan**:
  - `classNames` di-cast menggunakan `as any`.
  - Properti `components` di-cast menggunakan `as any` dan argumen callback `IconLeft`/`IconRight` diberi tipe `: any` untuk menghindari warning implicit `any` pada mode strict compiler.
* **Status Visual**: Diverifikasi aman dan stabil di layout halaman utama.

### 2. `src/components/ui/chart.tsx`
* **Alasan Cast**: library `recharts` (v3) mengalami perubahan tipe generics pada elemen `Tooltip` dan `LegendProps`, sehingga property generic `payload` dan `verticalAlign` tidak terdeteksi valid pada interface JSX wrapper shadcn.
* **Tindakan**:
  - Props `ChartTooltipContent` di-cast ke `: any`.
  - Callback map `payload.map((item: any, index: number))` di-cast ke `: any`.
  - Props `ChartLegendContent` di-cast ke `: any` dan callback map `payload.map((item: any))` di-cast ke `: any`.
* **Status Visual**: Diverifikasi aman dan stabil di halaman Dashboard Overview.

### 3. `src/components/ui/resizable.tsx`
* **Alasan Cast**: Namespace module `react-resizable-panels` gagal ter-resolve secara statis di bawah compiler TypeScript Next.js karena module resolution bundler, menyebabkan error `PanelGroup` does not exist on type.
* **Tindakan**:
  - Mengimpor wildcard `* as ResizablePrimitive` dan mengambil child components secara dinamis melalui cast `(ResizablePrimitive as any).PanelGroup`, `(ResizablePrimitive as any).Panel`, dan `(ResizablePrimitive as any).PanelResizeHandle`.
* **Status Visual**: Komponen resizable panel group belum digunakan secara visual pada UI customer dashboard.

### 4. `src/app/dashboard/perjalanan/IndonesiaMap.tsx`
* **Alasan Cast**: Object prototype `L.Icon.Default` dari library Leaflet tidak mengekspos metode internal `_getIconUrl` secara publik dalam TypeScript definitions, sehingga terjadi type error saat didelete untuk mengesampingkan path default.
* **Tindakan**:
  - Properti `_getIconUrl` di-cast ke `: any` sebelum dihapus: `delete (L.Icon.Default.prototype as any)._getIconUrl;`.
* **Status Visual**: Diverifikasi sangat baik dan stabil pada modul pemantauan perjalanan.

