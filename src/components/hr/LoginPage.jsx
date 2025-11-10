// LoginPage.jsx
import { useNavigate } from "react-router-dom";
import logo from "../../assets/texweave_Logo_1.png";
import React, { useEffect, useState } from "react";
import { loginUser, setToken } from "../../api/employeeApi";

const LoginPage = () => {
  const [employee_id, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
      if (permissions.full_access) {
        navigate("/hr-work");
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!employee_id.trim() || !username.trim() || !password.trim()) {
      setError("Employee ID, username, and password are required");
      setLoading(false);
      return;
    }

    const payload = {
      username: username.trim(),
      password: password.trim(),
      employee_id: employee_id.trim(),
      designation: designation.trim(),
    };

    try {
      const data = await loginUser(payload);
      
      // Redirect based on permissions
      if (data.permissions?.full_access) {
        navigate("/hr-work");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @import url(//fonts.googleapis.com/css?family=Lato:300:400);
          body {
            margin: 0;
          }
          .header {
            position: relative;
            text-align: center;
            background: linear-gradient(60deg, rgba(84,58,183,1) 0%, rgba(0,172,193,1) 100%);
            color: white;
            height: 90vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .waves {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 10vh;
            min-height: 100px;
            max-height: 150px;
          }
          .parallax > use {
            animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
          }
          .parallax > use:nth-child(1) { animation-delay: -2s; animation-duration: 7s; }
          .parallax > use:nth-child(2) { animation-delay: -3s; animation-duration: 10s; }
          .parallax > use:nth-child(3) { animation-delay: -4s; animation-duration: 13s; }
          .parallax > use:nth-child(4) { animation-delay: -5s; animation-duration: 20s; }
          @keyframes move-forever {
            0% { transform: translate3d(-90px,0,0); }
            100% { transform: translate3d(85px,0,0); }
          }
          .login-container {
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            width: 300px;
            z-index: 2;
            text-align: center;
          }
          .login-container h2 {
            margin-bottom: 20px;
            color: #333;
          }
          .input-group {
            margin-bottom: 15px;
            text-align: left;
          }
          .input-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
            color: #555;
          }
          .input-group input {
            width: 100%;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ccc;
            font-size: 14px;
            box-sizing: border-box;
          }
          .login-btn {
            width: 100%;
            padding: 10px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .login-btn:hover:not(:disabled) {
            background-color: #0056b3;
          }
          .login-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
          }
          .error {
            color: red;
            font-size: 14px;
            margin-bottom: 10px;
            background-color: #ffe6e6;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ffcccc;
          }
          .content {
            position: relative;
            height: 10vh;
            text-align: center;
            background-color: white;
            font-size: 0.7rem;
          }
          .flex {
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          .required::after {
            content: " *";
            color: red;
          }
        `}
      </style>

      <div className="header">
        <img
          src={logo}
          alt="Logo"
          style={{
            width: "150px",
            position: "absolute",
            top: "20px",
            left: "20px",
          }}
        />
        <div className="login-container">
          <h2>Employee Login</h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="employee_id" className="required">Employee ID</label>
              <input
                type="text"
                id="employee_id"
                value={employee_id}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="designation">Designation</label>
              <input
                type="text"
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                disabled={loading}
                placeholder="Optional"
              />
            </div>
            <div className="input-group">
              <label htmlFor="username" className="required">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password" className="required">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        <svg
          className="waves"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
          shapeRendering="auto"
        >
          <defs>
            <path
              id="gentle-wave"
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
            />
          </defs>
          <g className="parallax">
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="0"
              fill="rgba(209, 62, 62, 0.35)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="3"
              fill="rgba(8, 213, 249, 0.55)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="5"
              fill="rgba(156, 216, 121, 0.69)"
            />
            <use xlinkHref="#gentle-wave" x="48" y="7" fill="#fff" />
          </g>
        </svg>
      </div>

      <div className="content flex">
        <p>
          Attention: Please note that transactions over the internet may be
          subject to interruption, delayed transmission due to internet traffic,
          or incorrect data transmission due to the nature of the internet.
          TEXWEAVE cannot assume responsibility for malfunctions in
          communications facilities not under our control or problems caused by
          your computing environment that may affect your usage of this
          application. ©2025 Copyright by TEXWEAVE. All rights reserved.
        </p>
      </div>
    </>
  );
};

export default LoginPage;