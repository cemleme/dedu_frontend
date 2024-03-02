import { forEach } from ".";
import { Client } from "@bnb-chain/greenfield-js-sdk";
import { ReedSolomon } from "@bnb-chain/reed-solomon";
import {
  PermissionTypes,
  GRNToString,
  newGroupGRN,
  newObjectGRN,
} from "@bnb-chain/greenfield-js-sdk";

const DAPP_NAME = "dedu";
const GF_CHAIN_ID = 5600;
const GF_RPC_URL = "https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org";
const BSC_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";
const BSC_CHAIN_ID = 97;

export const getSingleton = function () {
  let client;
  return function () {
    if (!client) {
      client = Client.create(GF_RPC_URL, GF_CHAIN_ID, {
        zkCryptoUrl:
          "https://unpkg.com/@bnb-chain/greenfield-zk-crypto@0.0.3/dist/node/zk-crypto.wasm",
      });
    }
    return client;
  };
};

export const getClient = getSingleton();

export const client = getClient();

export const getSps = async () => {
  const sps = await client.sp.getStorageProviders();
  const finalSps = (sps ?? []).filter(
    (v) => v?.description?.moniker !== "QATest"
  );

  return finalSps;
};

export const getAllSps = async () => {
  const sps = await getSps();

  return sps.map((sp) => {
    return {
      address: sp.operatorAddress,
      endpoint: sp.endpoint,
      name: sp.description?.moniker,
    };
  });
};

export const selectSp = async () => {
  const finalSps = await getSps();
  const selectIndex = 0;
  const secondarySpAddresses = [
    ...finalSps.slice(0, selectIndex),
    ...finalSps.slice(selectIndex + 1),
  ].map((item) => item.operatorAddress);
  const selectSpInfo = {
    endpoint: finalSps[selectIndex].endpoint,
    primarySpAddress: finalSps[selectIndex]?.operatorAddress,
    sealAddress: finalSps[selectIndex].sealAddress,
    secondarySpAddresses,
  };

  return selectSpInfo;
};

export const getRandomSp = async () => {
  const sps = await client.sp.getStorageProviders();
  const finalSps = (sps ?? []).filter(
    (v) =>
      v?.description?.moniker !== "QATest" &&
      (v.endpoint.indexOf("bnbchain.org") > 0 ||
        v.endpoint.indexOf("nodereal.io") > 0)
  );
  return finalSps[Math.floor(Math.random() * finalSps.length)].endpoint;
};

export const multiTx = async (list) => {
  return await client.txClient.multiTx(list);
};

export const parseGroupName = (groupName) => {
  let name = groupName;
  let type = "Collection";
  let bucketName = "";
  if (name.indexOf(`_`) === 0) {
    if (name.indexOf(`_o_`) === 0) {
      type = "Data";
    }
    const temp = name.split("_");
    name = temp.slice(-1)[0];
    bucketName = temp[2];
  }
  return {
    type,
    name,
    bucketName,
  };
};

export const getOffchainAuthKeys = async (address, provider) => {
  const storageResStr = localStorage.getItem(address);

  if (storageResStr) {
    const storageRes = JSON.parse(storageResStr);
    if (storageRes.expirationTime < Date.now()) {
      alert("Your auth key has expired, please generate a new one");
      localStorage.removeItem(address);
      return;
    }

    return storageRes;
  }

  const allSps = await getAllSps();

  const offchainAuthRes =
    await client.offchainauth.genOffChainAuthKeyPairAndUpload(
      {
        sps: allSps,
        chainId: GF_CHAIN_ID,
        expirationMs: 5 * 24 * 60 * 60 * 1000,
        domain: window.location.origin,
        address,
      },
      provider
    );

  const { code, body: offChainData } = offchainAuthRes;
  if (code !== 0 || !offChainData) {
    throw offchainAuthRes;
  }

  localStorage.setItem(address, JSON.stringify(offChainData));
  return offChainData;
};

export const createFolderAndGroup = async ({
  address,
  folderName,
  courseData,
  connector,
}) => {
  const provider = await connector?.getProvider();
  const offChainData = await getOffchainAuthKeys(address, provider);
  const bucketName = "dedu-" + address.toLowerCase();

  const createFolderTx = await client.object.createFolder(
    {
      bucketName: bucketName,
      objectName: folderName + "/",
      creator: address,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  const content = JSON.stringify(courseData);
  console.log(content);

  const objectName = folderName + ".json";
  const rs = new ReedSolomon();
  var blob = new Blob([content], { type: "text/plain" });
  var file = new File([blob], objectName, { type: "text/plain" });
  const fileBytes = await file.arrayBuffer();
  const expectCheckSums = rs.encode(new Uint8Array(fileBytes));

  const createObjectTx = await client.object.createObject(
    {
      bucketName,
      objectName,
      creator: address,
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      fileType: file.type,
      redundancyType: "REDUNDANCY_EC_TYPE",
      contentLength: fileBytes.byteLength,
      expectCheckSums,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  const groupName = folderName + "/";

  const createGroupTx = await CreateGroup({
    creator: address,
    groupName,
    members: [address],
    extra: "",
  });

  const mirrorGroupTx = await mirrorGroup(groupName, "0", address);

  const statement = {
    effect: PermissionTypes.Effect.EFFECT_ALLOW,
    actions: [PermissionTypes.ActionType.ACTION_GET_OBJECT],
    resources: [GRNToString(newObjectGRN(bucketName, groupName))],
  };

  const principal = {
    type: PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_GROUP,
    value: GRNToString(newGroupGRN(address, groupName)),
  };

  const policyTx = await putBucketPolicy(bucketName, {
    operator: address,
    statements: [statement],
    principal: principal,
  });

  const { simulate, broadcast } = await multiTx([
    createFolderTx,
    createObjectTx,
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
  const uploadRes = await client.object.uploadObject(
    {
      bucketName: bucketName,
      objectName: objectName,
      body: file,
      txnHash: res.transactionHash,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  console.log(uploadRes);
};

export const createFolder = async ({
  address,
  bucketName,
  folderName,
  provider,
}) => {
  const offChainData = await getOffchainAuthKeys(address, provider);
  const createFolderTx = await client.object.createFolder(
    {
      bucketName: bucketName,
      objectName: folderName + "/",
      creator: address,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  const createFolderTxSimulateInfo = await createFolderTx.simulate({
    denom: "BNB",
  });

  const createFolderTxRes = await createFolderTx.broadcast({
    denom: "BNB",
    gasLimit: Number(createFolderTxSimulateInfo?.gasLimit),
    gasPrice: createFolderTxSimulateInfo?.gasPrice || "5000000000",
    payer: address,
    granter: "",
  });
};

export const deleteObject = async ({
  address,
  bucketName,
  objectName,
  provider,
}) => {
  const tx = await client.object.deleteObject({
    bucketName,
    objectName,
    operator: address,
  });

  const simulateTx = await tx.simulate({
    denom: "BNB",
  });

  const res = await tx.broadcast({
    denom: "BNB",
    gasLimit: Number(simulateTx?.gasLimit),
    gasPrice: simulateTx?.gasPrice || "5000000000",
    payer: address,
    granter: "",
  });
};

export const createPublicObject = async ({
  address,
  bucketName,
  objectName,
  provider,
  content,
}) => {
  console.log({
    address,
    bucketName,
    objectName,
    provider,
    content,
  });
  const offChainData = await getOffchainAuthKeys(address, provider);

  const rs = new ReedSolomon();
  var blob = new Blob([content], { type: "text/plain" });
  var file = new File([blob], objectName, { type: "text/plain" });
  const fileBytes = await file.arrayBuffer();
  const expectCheckSums = rs.encode(new Uint8Array(fileBytes));

  console.log(fileBytes, expectCheckSums);

  const createObjectTx = await client.object.createObject(
    {
      bucketName: bucketName,
      objectName: objectName,
      creator: address,
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      fileType: file.type,
      redundancyType: "REDUNDANCY_EC_TYPE",
      contentLength: fileBytes.byteLength,
      expectCheckSums,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  const createObjectTxSimulateInfo = await createObjectTx.simulate({
    denom: "BNB",
  });

  const createObjectTxRes = await createObjectTx.broadcast({
    denom: "BNB",
    gasLimit: Number(createObjectTxSimulateInfo?.gasLimit),
    gasPrice: createObjectTxSimulateInfo?.gasPrice || "5000000000",
    payer: address,
    granter: "",
  });

  console.log("create object success", createObjectTxRes);

  const uploadRes = await client.object.uploadObject(
    {
      bucketName: bucketName,
      objectName: objectName,
      body: file,
      txnHash: createObjectTxRes.transactionHash,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  if (uploadRes.code === 0) {
    console.log("upload object success", uploadRes);
  }
};

export const createObject = async ({
  address,
  bucketName,
  folderName,
  provider,
  file,
}) => {
  const offChainData = await getOffchainAuthKeys(address, provider);

  const rs = new ReedSolomon();
  const fileBytes = await file.arrayBuffer();
  const expectCheckSums = rs.encode(new Uint8Array(fileBytes));

  const objectName = folderName + file.name;

  const createObjectTx = await client.object.createObject(
    {
      bucketName: bucketName,
      objectName: objectName,
      creator: address,
      visibility: "VISIBILITY_TYPE_PRIVATE",
      fileType: file.type,
      redundancyType: "REDUNDANCY_EC_TYPE",
      contentLength: fileBytes.byteLength,
      expectCheckSums,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  const createObjectTxSimulateInfo = await createObjectTx.simulate({
    denom: "BNB",
  });

  const createObjectTxRes = await createObjectTx.broadcast({
    denom: "BNB",
    gasLimit: Number(createObjectTxSimulateInfo?.gasLimit),
    gasPrice: createObjectTxSimulateInfo?.gasPrice || "5000000000",
    payer: address,
    granter: "",
  });

  console.log("create object success", createObjectTxRes);

  const uploadRes = await client.object.uploadObject(
    {
      bucketName: bucketName,
      objectName: objectName,
      body: file,
      txnHash: createObjectTxRes.transactionHash,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  if (uploadRes.code === 0) {
    console.log("upload object success", uploadRes);
  } else {
    console.log("upload object failed", uploadRes);
  }
};

export const createBucket = async ({ address, bucketName, provider }) => {
  const spInfo = await selectSp();

  const offChainData = await getOffchainAuthKeys(address, provider);

  const createBucketTx = await client.bucket.createBucket(
    {
      bucketName: bucketName,
      creator: address,
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      chargedReadQuota: "0",
      spInfo: {
        primarySpAddress: spInfo.primarySpAddress,
      },
      paymentAddress: address,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  const createBucketTxSimulateInfo = await createBucketTx.simulate({
    denom: "BNB",
  });

  const createBucketTxRes = await createBucketTx.broadcast({
    denom: "BNB",
    gasLimit: Number(createBucketTxSimulateInfo?.gasLimit),
    gasPrice: createBucketTxSimulateInfo?.gasPrice || "5000000000",
    payer: address,
    granter: "",
  });
};

export const getBucketList = async (address) => {
  const endpoint = await getRandomSp();
  const bucketList = await client.bucket.listBuckets({
    address,
    endpoint,
  });
  return bucketList;
};

export const getBucketFileList = async ({ bucketName }) => {
  const endpoint = await getRandomSp();
  const fileList = await client.object.listObjects({
    bucketName,
    endpoint,
  });
  fileList.body = fileList.body?.GfSpListObjectsByBucketNameResponse;
  return fileList;
};

export const CreateGroup = async (params) => {
  return await client.group.createGroup(params);
};

export const putObjectPolicy = async (bucketName, ObjectName, srcMsg) => {
  return await client.object.putObjectPolicy(bucketName, ObjectName, srcMsg);
};

export const putBucketPolicy = async (bucketName, srcMsg) => {
  return await client.bucket.putBucketPolicy(bucketName, srcMsg);
};

export const getGroupInfoByName = async (groupName, groupOwner) => {
  try {
    return await client.group.headGroup(groupName, groupOwner);
  } catch (e) {
    return {};
  }
};

export const checkGroupExistByName = async (groupName, groupOwner) => {
  const o = await getGroupInfoByName(groupName, groupOwner);
  return Object.keys(o).length;
};

export const checkGroupExistById = async (tokenId) => {
  const o = await headGroupNFT(tokenId);
  return Object.keys(o).length;
};

export const checkAddressInGroup = async (groupName, groupOwner, member) => {
  try {
    return await client.group.headGroupMember(groupName, groupOwner, member);
  } catch (e) {
    return false;
  }
};

export const headGroupNFT = async (tokenId) => {
  try {
    return await client.group.headGroupNFT({ tokenId });
  } catch (e) {
    return {};
  }
};

export const getObjectInfo = async (objectId) => {
  return await client.object.headObjectById(objectId);
};

export const getObjectInfoByName = async (bucketName, objectName) => {
  return await client.object.headObject(bucketName, objectName);
};

export const downloadFile = async ({
  bucketName,
  objectName,
  address,
  provider,
}) => {
  const offChainData = await getOffchainAuthKeys(address, provider);

  const res = await client.object.getObject(
    {
      bucketName,
      objectName,
    },
    {
      type: "EDDSA",
      address,
      domain: window.location.origin,
      seed: offChainData.seedString,
    }
  );

  // res.body is Blob
  console.log("res", res);
  //fs.writeFileSync('your_output_file', buffer)
  return res.body;

  //   const res = await client.object.downloadFile(
  //     {
  //       bucketName,
  //       objectName,
  //     },
  //     {
  //       type: "EDDSA",
  //       address,
  //       domain: window.location.origin,
  //       seed: offChainData.seedString,
  //     }
  //   );

  //   console.log(res);
  return res;
};

export const getObjectPreviewUrl = async ({
  bucketName,
  objectName,
  address,
  provider,
}) => {
  const offChainData = await getOffchainAuthKeys(address, provider);
  const res = await client.object.getObjectPreviewUrl(
    {
      bucketName,
      objectName,
      queryMap: {
        view: "1",
        "X-Gnfd-User-Address": address,
        "X-Gnfd-App-Domain": window.location.origin,
        "X-Gnfd-Expiry-Timestamp": "2023-09-03T09%3A23%3A39Z",
      },
    },
    {
      type: "EDDSA",
      address,
      domain: window.location.origin,
      seed: offChainData.seedString,
    }
  );

  console.log(res);
  return res;
};

export const getObjectMetaByName = async (bucketName, objectName) => {
  const endpoint = await getRandomSp();
  return await client.object.getObjectMeta({
    bucketName,
    objectName,
    endpoint,
  });
};

export const updateGroupInfo = async (address, groupName, extra, provider) => {
  console.log("update group info", address, groupName, extra);

  const offChainData = await getOffchainAuthKeys(address, provider);

  const updateGroupTx = await client.group.updateGroupExtra({
    operator: address,
    groupOwner: address,
    groupName,
    extra,
  });

  const updateGroupExtraSimulateInfo = await updateGroupTx.simulate({
    denom: "BNB",
  });

  const updateGroupTxRes = await updateGroupTx.broadcast(
    {
      denom: "BNB",
      gasLimit: Number(updateGroupExtraSimulateInfo.gasLimit),
      gasPrice: updateGroupExtraSimulateInfo.gasPrice,
      granter: "",
      payer: address,
    },
    {
      type: "EDDSA",
      domain: window.location.origin,
      seed: offChainData.seedString,
      address,
    }
  );

  console.log(updateGroupTxRes);
};

export const mirrorGroup = async (groupName, id, operator) => {
  return await client.crosschain.mirrorGroup({
    groupName,
    id,
    operator,
    destChainId: BSC_CHAIN_ID,
  });
};

export const getCollectionInfo = async (bucketId) => {
  return await client.bucket.headBucketById(bucketId);
};

export const getCollectionInfoByName = async (bucketName) => {
  return await client.bucket.headBucket(bucketName);
};

export const searchKey = async (key) => {
  try {
    return await client.sp.listGroups({
      name: key,
      prefix: `${DAPP_NAME}_`,
      sourceType: "SOURCE_TYPE_ORIGIN",
      limit: 1000,
      offset: 0,
    });
  } catch (e) {
    return [];
  }
};
