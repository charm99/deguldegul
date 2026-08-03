import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCommonCodes } from "../services/commonCodeService";
import { useAuth } from "./AuthContext";
import { CommonCodeContext } from "./commonCodeContextStore";

function normalizeCodes(data) {
  return (data || [])
    .filter(
      (item) =>
        String(item.use_yn).trim() === "Y" &&
        String(item.com_cd).trim() !== "*"
    )
    .map((item) => ({
      ...item,
      grp_cd: String(item.grp_cd).trim().padStart(4, "0"),
      com_cd: String(item.com_cd).trim(),
      com_nm: String(item.com_nm || "").trim(),
    }))
    .sort(
      (a, b) =>
        a.grp_cd.localeCompare(b.grp_cd) ||
        Number(a.sort_no || 0) - Number(b.sort_no || 0)
    );
}

export function CommonCodeProvider({ children }) {
  const { authUser, loading: authLoading } = useAuth();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: loadError } = await getCommonCodes({ force: true });

    if (loadError) {
      console.error("common code load error:", loadError);
      setError(loadError);
    } else {
      setCodes(normalizeCodes(data));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return undefined;

    let active = true;

    getCommonCodes({ force: true }).then(({ data, error: loadError }) => {
      if (!active) return;

      if (loadError) {
        console.error("common code load error:", loadError);
        setError(loadError);
      } else {
        setError(null);
        const normalizedCodes = normalizeCodes(data);

        if (normalizedCodes.length === 0) {
          console.error(
            "common code load error: degul_comm_cd returned 0 rows. Check RLS policy and project environment."
          );
        }

        setCodes(normalizedCodes);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [authLoading, authUser?.id]);

  const codesByGroup = useMemo(() => {
    return codes.reduce((result, code) => {
      if (!result[code.grp_cd]) result[code.grp_cd] = [];
      result[code.grp_cd].push(code);
      return result;
    }, {});
  }, [codes]);

  const getCodes = useCallback(
    (groupCode) => codesByGroup[groupCode] || [],
    [codesByGroup]
  );

  const getCodeName = useCallback(
    (groupCode, code, fallback = "-") => {
      if (!code) return fallback;
      const normalizedGroupCode = String(groupCode).trim();
      const normalizedCode = String(code).trim();
      return (
        codesByGroup[normalizedGroupCode]?.find(
          (item) => item.com_cd === normalizedCode
        )?.com_nm ||
        fallback
      );
    },
    [codesByGroup]
  );

  const value = useMemo(
    () => ({ codes, loading, error, getCodes, getCodeName, reload }),
    [codes, loading, error, getCodes, getCodeName, reload]
  );

  return (
    <CommonCodeContext.Provider value={value}>
      {children}
    </CommonCodeContext.Provider>
  );
}
