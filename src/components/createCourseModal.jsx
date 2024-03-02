import Modal from "@mui/material/Modal";
import { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { createFolderAndGroup } from "../../utils/gfSDK";
import SyncLoader from "react-spinners/SyncLoader";

const CreateCourseModal = ({ show, handleClose }) => {
  const { address, connector } = useAccount();
  const [courseData, setCourseData] = useState({
    name: "",
    group: "",
    desc: "",
    url: "",
    createdAt: Date.now(),
    price: 1000,
    courses: [],
  });

  const [modalUpdateIsLoading, setModalUpdateIsLoading] = useState(false);
  const { switchChain } = useSwitchChain();

  const handleCreateCourse = async () => {
    switchChain({ chainId: 5600 });
    setModalUpdateIsLoading(true);
    await createFolderAndGroup({
      address,
      folderName: courseData.group,
      courseData,
      connector,
    });
    handleClose(true);
  };

  return (
    <Modal open={show} onClose={handleClose}>
      <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
        <div className="max-h-full w-full max-w-[1200px] overflow-y-auto sm:rounded-2xl bg-white">
          <div className="w-full">
            <div className="flex items-center justify-center p-12">
              <div className="mx-auto w-full max-w-[1200px]">
                <div className="mb-5">
                  <h1 className="text-black mb-4 text-3xl font-extrabold">
                    Create New Course
                  </h1>
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="name"
                    className="mb-3 block text-base font-medium text-[#07074D]"
                  >
                    Course Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={courseData.name}
                    onChange={(e) => {
                      setCourseData({
                        ...courseData,
                        name: e.target.value.replace("/", ""),
                        group: e.target.value
                          .trim()
                          .replace(/\s+/g, "_")
                          .replace("/", ""),
                      });
                    }}
                    className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
                  />
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="name"
                    className="mb-3 block text-base font-medium text-[#07074D]"
                  >
                    Price (in wei)
                  </label>
                  <input
                    type="number"
                    name="name"
                    id="name"
                    value={courseData.price}
                    onChange={(e) => {
                      setCourseData({
                        ...courseData,
                        price: e.target.value,
                      });
                    }}
                    className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
                  />
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="name"
                    className="mb-3 block text-base font-medium text-[#07074D]"
                  >
                    Description
                  </label>
                  <textarea
                    type="text"
                    name="name"
                    id="name"
                    value={courseData.desc}
                    onChange={(e) => {
                      setCourseData({
                        ...courseData,
                        desc: e.target.value,
                      });
                    }}
                    className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
                  />
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="subject"
                    className="mb-3 block text-base font-medium text-[#07074D]"
                  >
                    Course Thumbnail URL
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={courseData.url}
                    onChange={(e) => {
                      setCourseData({
                        ...courseData,
                        url: e.target.value,
                      });
                    }}
                    className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    disabled={modalUpdateIsLoading}
                    onClick={handleCreateCourse}
                    className="hover:shadow-form rounded-md bg-indigo-500 py-3 px-8 text-base font-semibold text-white outline-none disabled:opacity-25"
                  >
                    {modalUpdateIsLoading ? "Loading..." : "Save"}
                  </button>
                  <button
                    disabled={modalUpdateIsLoading}
                    onClick={handleClose}
                    className="hover:shadow-form rounded-md bg-yellow py-3 px-8 text-base font-semibold text-white outline-none disabled:opacity-25"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateCourseModal;
