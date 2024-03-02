import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { checkAddressInGroup } from "../../utils/gfSDK";
import axios from "axios";

export const useGetCourseData = ({ name, owner }) => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState();

  const loadCourseData = async ({ _name, _owner }) => {
    const ownerAddress = _owner || owner?.toLowerCase();
    const courseName = _name || name?.replace("/", "");
    if (!ownerAddress || !courseName) return;
    setLoading(true);
    const url = `https://s3-sp.oortech.com/view/dedu-${ownerAddress}/${courseName}.json`;
    const courseData = await axios(url);
    if (!courseData.data.name) {
      setLoading(false);
      return;
    }
    courseData.data.name = courseData.data.name.replace("/", "");
    setCourseData(courseData.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!name || !owner) return;
    const load = async () => {
      setLoading(true);

      await loadCourseData({});

      setLoading(false);
    };
    load();
  }, [name, owner]);

  return { courseData, loading, loadCourseData };
};
