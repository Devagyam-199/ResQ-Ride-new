import AuthCard from "@/components/auth/AuthCard.jsx";
import ambulanceimage from "@/assets/ambulance_authpage.png";

const AuthenticationPage = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-slate-300 flex items-center justify-center">
      <div className="w-full absolute h-full bg-red-500">
        <img
          src={ambulanceimage}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />
      </div>
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/20 to-black/20 md:bg-black/40">
        <div className="w-full z-10 aboslute h-full flex flex-col justify-center items-center">
          <div className="flex space-x-5 w-full justify-center items-center">
            <svg className="w-1/3 md:w-1/4" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="blueStrokeOpacityGradientLeft" x1="0" y1="0" x2="190" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#0077b6" stopOpacity="0" />
                  <stop offset="45%"  stopColor="#0077b6" stopOpacity="0.25" />
                  <stop offset="75%"  stopColor="#0077b6" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#0077b6" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d="M 10,100 L 50,100 L 65,65 L 75,135 L 85,100 L 125,100 L 140,25 L 155,175 L 170,100 L 210,100 L 225,80 L 235,120 L 245,100 L 290,100 L 305,45 L 325,155 L 340,100 L 380,100"
                fill="none" stroke="url(#blueStrokeOpacityGradientLeft)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"
              />
            </svg>

            <p className="flex justify-center items-center text-xl sm:text-4xl md:text-5xl lg:text-6xl">
              ResQRide
            </p>

            <svg className="w-1/3 md:w-1/4" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="blueStrokeOpacityGradientRight" x1="210" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#0077b6" stopOpacity="1" />
                  <stop offset="45%"  stopColor="#0077b6" stopOpacity="0.65" />
                  <stop offset="75%"  stopColor="#0077b6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0077b6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 10,100 L 50,100 L 65,65 L 75,135 L 85,100 L 125,100 L 140,25 L 155,175 L 170,100 L 210,100 L 225,80 L 235,120 L 245,100 L 290,100 L 305,45 L 325,155 L 340,100 L 380,100"
                fill="none" stroke="url(#blueStrokeOpacityGradientRight)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="w-5/6 sm:w-5/6 md:w-7/8">
            <AuthCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationPage;