import { useEffect, useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { readContract, writeContract } from "@wagmi/core";
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
} from "../../utils/gfSDK";
import hubabi from "../hub.abi.json";
import { keccak256, toBytes } from "viem";

export const useTeachingActivated = () => {
  const { address } = useAccount();
  const [haveDeduBucket, setHaveDeduBucket] = useState(false);
  const [hasRole, setHasRole] = useState();
  const [loading, setLoading] = useState(true);
  const config = useConfig();

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const bucketList = await getBucketList(address);
      const haveDeduBucket =
        bucketList.body.filter(
          (b) => b.BucketInfo.BucketName === "dedu-" + address.toLowerCase()
        ).length > 0;

      if (haveDeduBucket) setHaveDeduBucket(haveDeduBucket);

      const _hasRole = await readContract(config, {
        abi: hubabi,
        address: "0x50B3BF0d95a8dbA57B58C82dFDB5ff6747Cc1a9E",
        functionName: "hasRole",
        args: [
          keccak256(toBytes("ROLE_UPDATE")),
          address,
          "0x78b347a9608abc2fc030a8E9a65c4A9C047Bf67b",
        ],
        chainId: 97,
      });

      setHasRole(_hasRole);

      setLoading(false);
    };
    if (address) {
      load();
    }
  }, [address]);

  return { haveDeduBucket, hasRole, loading };
};
