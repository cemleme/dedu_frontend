import Modal from "@mui/material/Modal";
import { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import axios from "axios";
import { deleteObject, createPublicObject } from "../../utils/gfSDK";
import SyncLoader from "react-spinners/SyncLoader";
import { useGetCourseData } from "../hooks/useGetCourseData";

const CourseDetailsModal = ({
  show,
  handleClose,
  selectedCourse,
  allFiles,
  allJsonFiles,
}) => {
  const { address, connector } = useAccount();
  const [selectedCourseData, setSelectedCourseData] = useState(null);
  const [modalUpdateIsLoading, setModalUpdateIsLoading] = useState(false);
  const { switchChain } = useSwitchChain();
  const { courseData, loading } = useGetCourseData({
    name: selectedCourse?.name,
    owner: address,
  });

  useEffect(() => {
    setSelectedCourseData(courseData);
  }, [courseData]);

  const handleUpdateGroupData = async () => {
    switchChain({ chainId: 5600 });
    const provider = await connector?.getProvider();
    setModalUpdateIsLoading(true);
    const detailsFileName = selectedCourse.name.replace("/", "") + ".json";
    if (allJsonFiles.includes(detailsFileName)) {
      console.log("deleting object");
      await deleteObject({
        address,
        bucketName: "dedu-" + address.toLowerCase(),
        objectName: detailsFileName,
        provider,
      });
    }
    console.log("creating object");
    await createPublicObject({
      address,
      bucketName: "dedu-" + address.toLowerCase(),
      objectName: detailsFileName,
      provider,
      content: JSON.stringify({ ...selectedCourseData }),
    });
    setModalUpdateIsLoading(false);
    handleClose();
  };
  return (
    <Modal open={show} onClose={handleClose}>
      <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
        <div className="max-h-full w-full max-w-[1200px] overflow-y-auto sm:rounded-2xl bg-white">
          <div className="w-full">
            <div className="flex items-center justify-center p-12">
              <div className="mx-auto w-full max-w-[1200px]">
                {loading && (
                  <div className="flex justify-center">
                    <SyncLoader
                      color={"#000000"}
                      loading={loading}
                      size={20}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  </div>
                )}
                {selectedCourseData && (
                  <>
                    <div className="mb-5">
                      <h1 className="text-black mb-4 text-3xl font-extrabold">
                        {selectedCourseData.group
                          ? selectedCourseData.group.replace("/", "")
                          : ""}
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
                        value={selectedCourseData.name}
                        onChange={(e) => {
                          setSelectedCourseData({
                            ...selectedCourseData,
                            name: e.target.value,
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
                        value={selectedCourseData.desc}
                        onChange={(e) => {
                          setSelectedCourseData({
                            ...selectedCourseData,
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
                        value={selectedCourseData.url}
                        onChange={(e) => {
                          setSelectedCourseData({
                            ...selectedCourseData,
                            url: e.target.value,
                          });
                        }}
                        className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
                      />
                    </div>
                    <div className="mb-5">
                      <label
                        htmlFor="message"
                        className="mb-3 block text-base font-medium text-[#07074D]"
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
                              File
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                          </tr>
                        </thead>
                        <tbody className="text-[#07074D]">
                          {selectedCourseData.courses?.map((lecture, i) => (
                            <tr
                              key={lecture.file}
                              className="border-b border-gray-200"
                            >
                              <td>{i + 1}</td>
                              <td>{lecture.file}</td>
                              <td>
                                <textarea
                                  type="text"
                                  name="subject"
                                  id="subject"
                                  value={lecture.name}
                                  onChange={(e) => {
                                    const newCourses =
                                      selectedCourseData.courses.map((c, i) => {
                                        if (c.file === lecture.file) {
                                          // Return a new circle 50px below
                                          return {
                                            ...c,
                                            name: e.target.value,
                                          };
                                        } else {
                                          // No change
                                          return c;
                                        }
                                      });

                                    setSelectedCourseData({
                                      ...selectedCourseData,
                                      courses: newCourses,
                                    });
                                  }}
                                  className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
                                />
                              </td>
                              <td>
                                <textarea
                                  type="text"
                                  name="subject"
                                  id="subject"
                                  value={lecture.description}
                                  onChange={(e) => {
                                    const newCourses =
                                      selectedCourseData.courses.map((c, i) => {
                                        if (c.file === lecture.file) {
                                          // Return a new circle 50px below
                                          return {
                                            ...c,
                                            description: e.target.value,
                                          };
                                        } else {
                                          // No change
                                          return c;
                                        }
                                      });

                                    setSelectedCourseData({
                                      ...selectedCourseData,
                                      courses: newCourses,
                                    });
                                  }}
                                  className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
                                />
                              </td>
                              <td>
                                <div className="flex items-center pl-3 text-xs font-bold text-white">
                                  <button
                                    className=" mr-1 flex items-center justify-center rounded-lg bg-pink-400 p-1  shadow-md transition-all hover:shadow-lg active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                    data-ripple-light="true"
                                    onClick={(e) => {
                                      setSelectedCourseData({
                                        ...selectedCourseData,
                                        courses: selectedCourseData.courses
                                          .slice(0, i)
                                          .concat(
                                            selectedCourseData.courses.slice(
                                              i + 1
                                            )
                                          ),
                                      });
                                    }}
                                  >
                                    <i className="fas fa-trash text-lg leading-none"></i>
                                  </button>
                                  <button
                                    disabled={i == 0}
                                    className=" mr-1 flex items-center justify-center rounded-lg bg-green-700 p-1 shadow-md transition-all hover:shadow-lg active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                    data-ripple-light="true"
                                    onClick={(e) => {
                                      const newCourses = [
                                        ...selectedCourseData.courses,
                                      ];

                                      const temp =
                                        selectedCourseData.courses[i - 1];
                                      newCourses[i - 1] =
                                        selectedCourseData.courses[i];
                                      newCourses[i] = temp;

                                      setSelectedCourseData({
                                        ...selectedCourseData,
                                        courses: newCourses,
                                      });
                                    }}
                                  >
                                    <i className="fas fa-caret-up text-lg leading-none"></i>
                                  </button>
                                  <button
                                    disabled={
                                      i == selectedCourseData.courses.length - 1
                                    }
                                    className=" mr-1 flex items-center justify-center rounded-lg bg-green-700 p-1 shadow-md transition-all hover:shadow-lg active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                    data-ripple-light="true"
                                    onClick={(e) => {
                                      const newCourses = [
                                        ...selectedCourseData.courses,
                                      ];

                                      const temp =
                                        selectedCourseData.courses[i + 1];
                                      newCourses[i + 1] =
                                        selectedCourseData.courses[i];
                                      newCourses[i] = temp;

                                      setSelectedCourseData({
                                        ...selectedCourseData,
                                        courses: newCourses,
                                      });
                                    }}
                                  >
                                    <i className="fas fa-caret-down text-lg leading-none"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mb-5">
                      <label
                        htmlFor="message"
                        className="mb-3 block text-base font-medium text-[#07074D]"
                      >
                        Unassigned Files
                      </label>
                      {allFiles.map(
                        (file, i) =>
                          selectedCourseData.courses?.filter(
                            (l) => l.file == file
                          ).length == 0 && (
                            <div
                              key={file}
                              className="flex flex-row items-center justify-between"
                            >
                              <div className="mb-3 block text-base font-medium text-[#07074D]">
                                {file}
                              </div>
                              <button
                                onClick={(e) => {
                                  selectedCourseData.courses.push({
                                    name: file,
                                    file,
                                    description: "Lecture Description",
                                  });
                                  setSelectedCourseData({
                                    ...selectedCourseData,
                                    courses: selectedCourseData.courses,
                                  });
                                }}
                                className="hover:shadow-form rounded-md bg-indigo-500 py-3 px-8 text-base font-semibold text-white outline-none disabled:opacity-25"
                              >
                                Add Lecture
                              </button>
                            </div>
                          )
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        disabled={modalUpdateIsLoading}
                        onClick={handleUpdateGroupData}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CourseDetailsModal;
