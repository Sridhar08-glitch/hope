"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { LogOut } from "lucide-react";

interface ProfileViewProps {
  profile: any;
  isEditingProfile: boolean;
  onEditToggle: (editing: boolean) => void;
  onProfileChange: (profile: any) => void;
  onUpdateProfile: (e: React.FormEvent) => void;
  onLogout: () => void;
}

export function ProfileView({
  profile,
  isEditingProfile,
  onEditToggle,
  onProfileChange,
  onUpdateProfile,
  onLogout,
}: ProfileViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {!isEditingProfile ? (
        <>
          {/* Profile Details View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
            <div>
              <h2 className="text-xl font-bold text-white px-2">My Profile</h2>
              <p className="text-xs text-slate-500 px-2 mt-1">
                View and manage your profile information.
              </p>
            </div>
            <button
              onClick={() => onEditToggle(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(126,34,206,0.4)] hover:shadow-[0_0_20px_rgba(126,34,206,0.6)]"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400" />
              <h3 className="text-white font-bold mb-6">Personal Information</h3>
              <div className="space-y-5 relative z-10">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Full Name
                  </p>
                  <p className="text-white text-lg">
                    {profile.name || profile.full_name || "\u2014"}
                  </p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Email Address
                  </p>
                  <p className="text-white">{profile.email || "\u2014"}</p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Phone Number
                  </p>
                  <p className="text-white">{profile.phone || "\u2014"}</p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Primary Specialty
                  </p>
                  <p className="text-white">
                    {profile.specialty || profile.specialization || "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-400" />
              <h3 className="text-white font-bold mb-6">Business Details</h3>
              <div className="space-y-5 relative z-10">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Hourly Rate (QAR)
                  </p>
                  <p className="text-white text-lg font-bold">
                    {profile.hourly_rate || "\u2014"}
                  </p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Experience (Years)
                  </p>
                  <p className="text-white text-lg">{profile.experience || "\u2014"}</p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Verification Status
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      profile.is_verified ? "text-green-400" : "text-yellow-400"
                    }`}
                  >
                    {profile.is_verified ? "\u2713 Verified" : "Pending Verification"}
                  </p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Edit Profile Form */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
            <div>
              <h2 className="text-xl font-bold text-white px-2">Edit Profile</h2>
              <p className="text-xs text-slate-500 px-2 mt-1">Update your profile information.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEditToggle(false)}
                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={onUpdateProfile}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(244,190,105,0.4)] hover:shadow-[0_0_20px_rgba(244,190,105,0.6)]"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400" />
              <h3 className="text-white font-bold mb-6">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name || profile.full_name || ""}
                    onChange={(e) => onProfileChange({ ...profile, name: e.target.value, full_name: e.target.value })}
                    className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email || ""}
                    onChange={(e) => onProfileChange({ ...profile, email: e.target.value })}
                    className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone || ""}
                    onChange={(e) => onProfileChange({ ...profile, phone: e.target.value })}
                    className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                    Primary Specialty
                  </label>
                  <input
                    type="text"
                    value={profile.specialty || profile.specialization || ""}
                    onChange={(e) => onProfileChange({ ...profile, specialty: e.target.value, specialization: e.target.value })}
                    className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-400" />
              <h3 className="text-white font-bold mb-6">Business Details</h3>
              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                    Hourly Rate (QAR)
                  </label>
                  <input
                    type="number"
                    value={profile.hourly_rate || ""}
                    onChange={(e) =>
                      onProfileChange({ ...profile, hourly_rate: e.target.value })
                    }
                    className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={profile.experience || ""}
                    onChange={(e) =>
                      onProfileChange({ ...profile, experience: e.target.value })
                    }
                    className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
