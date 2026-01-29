import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // Pastikan path ini sesuai dengan file supabase kamu

export default function ProfileAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const MEMBER_ID = 1; // ID User yang sedang login (Ganti nanti jika sudah ada sistem Login)

  // 1. Ambil Foto saat komponen dimuat
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
        console.warn('Gagal ambil profil:', error.message);
      } else if (data && data.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 2. Fungsi Upload Foto
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih gambar dulu!');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${MEMBER_ID}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // A. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Pastikan nama bucket ini sesuai Langkah 1
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // B. Dapatkan URL Publik
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // C. Simpan URL ke Database
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: publicUrl })
        .eq('id', MEMBER_ID);

      if (updateError) {
        throw updateError;
      }

      // D. Update tampilan
      setAvatarUrl(publicUrl);
      alert('Foto profil berhasil diperbarui!');

    } catch (error: any) {
      alert('Gagal upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm mx-auto">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xl">
            {/* Inisial Default jika belum ada foto */}
            DS 
          </div>
        )}
      </div>

      {/* Tombol Upload (Hanya muncul saat kursor diarahkan/hover) */}
      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xs opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
        {uploading ? '...' : 'Ganti'}
        <input
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}