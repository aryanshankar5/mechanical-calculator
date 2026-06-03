import { useNavigate } from "react-router-dom";

export default function Home() {

  const navigate = useNavigate();

  const cards = [
    {
      title: "Conveyor",
      route: "/conveyor",
    },
    {
      title: "Vibrating Feeder",
      route: "/vibrating-feeder",
    },
    {
      title: "Vibrating Screen",
      route: "/vibrating-screen",
    },
    {
      title: "Bearing",
      route: "/bearing",
    },
  ];

  return (

    <div className="min-h-screen bg-slate-100">

      <div className="bg-slate-900 text-white py-8 px-8">

        <h1 className="text-4xl font-bold">
          Mechanical Design Portal
        </h1>

      </div>

      <div className="max-w-7xl mx-auto p-10">

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {cards.map((card) => (

            <div
              key={card.title}
              onClick={() => navigate(card.route)}
              className="bg-white rounded-2xl shadow-lg p-10 cursor-pointer hover:scale-105 transition"
            >

              <h2 className="text-2xl font-bold text-center">
                {card.title}
              </h2>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}