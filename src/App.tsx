// Di dalam App.tsx (Ubah importnya)

// YANG LAMA (Membingungkan):
// import Member from './Member';
// import Members from './Members';

// YANG BARU (Jelas):
import MyCard from './MyCard';       // Dulunya Member.tsx
import AdminDatabase from './AdminDatabase'; // Dulunya Members.tsx

// ... lalu ubah di <Route>:
<Route path="members" element={<AdminDatabase />} />
<Route path="my-card" element={<MyCard />} />