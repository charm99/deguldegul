import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../services/supabase";

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("degul_users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        navigate("/complete-profile");
        return;
      }

      if (profile.status === "PENDING") {
        alert("관리자 승인 대기중입니다.");
        navigate("/");
        return;
      }

      if (profile.status === "REJECTED") {
        alert("가입이 거절되었습니다.");
        navigate("/");
        return;
      }

      if (profile.status === "SLEEP") {
        alert("휴면 계정입니다.");
        navigate("/");
        return;
      }

      navigate("/home");
    };

    init();
  }, []);

  return <div>로그인 처리중...</div>;
}

export default AuthCallbackPage;