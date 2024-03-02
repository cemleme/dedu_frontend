import { useAccount, useSwitchChain } from "wagmi";
import {
  headGroupNFT,
  getObjectInfoByName,
  getObjectPreviewUrl,
  downloadFile,
} from "../utils/gfSDK";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import SyncLoader from "react-spinners/SyncLoader";
import { useGetCourseData } from "./hooks/useGetCourseData";

function Course() {
  let { id } = useParams();
  const [lectureNo, setLectureNo] = useState(0);
  const [lectureUrl, setLectureUrl] = useState();
  const [courseOwner, setCourseOwner] = useState();
  const [courseName, setCourseName] = useState();
  const [loadingLecture, setLoadingLecture] = useState();
  const { address, connector } = useAccount();

  const { courseData, loading, loadCourseData } = useGetCourseData({
    name: courseName,
    owner: courseOwner,
  });

  useEffect(() => {
    if (!courseData) return;
    const loadPreviewUrl = async () => {
      if (courseData.courses[lectureNo].file.includes(".pdf")) {
        setLoadingLecture(true);
        const bucketName = "dedu-" + courseOwner;
        const provider = await connector?.getProvider();
        const url = await getObjectPreviewUrl({
          bucketName,
          objectName: `${courseName}/${courseData.courses[lectureNo].file}`,
          address,
          provider,
        });
        console.log(url);
        setLectureUrl(url);
        setLoadingLecture(false);
      }
    };
    loadPreviewUrl();
  }, [courseData]);

  const handleDownload = async () => {
    setLoadingLecture(true);
    const bucketName = "dedu-" + courseOwner;
    const provider = await connector?.getProvider();
    const blob = await downloadFile({
      bucketName,
      objectName: `${courseName}/${courseData.courses[lectureNo].file}`,
      address,
      provider,
    });
    const url = URL.createObjectURL(blob);
    setLectureUrl(url);
    setLoadingLecture(false);
  };

  useEffect(() => {
    if (!address) return;
    const load = async () => {
      let result = await headGroupNFT(id);
      const owner = result.metaData.attributes[0].value.toLowerCase();
      const _courseName = result.metaData.attributes[1].value.replace("/", "");
      setCourseOwner(owner);
      setCourseName(_courseName);
      await loadCourseData({ name: _courseName, owner });
    };

    load();
  }, [id, address]);

  return (
    <>
      {!courseData && (
        <div className="flex justify-center">
          <SyncLoader
            color={"#ffffff"}
            loading={loading}
            size={20}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}
      {courseData && (
        <div className="flex flex-ro gap-10">
          <div className="bg-white w-80 h-screen flex flex-col gap-10">
            <div className="user flex items-center justify-center flex-col gap-4 border-b border-emerald-slate-50 py-4">
              <div className="flex flex-col items-center">
                <span className="font-semibold text-lg text-emerald-700">
                  {courseData?.name}
                </span>
              </div>
              <div className="text-sm text-slate-400">
                <span className="font-semibold text-slate-500">
                  {courseData.courses.length} Lectures
                </span>
              </div>
            </div>

            <ul className="px-6 space-y-2">
              {courseData.courses.map((lecture, i) => (
                <li
                  key={lecture.name}
                  className={
                    i == lectureNo ? "bg-slate-50 pb-2 rounded-lg border" : ""
                  }
                >
                  <div
                    className="block px-4 py-2.5 text-slate-800 font-semibold  hover:bg-emerald-950 hover:text-white rounded-lg"
                    onClick={() => {
                      if (i !== lectureNo) {
                        setLectureUrl(null);
                      }
                      setLectureNo(i);
                    }}
                  >
                    {lecture.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col w-full">
            <div className="w-full">
              <div className="p-4 w-full text-center bg-white rounded-lg border shadow-md dark:bg-gray-800 dark:border-gray-700">
                <h3 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {courseData.courses[lectureNo].name}
                </h3>
                {!courseData.courses[lectureNo].file.includes(".pdf") &&
                  !loadingLecture &&
                  !lectureUrl && (
                    <button onClick={handleDownload}> Load Lecture</button>
                  )}
                {loadingLecture && (
                  <div className="flex justify-center">
                    <SyncLoader
                      color={"#ffffff"}
                      loading={loadingLecture}
                      size={15}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  </div>
                )}
                {!courseData.courses[lectureNo].file.includes(".pdf") &&
                  lectureUrl && (
                    <video width="1000" height="600" controls>
                      <source src={lectureUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                {courseData.courses[lectureNo].file.includes(".pdf") &&
                  lectureUrl && (
                    <iframe src={lectureUrl} width="100%" height="800" />
                  )}
                <p className=" text-base text-gray-500 sm:text-lg dark:text-gray-400">
                  {courseData.courses[lectureNo].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Course;
