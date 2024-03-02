import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useHasAccess } from "../hooks/useHasAccess";
import { useState, useEffect } from "react";
import { useGetCourseData } from "../hooks/useGetCourseData";
import { useAccount, useSwitchChain, useConfig } from "wagmi";
import { writeContract, readContract } from "@wagmi/core";
import marketplaceabi from "../marketplace.abi.json";
import { formatEther } from "viem";

const CourseCard = ({ course, handleShowDetailsModal, relayFee }) => {
  const { hasAccess } = useHasAccess(course);
  const { address, connector } = useAccount();
  const { switchChain } = useSwitchChain();
  const config = useConfig();
  const [buyLoading, setBuyLoading] = useState();
  const [totalFee, setTotalFee] = useState();
  console.log("hasAccess", hasAccess);
  const navigate = useNavigate();
  const { courseData, loading } = useGetCourseData({
    name: course.name,
    owner: course.ownerAddress,
  });

  useEffect(() => {
    if (!courseData) return;
    const _totalFee = BigInt(relayFee) + BigInt(courseData.price);
    setTotalFee(_totalFee.toString());
  }, [relayFee, courseData]);

  const handleBuy = async (courseId) => {
    console.log("buy", courseId, courseData.price);
    switchChain({ chainId: 97 });

    setBuyLoading(true);

    console.log(courseId, address, totalFee);
    const result = await writeContract(config, {
      abi: marketplaceabi,
      address: "0x78b347a9608abc2fc030a8E9a65c4A9C047Bf67b",
      functionName: "buy",
      args: [courseId.toString(), address],
      value: totalFee,
    });
    console.log(result);

    setBuyLoading(false);
  };

  return (
    <>
      {courseData && (
        <div className="relative flex justify-between w-full max-w-[20rem] flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-lg">
          <div className="relative mx-4 mt-4 overflow-hidden rounded-xl bg-blue-gray-500 bg-clip-border text-white shadow-lg shadow-blue-gray-500/40">
            <img
              src={courseData.url || "https://placehold.co/300x200"}
              alt="ui/ux review check"
            />
            <div className="to-bg-black-10 absolute inset-0 h-full w-full bg-gradient-to-tr from-transparent via-transparent to-black/60"></div>
          </div>
          <div className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h5 className="block font-sans text-xl font-medium leading-snug tracking-normal text-blue-gray-900 antialiased">
                {courseData.name}
              </h5>
              <p className="flex items-center gap-1.5 font-sans text-sm font-normal leading-relaxed text-blue-gray-900 antialiased">
                {totalFee
                  ? formatEther(totalFee).substring(0, 6) + " tBNB"
                  : ""}
              </p>
            </div>
            <p className="block font-sans text-base font-light leading-relaxed text-gray-700 antialiased">
              {courseData.desc.substring(0, 100)}...
            </p>
          </div>

          {address && !hasAccess && (
            <div className="p-3 pt-3">
              <button
                disabled={buyLoading}
                className="block w-full select-none rounded-lg bg-pink-500 py-3.5 px-7 text-center align-middle font-sans text-sm font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                type="button"
                data-ripple-light="true"
                onClick={() => handleBuy(course.id)}
              >
                {buyLoading ? "Buying..." : "Buy"}
              </button>
            </div>
          )}
          {hasAccess && (
            <div className="p-3 pt-3">
              <button
                className="block w-full select-none rounded-lg bg-green-600 py-3.5 px-7 text-center align-middle font-sans text-sm font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                type="button"
                data-ripple-light="true"
                onClick={() => {
                  navigate("/course/" + course.id);
                }}
              >
                Open
              </button>
            </div>
          )}
          <div className="p-3 pt-0">
            <button
              className="block w-full select-none rounded-lg bg-yellow-500 py-3.5 px-7 text-center align-middle font-sans text-sm font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              type="button"
              data-ripple-light="true"
              onClick={() => handleShowDetailsModal(courseData)}
            >
              Details
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseCard;
