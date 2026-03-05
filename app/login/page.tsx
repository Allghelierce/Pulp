"use client"
import Link from 'next/link';

const ACCENT = "#7A5C66";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0ECEA] font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border-t-8" style={{ borderColor: ACCENT }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ background: `linear-gradient(135deg,${ACCENT}88,${ACCENT})` }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M4 22C4 22 10 6 24 6"/><path d="M18 13C24 13 24 23 18 23"/></svg>
          </div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: '"Licorice", cursive', color: ACCENT }}>Letter Soup</h1>
        </div>

        <div className="space-y-4">
          <input type="email" placeholder="Email" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-[#7A5C66] transition-colors text-black" />
          <input type="password" placeholder="Password" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-[#7A5C66] transition-colors text-black" />
          <Link href="/" className="block">
            <button className="w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: ACCENT }}>
              Sign In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}