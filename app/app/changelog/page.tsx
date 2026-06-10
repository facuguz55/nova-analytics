import type { Metadata } from "next";
import { CHANGELOG, TAG_META } from "@/lib/changelog";
import { Rocket, CheckCircle2, Zap, Wrench } from "lucide-react";

export const metadata: Metadata = { title: "Novedades — Nova Analytics" };

const TAG_ICONS = {
  launch:      Rocket,
  feature:     Zap,
  fix:         Wrench,
  improvement: CheckCircle2,
};

export default function ChangelogPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Novedades
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Historial de versiones y actualizaciones de Nova Analytics
        </p>
      </div>

      <div className="relative">
        {/* Línea vertical de timeline */}
        <div
          className="absolute left-4 top-0 bottom-0 w-px"
          style={{ background: "rgba(139,92,246,0.2)" }}
        />

        <div className="space-y-10">
          {CHANGELOG.map((entry) => {
            const tag = TAG_META[entry.tag];
            const Icon = TAG_ICONS[entry.tag];

            return (
              <div key={entry.version} className="relative pl-12">
                {/* Dot en la línea */}
                <div
                  className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: tag.bg, border: `1px solid ${tag.color}40`, top: "2px" }}
                >
                  <Icon size={14} color={tag.color} strokeWidth={2} />
                </div>

                {/* Card */}
                <div
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.18)" }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: tag.bg, color: tag.color }}
                        >
                          {tag.label}
                        </span>
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full font-mono"
                          style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}
                        >
                          v{entry.version}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-[#F1F5F9] mt-2">
                        {entry.title}
                      </h2>
                    </div>
                    <span className="text-xs text-[#475569] flex-shrink-0 mt-1">
                      {new Date(entry.date).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Items */}
                  <ul className="space-y-2">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: tag.color }}
                        />
                        <span className="text-sm text-[#CBD5E1] leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-center text-[#475569] pb-4">
        Nova Analytics · Hecho con ❤️ para dueños de tiendas Rioplatenses
      </p>
    </div>
  );
}
