import React from "react";

const ChevronLeftIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 18L9 12L15 6"
      stroke="#8D6E63"
      strokeOpacity="0.75"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MessageCircleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
      stroke="#8D6E63"
      strokeOpacity="0.75"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.00001 3.33325V12.6666M3.33334 7.99992H12.6667"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MicIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_2004_390)">
      <path
        d="M12.6667 6.66675V8.00008C12.6667 9.23776 12.175 10.4247 11.2998 11.2999C10.4247 12.1751 9.23768 12.6667 8 12.6667M8 12.6667C6.76233 12.6667 5.57534 12.1751 4.70017 11.2999C3.825 10.4247 3.33334 9.23776 3.33334 8.00008V6.66675M8 12.6667V15.3334M5.33334 15.3334H10.6667M8 0.666748C7.46957 0.666748 6.96086 0.877462 6.58579 1.25253C6.21072 1.62761 6 2.13632 6 2.66675V8.00008C6 8.53051 6.21072 9.03922 6.58579 9.4143C6.96086 9.78937 7.46957 10.0001 8 10.0001C8.53044 10.0001 9.03914 9.78937 9.41422 9.4143C9.78929 9.03922 10 8.53051 10 8.00008V2.66675C10 2.13632 9.78929 1.62761 9.41422 1.25253C9.03914 0.877462 8.53044 0.666748 8 0.666748Z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_2004_390">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div
        className="w-full max-w-sm mx-auto relative flex flex-col"
        style={{
          width: "393px",
          height: "852px",
          borderRadius: "20px",
          background: "#D2BD96",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-8 pb-4">
          <div className="flex items-center gap-1">
            <ChevronLeftIcon />
            <span
              className="text-sm font-medium"
              style={{
                color: "rgba(141, 110, 99, 0.75)",
                fontFamily:
                  "Instrument Sans, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Chats
            </span>
          </div>
          <MessageCircleIcon />
        </div>

        {/* Messages Container */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-6 overflow-y-auto">
          {/* First message group */}
          <div className="flex flex-col gap-4">
            {/* Sent message */}
            <div className="flex justify-end">
              <div
                className="px-2 py-1 rounded text-white text-sm"
                style={{
                  background: "#6F9460",
                  borderRadius: "7px",
                  fontFamily:
                    "Instrument Sans, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                }}
              >
                Hello, i am Marijo.
              </div>
            </div>

            {/* Received message */}
            <div className="w-full">
              <div
                className="text-lg leading-normal"
                style={{
                  color: "#336478",
                  fontFamily:
                    "Crimson Pro, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "18px",
                  fontWeight: 400,
                  lineHeight: "normal",
                }}
              >
                Hello, i am Fraude. It's nice to meet you too!{"\n"}
                How can I help you today?
              </div>
            </div>
          </div>

          {/* Second message group */}
          <div className="flex justify-end">
            <div
              className="px-2 py-1 rounded text-white text-sm"
              style={{
                background: "#6F9460",
                borderRadius: "7px",
                fontFamily:
                  "Instrument Sans, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
              }}
            >
              Nice to meet you too!
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div
          className="p-4 flex justify-between items-center"
          style={{
            background: "rgba(141, 110, 99, 0.75)",
            borderRadius: "25px 25px 0px 0px",
            height: "112px",
          }}
        >
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#3A3A3A" }}
          >
            <PlusIcon />
          </button>

          <button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#3A3A3A" }}
          >
            <MicIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
