import { useAccount, useSwitchChain, useConfig } from "wagmi";
import { writeContract } from "@wagmi/core";
import {
  getBucketFileList,
  CreateGroup,
  mirrorGroup,
  createObject,
  putBucketPolicy,
  checkGroupExistByName,
  multiTx,
  client,
  headGroupNFT,
  updateGroupInfo,
} from "../../utils/gfSDK";
import {
  PermissionTypes,
  GRNToString,
  newGroupGRN,
  newObjectGRN,
} from "@bnb-chain/greenfield-js-sdk";
import marketplaceabi from "../marketplace.abi.json";
import hubabi from "../hub.abi.json";
import Tooltip from "@mui/material/Tooltip";
import { useGetCourseData } from "../hooks/useGetCourseData";
import { useState } from "react";
import SyncLoader from "react-spinners/SyncLoader";

const TeachingRow = ({ course, selectedFile, handleShowDetailsModal }) => {
  const { address, connector } = useAccount();
  const { switchChain } = useSwitchChain();
  const config = useConfig();
  const [actionLoading, setActionLoading] = useState(false);
  const { courseData, loading } = useGetCourseData({
    name: course.name,
    owner: address,
  });

  const handleListOnchain = async (course) => {
    if (!courseData.price) return;

    switchChain({ chainId: 97 });

    setActionLoading(true);

    try {
      const result = await writeContract(config, {
        abi: marketplaceabi,
        address: "0x78b347a9608abc2fc030a8E9a65c4A9C047Bf67b",
        functionName: "list",
        args: [course.groupId.toString(), courseData.price],
      });
      console.log(result);
    } catch (e) {}

    setActionLoading(false);
  };

  const handleShareButton = async (folderName) => {
    switchChain({ chainId: 5600 });
    const provider = await connector?.getProvider();

    const extra = JSON.stringify({
      createdAt: Date.now(),
      desc: "cem description test",
      url: "",
      price: 1000,
    });
    const createGroupTx = await CreateGroup({
      creator: address,
      groupName: folderName,
      members: [address],
      extra,
    });

    const mirrorGroupTx = await mirrorGroup(folderName, "0", address);

    const bucketName = "dedu-" + address.toLowerCase();

    const statement = {
      effect: PermissionTypes.Effect.EFFECT_ALLOW,
      actions: [PermissionTypes.ActionType.ACTION_GET_OBJECT],
      resources: [GRNToString(newObjectGRN(bucketName, folderName))],
    };

    const principal = {
      type: PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_GROUP,
      value: GRNToString(newGroupGRN(address, folderName)),
    };

    const policyTx = await putBucketPolicy(bucketName, {
      operator: address,
      statements: [statement],
      principal: principal,
    });

    const { simulate, broadcast } = await multiTx([
      createGroupTx,
      mirrorGroupTx,
      policyTx,
    ]);

    const simulateMultiTxInfo = await simulate({
      denom: "BNB",
    });

    console.log(simulateMultiTxInfo);

    const res = await broadcast?.({
      denom: "BNB",
      gasLimit: Number(simulateMultiTxInfo.gasLimit) * 2,
      gasPrice: simulateMultiTxInfo.gasPrice,
      payer: address,
      granter: "",
      signTypedDataCallback: async (addr, message) => {
        const provider = await connector?.getProvider();
        return await provider?.request({
          method: "eth_signTypedData_v4",
          params: [addr, message],
        });
      },
    });

    console.log(res);
  };

  const handleAddFile = async (folderName) => {
    const file = selectedFile;

    switchChain({ chainId: 5600 });

    setActionLoading(true);
    const provider = await connector?.getProvider();

    await createObject({
      address,
      bucketName: "dedu-" + address.toLowerCase(),
      folderName,
      provider,
      file,
    });

    setActionLoading(false);
  };

  return (
    <>
      <tr className="border-b border-gray-200">
        <td className="px-5 py-5 bg-white text-sm">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-gray-900 whitespace-no-wrap">{course.name}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-5 bg-white text-sm">
          <div className="flex items-center">
            {courseData?.url && (
              <div className="flex-shrink-0 w-10 h-10">
                <img
                  className="w-full h-full rounded-full"
                  src={courseData?.url || ""}
                  alt=""
                />
              </div>
            )}
            <div className="ml-3">
              <p className="text-gray-900 whitespace-no-wrap">
                {courseData?.name || ""}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-5 bg-white text-sm">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-gray-900 whitespace-no-wrap">
                {course.groupId}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-5 bg-white text-sm">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-gray-900 whitespace-no-wrap">
                {courseData?.price || ""}
              </p>
            </div>
          </div>
        </td>

        <td className="px-5 py-5  bg-white text-sm flex flex-row justify-center">
          {actionLoading && (
            <SyncLoader
              color={"#000000"}
              loading={actionLoading}
              size={15}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          )}
          {!actionLoading && (
            <>
              {!course.haveGroup && (
                <Tooltip title="List Course">
                  <button
                    className=" mr-1 flex items-center justify-center rounded-lg bg-yellow-400 p-1 shadow-md transition-all hover:shadow-lg active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    data-ripple-light="true"
                    onClick={() => handleShareButton(course)}
                  >
                    <i className="fas fa-user text-lg leading-none"></i>
                  </button>
                </Tooltip>
              )}

              {course.haveGroup && !course.isListed && (
                <Tooltip title="List OnChain">
                  <button
                    className=" mr-1 flex items-center justify-center rounded-lg bg-yellow-500 p-1 shadow-md transition-all hover:shadow-lg active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    data-ripple-light="true"
                    onClick={() => handleListOnchain(course)}
                  >
                    <i className="fas fa-tag text-lg leading-none"></i>
                  </button>
                </Tooltip>
              )}
              {course.haveGroup && (
                <Tooltip title="Update Details">
                  <button
                    className=" mr-1 flex items-center justify-center rounded-lg bg-green-700 p-1 shadow-md transition-all hover:shadow-lg active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    data-ripple-light="true"
                    onClick={() => handleShowDetailsModal(course)}
                  >
                    <i className="fas fa-pen text-lg leading-none"></i>
                  </button>
                </Tooltip>
              )}
              <Tooltip title="Upload File">
                <button
                  disabled={!selectedFile}
                  className=" mr-1 flex items-center justify-center rounded-lg bg-blue-700 p-1 shadow-md transition-all hover:shadow-lg active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-20 disabled:shadow-none"
                  data-ripple-light="true"
                  onClick={() => handleAddFile(course.name)}
                >
                  <i className="fas fa-upload text-lg leading-none"></i>
                </button>
              </Tooltip>
              <Tooltip title="DCellar">
                <a
                  href={`https://testnet.dcellar.io/buckets/${
                    "dedu-" + address.toLowerCase()
                  }/${course.name}`}
                  target="_blank"
                  className=" mr-1 flex items-center text-white justify-center rounded-lg bg-blue-700 p-1 shadow-md transition-all hover:shadow-lg active:opacity-[0.85] "
                  data-ripple-light="true"
                >
                  <i className="fas fa-folder text-lg leading-none"></i>
                </a>
              </Tooltip>
              {/* <a
            target="_blank"
            className="bg-indigo-600 px-4 py-2 rounded-md text-white font-semibold tracking-wide cursor-pointer disabled:opacity-25"
            href={`https://testnet.dcellar.io/buckets/${
              "dedu-" + address.toLowerCase()
            }/${course.name}`}
          >
            DCellar
          </a> */}
            </>
          )}
        </td>
      </tr>
    </>
  );
};
export default TeachingRow;
