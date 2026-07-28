import { useContext } from "react";
import { CommonCodeContext } from "./commonCodeContextStore";

export function useCommonCodes() {
  const context = useContext(CommonCodeContext);

  if (!context) {
    throw new Error("useCommonCodes must be used within CommonCodeProvider");
  }

  return context;
}
