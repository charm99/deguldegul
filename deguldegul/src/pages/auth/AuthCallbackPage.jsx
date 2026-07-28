import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { fetchProfile, getCurrentUser } from "../../features/auth/api/authApi";

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {

      const {
        data: { user },
      } = await getCurrentUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile } = await fetchProfile(user.id);

      if (!profile) {
        navigate("/complete-profile");
        return;
      }

      if (profile.status === "PND") {
        alert("관리자 승인 대기중입니다.");
        navigate("/");
        return;
      }

      if (profile.status === "REJ") {
        alert("가입이 거절되었습니다.");
        navigate("/");
        return;
      }

      if (profile.status === "SLP") {
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
