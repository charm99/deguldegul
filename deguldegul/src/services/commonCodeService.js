import { supabase } from "./supabase";

let commonCodesRequest = null;

export function getCommonCodes({ force = false } = {}) {
  if (!commonCodesRequest || force) {
    commonCodesRequest = Promise.resolve(
      supabase
        .from("degul_comm_cd")
        .select("*")
    );
  }

  return commonCodesRequest;
}
