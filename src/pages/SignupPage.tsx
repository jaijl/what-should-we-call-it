import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';
import { Vote } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
            <Vote className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <SignupForm onSuccess={handleSignupSuccess} />
        </div>
      </div>
    </div>
  );
}