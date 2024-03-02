import { useAccount, useSwitchChain, useReadContract, useConfig } from "wagmi";
import { readContract, writeContract } from "@wagmi/core";
import axios from "axios";
import {
  getBucketList,
  getBucketFileList,
  createBucket,
  createFolder,
  createFolderAndGroup,
  deleteObject,
  CreateGroup,
  mirrorGroup,
  createObject,
  putBucketPolicy,
  checkGroupExistByName,
  createPublicObject,
  getGroupInfoByName,
  getCollectionInfoByName,
  getObjectInfoByName,
  getObjectMetaByName,
  multiTx,
  client,
  headGroupNFT,
  updateGroupInfo,
} from "../utils/gfSDK";
import {
  PermissionTypes,
  GRNToString,
  newGroupGRN,
  newObjectGRN,
} from "@bnb-chain/greenfield-js-sdk";
import { useEffect, useState, useRef } from "react";
import TeachingRow from "./components/teachingRow";
import marketplaceabi from "./marketplace.abi.json";
import hubabi from "./hub.abi.json";
import { useTeachingActivated } from "./hooks/useTeachingActivated";
import CourseDetailsModal from "./components/courseDetailsModal";
import SyncLoader from "react-spinners/SyncLoader";
import CreateCourseModal from "./components/createCourseModal";

function Teachings() {
  const inputRef = useRef(null);
  const { address, connector } = useAccount();
  const { switchChain } = useSwitchChain();
  const [courses, setCourses] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [show, setShow] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalUpdateIsLoading, setModalUpdateIsLoading] = useState(false);
  const [allFiles, setAllFiles] = useState({});
  const [userListedIds, setUserListedIds] = useState();
  const config = useConfig();

  const { haveDeduBucket, hasRole, loading } = useTeachingActivated();

  const handleClose = () => {
    setShow(false);
    setSelectedCourse(null);
  };
  const handleShowDetailsModal = async (course) => {
    setSelectedCourse(course);
    setShow(true);
  };

  const handleCloseCreateModal = (refresh = false) => {
    loadAllFiles();
    setShowCreateModal(false);
  };
  const handleShowCreateModal = async () => {
    setShowCreateModal(true);
  };

  const handleCreateDeduBucket = async () => {
    switchChain({ chainId: 5600 });
    const provider = await connector?.getProvider();
    await createBucket({
      address,
      bucketName: "dedu-" + address.toLowerCase(),
      provider,
    });
  };

  const handleApprove = async () => {
    switchChain({ chainId: 97 });

    const result = await writeContract(config, {
      abi: hubabi,
      address: "0x50B3BF0d95a8dbA57B58C82dFDB5ff6747Cc1a9E",
      functionName: "grant",
      args: ["0x78b347a9608abc2fc030a8E9a65c4A9C047Bf67b", 4, 0xffffffff],
    });

    console.log(result);
  };

  const loadAllFiles = async () => {
    const files = [];

    if (haveDeduBucket) {
      const fileList = await getBucketFileList({
        bucketName: "dedu-" + address.toLowerCase(),
      });

      const _allFiles = {};

      for (let i = 0; i < fileList.body.Objects.length; i++) {
        const o = fileList.body.Objects[i];
        const isFolder = o.ObjectInfo.ObjectName.endsWith("/");
        const fileName = o.ObjectInfo.ObjectName;
        const folderName = fileName.substring(0, fileName.indexOf("/"));

        if (!isFolder) {
          if (!_allFiles[folderName]) _allFiles[folderName] = [];
          _allFiles[folderName].push(
            fileName.substring(fileName.indexOf("/") + 1)
          );
        }

        if (isFolder) {
          const group = await getGroupInfoByName(
            o.ObjectInfo.ObjectName,
            address
          );
          if (!_allFiles[folderName]) _allFiles[folderName] = [];
          let groupId = group.groupInfo ? group.groupInfo.id : null;
          // let groupData = group.groupInfo ? { ...group.groupInfo.owner } : null;

          const haveGroup = group.groupInfo != undefined;

          files.push({
            name: o.ObjectInfo.ObjectName,
            type: o.ObjectInfo.ContentType,
            isFolder,
            haveGroup,
            groupId,
            isListed: userListedIds.includes(groupId),
          });
        }
      }
      setAllFiles(_allFiles);
    }
    setCourses(files);
  };

  useEffect(() => {
    const load = async () => {
      if (!address) return;

      const result = await readContract(config, {
        abi: marketplaceabi,
        address: "0x78b347a9608abc2fc030a8E9a65c4A9C047Bf67b",
        functionName: "getUserListed",
        args: [address, 0, 10],
        chainId: 97,
      });
      const listedIds = result[0].map((i) => i.toString());
      setUserListedIds(listedIds);

      loadAllFiles();
    };

    load();
  }, [address, haveDeduBucket]);

  return (
    <>
      {!address && <>Please connect your wallet first</>}
      {address && !loading && !haveDeduBucket && (
        <div className="h-screen flex flex-col items-center justify-center content-center">
          <button
            className="bg-indigo-600 px-4 py-2 rounded-md text-white font-semibold tracking-wide cursor-pointer disabled:opacity-25"
            onClick={handleCreateDeduBucket}
          >
            Activate
          </button>
          <p>
            This will create a specific bucket for your files and folders on BNB
            Greenfield
          </p>
        </div>
      )}
      {address && !loading && !hasRole && (
        <button onClick={handleApprove}>Approve</button>
      )}
      {loading && (
        <div className="flex justify-center items-center h-full">
          <br />
          <SyncLoader
            color={"#ffffff"}
            loading={loading}
            size={20}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}

      <CreateCourseModal
        show={showCreateModal}
        handleClose={handleCloseCreateModal}
      />

      <CourseDetailsModal
        show={show}
        handleClose={handleClose}
        selectedCourse={selectedCourse}
        allJsonFiles={allFiles[""]}
        allFiles={
          selectedCourse && selectedCourse.name
            ? allFiles[selectedCourse.name.replace("/", "")]
            : []
        }
      />

      {!loading && haveDeduBucket && (
        <div className="bg-white p-8 rounded-md w-full">
          <div className=" flex items-center justify-between pb-6">
            <div>
              <h2 className="text-gray-600 font-semibold">My Courses</h2>
            </div>
            <div className="flex items-center justify-between">
              <div className="lg:ml-40 ml-10 space-x-8">
                <button
                  onClick={handleShowCreateModal}
                  className="bg-indigo-600 px-4 py-2 rounded-md text-white font-semibold tracking-wide cursor-pointer disabled:opacity-25"
                >
                  Create Course
                </button>
              </div>
            </div>
          </div>
          <div className=" flex items-end justify-end">
            <input
              className="bg-indigo-600 px-4 py-2 rounded-md text-white font-semibold tracking-wide cursor-pointer"
              ref={inputRef}
              type="file"
              onChange={(event) => setSelectedFile(event.target.files[0])}
            />
          </div>
          <div>
            <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
              <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Folder/Group
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Course Name
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        GroupId
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <TeachingRow
                        key={course.name}
                        course={course}
                        selectedFile={selectedFile}
                        handleShowDetailsModal={handleShowDetailsModal}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Teachings;
