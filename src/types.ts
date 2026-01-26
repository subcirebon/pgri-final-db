// --- KAMUS DATA LENGKAP ---
export interface Member {
  id: string;
  nip: string;
  name: string;
  school: string;
  position: string;
  phone: string;
  email: string;
  birthDate: string;
  status: 'active' | 'inactive';
}

export interface FinanceRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
}

export interface Letter {
  id: string;
  number: string;
  date: string;
  subject: string;
  type: 'incoming' | 'outgoing';
  senderReceiver: string;
  fileUrl?: string;
}

export interface AdvocacyCase {
  id: string;
  memberId: string;
  memberName: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  dateSubmitted: string;
}

export interface InfoPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}