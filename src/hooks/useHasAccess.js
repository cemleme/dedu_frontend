import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { checkAddressInGroup } from "../../utils/gfSDK";

export const useHasAccess = (course) => {
  const { address } = useAccount();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      console.log(address, course.ownerAddress);
      if (address == course.ownerAddress) {
        setHasAccess(true);
        console.log("same address setting hasAccess to true");
      } else {
        const _hasAccess = await checkAddressInGroup(
          course.name + "/",
          course.ownerAddress,
          address
        );
        setHasAccess(_hasAccess);
      }

      setLoading(false);
    };
    if (address) {
      load();
    }
  }, [address]);

  return { hasAccess, loading };
};
