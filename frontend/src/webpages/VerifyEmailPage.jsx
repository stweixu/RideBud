import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/"); // No token? Redirect home
      return;
    }

    async function verifyEmail() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          credentials: "include",
        });
        if (res.ok) {
          alert("Email verified successfully!");
          navigate("/login"); // Or wherever you want after success
        } else {
          alert("Verification failed or token expired.");
          navigate("/");
        }
      } catch (err) {
        alert("Network error, please try again.");
        navigate("/");
      }
    }

    verifyEmail();
  }, [token, navigate]);

  return <div></div>;
};

export default VerifyEmailPage;
