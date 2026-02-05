import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  User, Mail, Lock, Building, Save, AlertCircle, 
  CreditCard, Calendar, Phone, Briefcase, MapPin 
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk menampung SEMUA kolom database
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    npa: '',
    nik: '',
    nip: '',           // Opsional (bisa kosong)
    birth_place: '',
    birth_date: '',
    gender: 'Laki-laki', // Default
    phone: '',
    school_name: '',
    status: 'PNS',       // Default
    teacher_type: 'Guru Kelas' // Default
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Cek Duplikasi (Email, NPA, atau NIK tidak boleh sama)
      const { data: existingUser } = await supabase
        .from('members')
        .select('email, npa, nik')
        .or(`email.eq.${formData.email},npa.eq.${formData.npa},nik.eq.${formData.nik}`)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Email, NPA, atau NIK sudah terdaftar sebelumnya.');
      }

      // 2. Simpan ke Database
      const { error: insertError } = await supabase
        .from('members')
        .insert([
          {
            // Data Akun
            email: formData.email,
            username: formData.username, // Menggunakan input username
            password: formData.password,
            role: 'user',
            account_status: 'active',
            
            // Data Pribadi
            full_name: formData.full_name,
            npa: formData.npa,
            nik: formData.nik,
            nip: formData.nip || null, // Jika kosong biarkan null
            birth_place: formData.birth_place,
            birth_date: formData.birth_date,
            gender: formData.gender,
            phone: formData.phone,
            avatar_url: '', // Kosongkan dulu

            // Data Pekerjaan
            school_name: formData.school_name,
            status: formData.status,
            teacher_type: formData.teacher_type,
            
            created_at: new Date()
          }
        ]);

      if (insertError) {
        console.error('Error Insert:', insertError);
        throw new Error('Gagal menyimpan data. Silakan coba lagi.');
      }

      alert('Pendaftaran Berhasil! Silakan Login.');
      navigate('/login');

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-600 px-8 py-6 text-center text-white">
          <h1 className="text-3xl font-bold">Formulir Anggota Baru</h1>
          <p className="mt-1 text-blue-100">Lengkapi data diri Anda dengan data yang sebenarnya</p>
        </div>

        {error && (
          <div className="m-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" /> {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* --- BAGIAN 1: INFORMASI AKUN --- */}
          <div className="md:col-span-2 pb-2 border-b border-gray-200 mb-2">
            <h3 className="text-lg font-semibold text-gray-700">1. Informasi Akun</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Aktif</label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="email" name="email" required className="pl-10 w-full p-2 border rounded-md" 
                placeholder="nama@email.com" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <div className="mt-1 relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="text" name="username" required className="pl-10 w-full p-2 border rounded-md" 
                placeholder="Buat username unik" value={formData.username} onChange={handleChange} />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="password" name="password" required className="pl-10 w-full p-2 border rounded-md" 
                placeholder="Minimal 6 karakter" value={formData.password} onChange={handleChange} />
            </div>
          </div>


          {/* --- BAGIAN 2: DATA PRIBADI --- */}
          <div className="md:col-span-2 pb-2 border-b border-gray-200 mt-4 mb-2">
            <h3 className="text-lg font-semibold text-gray-700">2. Data Pribadi</h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nama Lengkap (Tanpa Gelar)</label>
            <input type="text" name="full_name" required className="w-full mt-1 p-2 border rounded-md" 
              placeholder="Contoh: Budi Santoso" value={formData.full_name} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">NIK (KTP)</label>
            <input type="text" name="nik" required maxLength={16} className="w-full mt-1 p-2 border rounded-md" 
              placeholder="16 digit NIK" value={formData.nik} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">NPA (Nomor Anggota PGRI)</label>
            <input type="text" name="npa" required className="w-full mt-1 p-2 border rounded-md" 
              placeholder="Masukkan NPA" value={formData.npa} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tempat Lahir</label>
            <div className="mt-1 relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="text" name="birth_place" required className="pl-10 w-full p-2 border rounded-md" 
                placeholder="Kota Kelahiran" value={formData.birth_place} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
            <div className="mt-1 relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="date" name="birth_date" required className="pl-10 w-full p-2 border rounded-md" 
                value={formData.birth_date} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
            <select name="gender" className="w-full mt-1 p-2 border rounded-md" value={formData.gender} onChange={handleChange}>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">No. HP / WhatsApp</label>
            <div className="mt-1 relative">
              <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="text" name="phone" required className="pl-10 w-full p-2 border rounded-md" 
                placeholder="628xxxxxxxxxx" value={formData.phone} onChange={handleChange} />
            </div>
          </div>


          {/* --- BAGIAN 3: DATA KEPEGAWAIAN --- */}
          <div className="md:col-span-2 pb-2 border-b border-gray-200 mt-4 mb-2">
            <h3 className="text-lg font-semibold text-gray-700">3. Data Kepegawaian</h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Unit Kerja (Nama Sekolah)</label>
            <div className="mt-1 relative">
              <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="text" name="school_name" required className="pl-10 w-full p-2 border rounded-md" 
                placeholder="Contoh: SDN Kalijaga Permai" value={formData.school_name} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">NIP (Jika Ada)</label>
            <input type="text" name="nip" className="w-full mt-1 p-2 border rounded-md" 
              placeholder="Kosongkan jika bukan PNS" value={formData.nip} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status Kepegawaian</label>
            <select name="status" className="w-full mt-1 p-2 border rounded-md" value={formData.status} onChange={handleChange}>
              <option value="PNS">PNS</option>
              <option value="PPPK">PPPK</option>
              <option value="GTY">GTY (Guru Tetap Yayasan)</option>
              <option value="Honorer">Honorer</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Jenis Tugas</label>
            <select name="teacher_type" className="w-full mt-1 p-2 border rounded-md" value={formData.teacher_type} onChange={handleChange}>
              <option value="Guru Kelas">Guru Kelas (SD)</option>
              <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
              <option value="Guru PJOK">Guru PJOK</option>
              <option value="Guru PAI">Guru PAI</option>
              <option value="Kepala Sekolah">Kepala Sekolah</option>
            </select>
          </div>

          {/* TOMBOL SUBMIT */}
          <div className="md:col-span-2 mt-6">
            <button type="submit" disabled={loading} 
              className="w-full py-3 bg-red-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition duration-200 flex justify-center items-center">
              {loading ? 'Sedang Menyimpan...' : (
                <>
                  <Save className="w-5 h-5 mr-2" /> Simpan Data Anggota
                </>
              )}
            </button>
          </div>

          <div className="md:col-span-2 text-center mt-4">
            <p className="text-gray-600">Sudah punya akun? <Link to="/login" className="text-red-600 font-bold hover:underline">Login disini</Link></p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;