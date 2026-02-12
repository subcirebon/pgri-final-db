import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Phone, Edit, Trash2, FileSpreadsheet, Loader2, 
  Mail, School, CreditCard, User, Calendar, Plus, X, Users, Briefcase, Fingerprint, Save, FileText
} from 'lucide-react';

// --- CONFIG PDFMAKE ---
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

try {
  if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts && (pdfFonts as any).vfs) {
    pdfMake.vfs = (pdfFonts as any).vfs;
  }
} catch (e) { console.error("PDFMake Font Error:", e); }

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";

const Members = () => {
  const context = useOutletContext<{ userRole: string }>() || { userRole: 'user' };
  const isAdmin = (context.userRole === 'super_admin' || context.userRole === 'admin');

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.from('members').select('*').order('full_name', { ascending: true });
        if (error) throw error;
        setMembers(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  // --- FUNGSI CETAK PDF ---
  const handleExportPDF = () => {
    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          columns: [
            { image: 'logo', width: 50 },
            {
              stack: [
                { text: 'PERSATUAN GURU REPUBLIK INDONESIA (PGRI)', style: 'header' },
                { text: 'PENGURUS RANTING KALIJAGA', style: 'subheader' },
                { text: 'Alamat: Jl. Teratai Raya No 1 Perum Kalijaga Permai Kota Cirebon', style: 'address' },
              ],
              alignment: 'center', margin: [0, 5, 0, 0]
            }
          ]
        },
        { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 760, y2: 10, lineWidth: 2 }] },
        { text: 'LAPORAN DATABASE ANGGOTA PGRI', style: 'title', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: [25, '*', 100, 100, 100, 60],
            body: [
              [
                { text: 'NO', style: 'tableHeader' },
                { text: 'NAMA LENGKAP', style: 'tableHeader' },
                { text: 'NIP / NPA', style: 'tableHeader' },
                { text: 'UNIT KERJA', style: 'tableHeader' },
                { text: 'JABATAN', style: 'tableHeader' },
                { text: 'STATUS', style: 'tableHeader' }
              ],
              ...filteredMembers.map((m, index) => [
                { text: index + 1, alignment: 'center', fontSize: 9 },
                { text: m.full_name.toUpperCase(), fontSize: 9, bold: true },
                { text: `NIP: ${m.nip || '-'}\nNPA: ${m.npa || '-'}`, fontSize: 8 },
                { text: m.school_name, fontSize: 9 },
                { text: m.teacher_type, fontSize: 9 },
                { text: m.status, alignment: 'center', fontSize: 9 }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        { text: `\nDicetak pada: ${new Date().toLocaleString('id-ID')}`, style: 'footer' }
      ],
      images: {
        logo: LOGO_URL
      },
      styles: {
        header: { fontSize: 14, bold: true },
        subheader: { fontSize: 16, bold: true, color: '#b91c1c' },
        address: { fontSize: 9, italics: true },
        title: { fontSize: 12, bold: true, alignment: 'center', decoration: 'underline' },
        tableHeader: { fontSize: 10, bold: true, fillColor: '#f3f4f6', alignment: 'center' },
        footer: { fontSize: 8, italics: true, alignment: 'right' }
      }
    };

    pdfMake.createPdf(docDefinition).download(`Laporan_Anggota_PGRI_${new Date().getTime()}.pdf`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
          npa: formData.npa || '-',
          full_name: formData.full_name.toUpperCase(),
          nip: formData.nip || '-',
          nik: formData.nik,
          birth_place: formData.birth_place || '-',
          birth_date: formData.birth_date || null,
          gender: formData.gender,
          school_name: formData.school_name || '-',
          status: formData.status,
          teacher_type: formData.teacher_type,
          phone: formData.phone || '-',
          email: formData.email || '',
          username: formData.username || formData.nik,
          password: formData.password || '123456',
          account_status: formData.account_status || 'Aktif',
          role: formData.role || 'user'
      };

      if (isEditing) {
        const { error } = await supabase.from('members').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('members').insert([payload]);
        if (error) throw error;
      }

      alert('Berhasil disimpan!');
      setShowModal(false);
      fetchMembers();
    } catch (err: any) { alert('Gagal: ' + err.message); } finally { setSaving(false); }
  };

  const openModal = (data: any = null) => {
    if (data) { setIsEditing(true); setFormData({ ...data }); }
    else {
      setIsEditing(false);
      setFormData({ npa: '', full_name: '', nip: '', nik: '', birth_place: '', birth_date: '', gender: 'L', school_name: 'SDN KALIJAGA', status: 'ASN', teacher_type: 'Guru Kelas', phone: '', email: '', username: '', password: '', account_status: 'Aktif', role: 'user' });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Hapus data anggota ini?')) return;
    await supabase.from('members').delete().eq('id', id);
    fetchMembers();
  };

  const filteredMembers = members.filter(m => (m.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 space-y-6 animate-in fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[32px] border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-800 uppercase italic flex items-center gap-2 tracking-tighter">
            <Users size={24} className="text-red-700"/> Database Anggota
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PGRI Ranting Kalijaga • {members.length} Orang</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExportPDF} className="bg-slate-800 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg flex gap-2 items-center active:scale-95 transition-all">
                <FileText size={16}/> Cetak PDF
            </button>
            {isAdmin && (
            <button onClick={() => openModal()} className="bg-red-700 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg flex gap-2 items-center active:scale-95 transition-all">
                <Plus size={16}/> Tambah
            </button>
            )}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-3 rounded-2xl border shadow-sm flex items-center gap-3">
        <Search className="text-gray-400 ml-2" size={18} />
        <input type="text" placeholder="Cari Nama Guru..." className="w-full outline-none text-xs font-bold text-gray-700 uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b font-black text-gray-400 uppercase tracking-widest text-[9px]">
              <tr>
                <th className="p-6">Identitas Personel</th>
                <th className="p-6">Unit Kerja</th>
                <th className="p-6">Kontak</th>
                {isAdmin && <th className="p-6 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold uppercase">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center text-red-700 font-black"><Loader2 className="animate-spin mx-auto"/></td></tr>
              ) : filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-all">
                  <td className="p-6">
                    <div className="text-sm font-black text-gray-800 leading-none mb-1">{m.full_name}</div>
                    <div className="text-[9px] text-gray-400 font-mono">NIP: {m.nip} • NPA: {m.npa}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-gray-700 text-[10px]">{m.school_name}</div>
                    <div className="text-[9px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full w-fit mt-1">{m.teacher_type} • {m.status}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-green-600"><Phone size={12}/> {m.phone}</div>
                    <div className="text-[9px] text-gray-400 lowercase italic">{m.email}</div>
                  </td>
                  {isAdmin && (
                    <td className="p-6 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => openModal(m)} className="text-indigo-600 hover:scale-110 transition-transform"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(m.id)} className="text-gray-300 hover:text-red-600 transition-transform"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM LENGKAP */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-red-800 p-6 text-white flex justify-between items-center">
                <h3 className="font-black text-xs uppercase italic tracking-tighter flex items-center gap-2">
                   {isEditing ? <Edit size={16}/> : <Plus size={16}/>} {isEditing ? 'Revisi Anggota' : 'Anggota Baru'}
                </h3>
                <button onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                      <label className="text-[9px] font-black text-red-700 uppercase border-b pb-1 block">Data Identitas</label>
                      <input required placeholder="NAMA LENGKAP & GELAR" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold uppercase outline-none focus:border-red-600" value={formData.full_name} onChange={e=>setFormData({...formData, full_name: e.target.value})}/>
                      <div className="grid grid-cols-2 gap-2">
                         <input placeholder="NIP" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.nip} onChange={e=>setFormData({...formData, nip: e.target.value})}/>
                         <input required placeholder="NIK" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.nik} onChange={e=>setFormData({...formData, nik: e.target.value})}/>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <input placeholder="TEMPAT LAHIR" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold uppercase" value={formData.birth_place} onChange={e=>setFormData({...formData, birth_place: e.target.value})}/>
                         <input type="date" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.birth_date} onChange={e=>setFormData({...formData, birth_date: e.target.value})}/>
                      </div>
                      <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})}><option value="L">LAKI-LAKI</option><option value="P">PEREMPUAN</option></select>
                  </div>
                  <div className="space-y-4">
                      <label className="text-[9px] font-black text-red-700 uppercase border-b pb-1 block">Tugas & Alamat</label>
                      <input placeholder="SEKOLAH" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold uppercase" value={formData.school_name} onChange={e=>setFormData({...formData, school_name: e.target.value})}/>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.teacher_type} onChange={e=>setFormData({...formData, teacher_type: e.target.value})}>
                            <option>GURU KELAS</option><option>GURU MAPEL</option><option>GURU AGAMA</option><option>GURU PJOK</option><option>KEPALA SEKOLAH</option>
                        </select>
                        <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                            <option>ASN</option><option>PPPK</option><option>HONORER</option>
                        </select>
                      </div>
                      <input placeholder="NO. WHATSAPP" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                      <input placeholder="EMAIL" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/>
                      <input placeholder="NPA (KARTU PGRI)" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.npa} onChange={e=>setFormData({...formData, npa: e.target.value})}/>
                  </div>
               </div>
               <div className="bg-red-50 p-6 rounded-3xl space-y-4">
                  <label className="text-[9px] font-black text-red-800 uppercase flex items-center gap-2"><Fingerprint size={14}/> Kredensial Sistem</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="USERNAME" className="w-full p-4 bg-white border border-red-100 rounded-2xl text-xs font-black" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})}/>
                    <input placeholder="PASSWORD" type="text" className="w-full p-4 bg-white border border-red-100 rounded-2xl text-xs font-black" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})}/>
                  </div>
               </div>
               <div className="pt-4 flex gap-3 border-t">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-400">Batal</button>
                 <button type="submit" disabled={saving} className="flex-[2] py-4 bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex justify-center items-center gap-2">
                     {saving ? <Loader2 className="animate-spin"/> : <><Save size={18}/> Simpan Perubahan</>}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;