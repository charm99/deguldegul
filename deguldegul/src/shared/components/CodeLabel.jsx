import { useCommonCodes } from "../../contexts/useCommonCodes";

function CodeLabel({ group, code, fallback }) {
  const { getCodeName } = useCommonCodes();
  return getCodeName(group, code, fallback);
}

export default CodeLabel;
