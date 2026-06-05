import { useNavigate } from "react-router-dom";

const calculators = [
  {
    title: "Conveyor",
    route: "/conveyor",
    description: "Belt conveyor design & analysis",
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Vibrating Feeder",
    route: "/vibrating-feeder",
    description: "Material feeder calculations",
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Vibrating Screen",
    route: "/vibrating-screen",
    description: "Screening system design",
    color: "from-amber-500 to-amber-600",
  },
  {
    title: "Bearing",
    route: "/bearing",
    description: "Bearing life & performance",
    color: "from-cyan-500 to-cyan-600",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="max-w-7xl mx-auto px-8 py-8 relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Mechanical Design Portal
            </h1>
          </div>
          <img 
            src="/sail-logo.png" 
            alt="SAIL Logo" 
            className="h-16 w-auto"
          />
        </div>
      </div>

      {/* Calculator Cards */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {calculators.map((calc) => (
            <div
              key={calc.title}
              onClick={() => navigate(calc.route)}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${calc.color}`}
                ></div>

                {/* Content */}
                <div className="relative p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">{calc.title}</h2>
                  <p className="text-white/80 text-sm mb-6">{calc.description}</p>

                  {/* Hover indicator */}
                  <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                    <span>Get Started</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>

                {/* Accent border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-8 py-8 text-center text-slate-400">
          <p>© Aryan Shankar - CET, SAIL Trainee Intern</p>
        </div>
      </div>
    </div>
  );
}