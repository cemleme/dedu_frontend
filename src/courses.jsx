import { useAccount, useSwitchChain, useConfig } from "wagmi";
import { readContract, writeContract } from "@wagmi/core";
import {
  getBucketList,
  getBucketFileList,
  createBucket,
  createFolder,
  CreateGroup,
  mirrorGroup,
  createObject,
  putBucketPolicy,
  checkGroupExistByName,
  multiTx,
  client,
  checkAddressInGroup,
  headGroupNFT,
  parseGroupName,
} from "../utils/gfSDK";
import { useEffect, useState, useRef } from "react";
import CourseCard from "./components/courseCard";
import Modal from "@mui/material/Modal";
import marketplaceabi from "./marketplace.abi.json";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [relayFee, setRelayFee] = useState([]);
  const { address, connector } = useAccount();
  const { switchChain } = useSwitchChain();
  const [selectedCourseData, setSelectedCourseData] = useState(null);
  const [show, setShow] = useState(false);
  const config = useConfig();

  const handleClose = () => {
    setShow(false);
    setSelectedCourseData(null);
  };

  const handleShowDetailsModal = async (courseData) => {
    setShow(true);
    setSelectedCourseData(courseData);
  };

  useEffect(() => {
    const load = async () => {
      const _relayFee = await readContract(config, {
        abi: marketplaceabi,
        address: "0x78b347a9608abc2fc030a8E9a65c4A9C047Bf67b",
        functionName: "getMinRelayFee",
        chainId: 97,
      });

      setRelayFee(_relayFee.toString());

      const _result = await readContract(config, {
        abi: marketplaceabi,
        address: "0x78b347a9608abc2fc030a8E9a65c4A9C047Bf67b",
        functionName: "getListed",
        args: [0, 10],
        chainId: 97,
      });
      const listedIds = _result[0].map((i) => i.toString());
      console.log(listedIds);

      const t = listedIds.map((item) => {
        console.log(item);
        return headGroupNFT(item);
      });
      let result = await Promise.all(t);
      console.log("headGroupNFT result", result);
      result = result
        .map((item, index) => {
          if (!Object.keys(item).length) return false;
          const {
            metaData: { attributes, groupName },
          } = item;
          const owner = attributes[0];

          return {
            ...item,
            name: groupName.replace("/", ""),
            ownerAddress: owner.value,
            id: listedIds[index],
            // listTime: _dates[index],
          };
        })
        .filter((item) => item);

      setCourses(result);
      console.log(result);
    };

    load();
  }, []);

  return (
    <>
      <Modal open={show} onClose={handleClose}>
        <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
          <div className="max-h-full w-full max-w-[1200px] overflow-y-auto sm:rounded-2xl bg-white">
            <div className="w-full">
              <div className="flex items-center justify-center p-12 text-[#07074D]">
                <div className="mx-auto w-full max-w-[1200px]">
                  {selectedCourseData && (
                    <>
                      <div className="mb-5">
                        <h1 className="text-black mb-4 text-3xl font-extrabold">
                          {selectedCourseData.name.replace("/", "")}
                        </h1>
                      </div>
                      <div className="mb-5">{selectedCourseData.desc}</div>
                      <div className="mb-5"></div>
                      <div className="mb-5">
                        <label
                          htmlFor="message"
                          className="mb-3 block text-base font-medium "
                        >
                          Lectures
                        </label>

                        <table className="min-w-full leading-normal">
                          <thead>
                            <tr>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-[#07074D]">
                            {selectedCourseData.courses?.map((lecture, i) => (
                              <tr
                                key={lecture.file}
                                className="border-b border-gray-200"
                              >
                                <td>{i + 1}</td>
                                <td>{lecture.name}</td>
                                <td>{lecture.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleClose}
                          className="hover:shadow-form rounded-md bg-yellow py-3 px-8 text-base font-semibold text-white outline-none disabled:opacity-25"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <div className="flex flex-row gap-3 pt-3">
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            relayFee={relayFee}
            handleShowDetailsModal={handleShowDetailsModal}
          />
        ))}
      </div>
    </>
  );
}

export default Courses;
