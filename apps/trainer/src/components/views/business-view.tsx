"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Plus } from "lucide-react";
import { Spinner } from "@holora/ui";

interface BusinessViewProps {
  plans: any[];
  workoutPlans: any[];
  mealPlans: any[];
  loading: boolean;
  onCreatePlan: () => void;
  onCreateWorkoutPlan: () => void;
  onCreateMealPlan: () => void;
}

export function BusinessView({
  plans,
  workoutPlans,
  mealPlans,
  loading,
  onCreatePlan,
  onCreateWorkoutPlan,
  onCreateMealPlan,
}: BusinessViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white px-2">Subscription Plans</h2>
          <p className="text-xs text-slate-500 px-2 mt-1">
            Manage your training packages and subscriptions.
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-lg text-slate-400" style={{ backgroundColor: "rgba(126,34,206,0.1)" }}>
          Plans managed by admin
        </span>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-[#281247] border border-purple-900/40 p-6 rounded-3xl shadow-xl hover:border-purple-500/30 transition-all group relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/10 transition" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-fuchsia-400 mb-1 block">
                    {plan.plan_type} PLAN
                  </span>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    plan.is_active
                      ? "bg-purple-600/10 text-yellow-400 border border-cyan-500/20"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-sm text-slate-400 mb-6 flex-1 relative z-10">{plan.description || "No description"}</p>

              <div className="flex items-end justify-between mt-auto pt-4 border-t border-purple-900/40 relative z-10">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-sm text-slate-200 font-semibold">{plan.duration_days} Days</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Price</p>
                  <p className="text-lg text-yellow-400 font-bold">QAR {plan.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workout Plans */}
      <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Workout Plans</h3>
            <p className="text-xs text-slate-500 mt-1">Your created workout programs.</p>
          </div>
          <button
            onClick={onCreateWorkoutPlan}
            className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            <Plus size={16} /> New Workout
          </button>
        </div>
        {workoutPlans.length === 0 ? (
          <p className="text-center py-4 text-slate-500 text-sm">No workout plans yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workoutPlans.map((wp: any) => (
              <div key={wp.id} className="bg-purple-900/20 border border-purple-900/40 rounded-xl p-4">
                <h4 className="text-white font-bold">{wp.name || wp.title || `Plan #${wp.id}`}</h4>
                <p className="text-xs text-slate-500 mt-1">{wp.description || ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meal Plans */}
      <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Meal Plans</h3>
            <p className="text-xs text-slate-500 mt-1">Your nutrition programs.</p>
          </div>
          <button
            onClick={onCreateMealPlan}
            className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            <Plus size={16} /> New Meal Plan
          </button>
        </div>
        {mealPlans.length === 0 ? (
          <p className="text-center py-4 text-slate-500 text-sm">No meal plans yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mealPlans.map((mp: any) => (
              <div key={mp.id} className="bg-purple-900/20 border border-purple-900/40 rounded-xl p-4">
                <h4 className="text-white font-bold">{mp.name || mp.title || `Plan #${mp.id}`}</h4>
                <p className="text-xs text-slate-500 mt-1">{mp.description || ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
