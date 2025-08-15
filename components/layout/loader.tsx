"use client";

import Image from "next/image";
import React from "react";

const CarrrsLoader: React.FC = () => {
  return (
  <div className=" w-full h-screen">
    <div className="absolute top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden  bg-black">
      <div className="">
        <Image src="/logo/carrs.png" width={600} height={75} alt="Carrrs Logo" className="md:w-11/12 w-11/12 mx-auto animate-pulse" />
      </div>

    </div>
    </div>
  );
};

export default CarrrsLoader;
