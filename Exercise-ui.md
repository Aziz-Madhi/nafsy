import { Link } from "react-router-dom";
import { ChevronLeft, MessageCircle } from "lucide-react";

export default function Index() {
  const categories = [
    {
      name: "Mindfulness",
      color: "#F5D4C1",
      path: "/mindfulness",
    },
    {
      name: "Breathing",
      color: "#FDEBC9",
      path: "/breathing",
    },
    {
      name: "Movement",
      color: "#D0F1EB",
      path: "/movement",
    },
    {
      name: "Journaling",
      color: "#DED2F9",
      path: "/journaling",
    },
    {
      name: "Relaxation",
      color: "#C9EAFD",
      path: "/relaxation",
    },
    {
      name: "Thoughtful Reminders",
      color: "#FDC9D2",
      path: "/reminders",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        {/* Container with rounded corners and dark background */}
        <div
          className="rounded-[20px] overflow-hidden min-h-[852px] relative"
          style={{ backgroundColor: "#CCC0A9" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 mt-3">
            <div className="flex items-center gap-1">
              <ChevronLeft
                className="w-6 h-6 text-app-header"
                strokeWidth={1.6}
              />
              <span className="text-app-header font-instrument text-sm font-normal">
                Chats
              </span>
            </div>
            <MessageCircle
              className="w-6 h-6 text-app-header"
              strokeWidth={1.6}
            />
          </div>

          {/* Content Area */}
          <div className="px-4 mt-32 pb-8">
            <div className="space-y-4">
              {/* First Row */}
              <div className="flex gap-4">
                <Link
                  to={categories[0].path}
                  className="flex-1 rounded-2xl p-4 h-48 flex flex-col justify-start items-center transition-transform hover:scale-105"
                  style={{ backgroundColor: categories[0].color }}
                >
                  <h3 className="text-app-text font-raleway text-xl font-bold tracking-tight">
                    {categories[0].name}
                  </h3>
                </Link>
                <Link
                  to={categories[1].path}
                  className="flex-1 rounded-2xl p-4 h-48 flex flex-col justify-start items-center transition-transform hover:scale-105"
                  style={{ backgroundColor: categories[1].color }}
                >
                  <h3 className="text-app-text font-raleway text-xl font-bold tracking-tight">
                    {categories[1].name}
                  </h3>
                </Link>
              </div>

              {/* Second Row */}
              <div className="flex gap-4">
                <Link
                  to={categories[2].path}
                  className="flex-1 rounded-2xl p-4 h-48 flex flex-col justify-start items-center transition-transform hover:scale-105"
                  style={{ backgroundColor: categories[2].color }}
                >
                  <h3 className="text-app-text font-raleway text-xl font-bold tracking-tight">
                    {categories[2].name}
                  </h3>
                </Link>
                <Link
                  to={categories[3].path}
                  className="flex-1 rounded-2xl p-4 h-48 flex flex-col justify-start items-center transition-transform hover:scale-105"
                  style={{ backgroundColor: categories[3].color }}
                >
                  <h3 className="text-app-text font-raleway text-xl font-bold tracking-tight">
                    {categories[3].name}
                  </h3>
                </Link>
              </div>

              {/* Third Row */}
              <div className="flex gap-4">
                <Link
                  to={categories[4].path}
                  className="flex-1 rounded-2xl p-4 h-48 flex flex-col justify-start items-center transition-transform hover:scale-105"
                  style={{ backgroundColor: categories[4].color }}
                >
                  <h3 className="text-app-text font-raleway text-xl font-bold tracking-tight">
                    {categories[4].name}
                  </h3>
                </Link>
                <Link
                  to={categories[5].path}
                  className="flex-1 rounded-2xl p-4 h-48 flex flex-col justify-start items-center transition-transform hover:scale-105"
                  style={{ backgroundColor: categories[5].color }}
                >
                  <h3 className="text-app-text font-raleway text-xl font-bold tracking-tight text-center leading-tight">
                    {categories[5].name}
                  </h3>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
