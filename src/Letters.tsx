const handleSaveIncoming = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!inForm.file) return alert("Mohon pilih file surat terlebih dahulu!");
  
  setUploading(true);
  try {
    // 1. Bersihkan nama file dari spasi/karakter aneh
    const fileExt = inForm.file.name.split('.').pop();
    const fileName = `incoming/${Date.now()}_surat_masuk.${fileExt}`;

    // 2. Proses Upload dengan cek Error
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('letters-archive')
      .upload(fileName, inForm.file);

    if (uploadError) {
      throw new Error("Gagal upload ke Storage: " + uploadError.message);
    }

    // 3. Ambil URL Publik
    const { data: urlData } = supabase.storage
      .from('letters-archive')
      .getPublicUrl(fileName);
      
    const fileUrl = urlData.publicUrl;

    // 4. Simpan ke Database (Mapping kolom secara manual agar aman)
    const { error: dbError } = await supabase.from('letters_in').insert([
      { 
        date_received: inForm.date_received,
        sender: inForm.sender,
        subject: inForm.subject,
        letter_number: inForm.letter_number,
        file_url: fileUrl 
      }
    ]);

    if (dbError) throw dbError;
    
    alert('Surat Masuk Berhasil Diarsipkan!');
    setShowInModal(false);
    setInForm({ date_received: new Date().toISOString().split('T')[0], sender: '', subject: '', letter_number: '', file: null });
    fetchData(); 
  } catch (err: any) { 
    alert('Error: ' + err.message); 
    console.error(err);
  } finally { 
    setUploading(false); 
  }
};