import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";

import { AuthContext } from "../contexts/AuthContext";;
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { register, isRegistering } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register({
        name: username,
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="bg-dark-800 p-8 rounded-lg w-full max-w-md shadow-xl border border-dark-700">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Create Account
        </h2>

        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={isRegistering}
          >
            {isRegistering ? "Creating Account..." : "Register"}
          </Button>
        </form>

        <p className="text-gray-400 mt-6 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline"
          >
            Sign in.
          </Link>
        </p>
      </div>
    </div>
  );
}