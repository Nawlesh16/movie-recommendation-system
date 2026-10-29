import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    navigate('/'); // Redirect to home after mock login
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="bg-dark-800 p-8 rounded-lg w-full max-w-md shadow-xl border border-dark-700">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h2>
        <form onSubmit={handleSubmit}>
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
          <Button type="submit" className="w-full mt-4">Sign In</Button>
        </form>
        <p className="text-gray-400 mt-6 text-center">
          New to AI CineMatch? <Link to="/register" className="text-primary hover:underline">Sign up now.</Link>
        </p>
      </div>
    </div>
  );
}