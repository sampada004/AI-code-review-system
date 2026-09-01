"use client";

import { CheckCircle2, Code2, Sparkles } from "lucide-react";

const languages = [
  { name: "TypeScript & JavaScript", desc: "React, Next.js, Node, Express, Nest", color: "from-blue-500 to-sky-400" },
  { name: "Python", desc: "Django, FastAPI, Flask, PyTorch, Pandas", color: "from-emerald-500 to-teal-400" },
  { name: "Go", desc: "Goroutines, Gin, Fiber, gRPC, Microservices", color: "from-cyan-500 to-blue-400" },
  { name: "Rust", desc: "Borrow checker, Tokio, Actix, Serde", color: "from-amber-500 to-orange-400" },
  { name: "Java & Kotlin", desc: "Spring Boot, Quarkus, Android, Micronaut", color: "from-rose-500 to-red-400" },
  { name: "C++ & C#", desc: ".NET Core, STL, Systems, Unreal", color: "from-violet-500 to-purple-400" },
];

const SupportedLanguages = () => {
  return (
    <section id="languages" className="relative scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 border-y border-white/5 bg-slate-950/40">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="badge-glow mb-3">
            <Code2 className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
              Polyglot Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Deep AST understanding across all major stacks
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Language-specific semantic parsers ensure precision without generic static analysis noise.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((lang, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md transition hover:border-white/20 hover:bg-slate-900/90"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${lang.color} text-white shadow-md`}>
                <Code2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">{lang.name}</h3>
                <p className="text-xs text-slate-400 truncate">{lang.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportedLanguages;
