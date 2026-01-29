import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function ProfileAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [debugMsg, setDebugMsg] = useState(''); // Untuk menampilkan pesan di layar

  // Pastikan ID ini ada di tabel 'members'. 
  // Kamu bisa cek di Supabase > Table Editor > members > kolom id.
  const MEMBER_ID = 1; 

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('avatar_url')
        .eq('id', MEMBER_ID)
        .single();

      if (error) {
        console.error('Gagal ambil data profil:', error);
      } else if (data && data.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setDebugMsg('Mulai proses...');

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Kamu belum memilih gambar!');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${MEMBER_ID}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // --- TAHAP 1: UPLOAD KE STORAGE ---
      alert('Langkah 1: Mencoba upload ke Storage...');
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Pastikan nama bucket di Supabase adalah 'avatars'
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('GAGAL di Storage: ' + uploadError.message);
      }

      // --- TAHAP 2: AMBIL LINK GAMBAR ---
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      alert('Langkah 2: Upload sukses. Link gambar didapat: ' + publicUrl);

      // --- TAHAP 3: SIMPAN LINK KE DATABASE ---
      alert('Langkah 3: Mencoba simpan link ke Database...');
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: publicUrl })
        .eq('id', MEMBER_ID);

      if (updateError) {
        throw new Error('GAGAL di Database: ' + updateError.message);
      }

      alert('BERHASIL TOTAL! Database sudah diupdate.');
      setAvatarUrl(publicUrl);
      setDebugMsg('Upload Berhasil!');

    } catch (error: any) {
      alert('TERJADI ERROR: ' + error.message);
      setDebugMsg('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group w-24 h-24">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm mx-auto bg-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500 font-bold text-xl">
              DS
            </div>
          )}
        </div>

        {/* Overlay tombol upload */}
        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xs opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
          {uploading ? '...' : 'Ganti Foto'}
          <input
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      {/* Pesan status untuk debugging */}
      <p className="text-xs text-red-600 font-mono text-center max-w-[200px]">{debugMsg}</p>
    </div>
  );
}