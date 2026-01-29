import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Camera, Loader2 } from 'lucide-react';

export default function ProfileAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const MEMBER_ID = 1; 

  // Ambil data saat pertama kali dimuat
  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data } = await supabase
          .from('members')
          .select('avatar_url')
          .eq('id', MEMBER_ID)
          .single();
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      } catch (error) { console.error(error); }
    };
    getProfile();
  }, []);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${MEMBER_ID}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 2. Ambil Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 3. Simpan ke Database
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: data.publicUrl })
        .eq('id', MEMBER_ID);

      if (updateError) throw updateError;

      // 4. Update State Lokal
      setAvatarUrl(data.publicUrl);
      
      // 5. Reload halaman agar Header (Layout.tsx) juga terupdate fotonya
      window.location.reload();

    } catch (error: any) {
      alert('Gagal upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group mx-auto w-32 h-32">
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-300">
            <span className="text-4xl font-bold">DS</span>
          </div>
        )}
      </div>

      <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-indigo-700 transition-all border-2 border-white">
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
      </label>
    </div>
  );
}