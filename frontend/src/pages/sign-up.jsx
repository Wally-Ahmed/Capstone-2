import React, { useState } from 'react';
import {
  Input,
  Checkbox,
  Button,
  Typography,
} from '@material-tailwind/react';
import { Link, useNavigate } from 'react-router-dom';
import { backendURL } from '@/config';


export function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    agreedToTerms: false,
  });

  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if the checkbox is checked
    if (!formData.agreedToTerms) {
      setErrorMessage('You must agree to the Terms and Conditions.');
      return;
    }

    // Additional validation can be added here
    if (formData.password !== formData.confirm_password) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch(`${backendURL}/signup`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });


      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.message || 'Registration failed. Please try again.');
      } else {
        // On successful registration, redirect to '/app'
        navigate('/app');
      }
    } catch (error) {
      alert(JSON.stringify(error))
      setErrorMessage('An error occurred. Please try again.');
      console.error('Error:', error);
    }
  };

  return (
    <section className="m-8 flex">
      <div className="w-2/5 h-full hidden lg:block">
        <img
          src="/img/pattern.png"
          alt="Background Pattern"
          className="h-full w-full object-cover rounded-3xl"
        />
      </div>
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">
            Sign Up
          </Typography>
          <Typography
            variant="lead"
            color="blue-gray"
            className="text-lg font-normal"
          >
            Enter your email and select a username and password to register.
          </Typography>
        </div>
        <form
          className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2"
          onSubmit={handleSubmit}
        >
          <div className="mb-1 flex flex-col gap-6">
            <Typography
              variant="small"
              color="blue-gray"
              className="-mb-3 font-medium"
            >
              Username
            </Typography>
            <Input
              name="username"
              size="lg"
              required={true}
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="!border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                style: { opacity: 0 },
              }}
            />
            <Typography
              variant="small"
              color="blue-gray"
              className="-mb-3 font-medium"
            >
              Email
            </Typography>
            <Input
              type='email'
              name="email"
              size="lg"
              required={true}
              value={formData.email}
              onChange={handleChange}
              placeholder="name@mail.com"
              className="!border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                style: { opacity: 0 },
              }}
            />
            <Typography
              variant="small"
              color="blue-gray"
              className="-mb-3 font-medium"
            >
              Password
            </Typography>
            <Input
              name="password"
              type="password"
              size="lg"
              required={true}
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              className="!border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                style: { opacity: 0 },
              }}
            />
            <Typography
              variant="small"
              color="blue-gray"
              className="-mb-3 font-medium"
            >
              Confirm Password
            </Typography>
            <Input
              name="confirm_password"
              type="password"
              size="lg"
              required={true}
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="********"
              className="!border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                style: { opacity: 0 },
              }}
            />
          </div>
          <Checkbox
            name="agreedToTerms"
            checked={formData.agreedToTerms}
            onChange={handleChange}
            required={true}
            label={
              <Typography
                variant="small"
                color="gray"
                className="flex items-center justify-start font-medium"
              >
                I agree to the&nbsp;
                <a
                  href="#"
                  className="font-normal text-black transition-colors hover:text-gray-900 underline"
                >
                  Terms and Conditions
                </a>
              </Typography>
            }
            containerProps={{ className: '-ml-2.5' }}
          />

          {/* Display error message if it exists */}
          {errorMessage && (
            <Typography
              variant="small"
              color="red"
              className="mt-4 text-center"
            >
              {errorMessage}
            </Typography>
          )}

          <Button className="mt-6" type="submit" fullWidth>
            Register Now
          </Button>

          <div className="space-y-4 mt-8 flex flex-col">
            <Link to={`${backendURL}/signup-google`}>
              <Button
                size="lg"
                color="white"
                className="flex items-center gap-2 justify-center shadow-md border"
                fullWidth
              >
                {/* Google Icon SVG */}
                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_1156_824)">
                    <path d="M16.3442 8.18429C16.3442 7.64047 16.3001 7.09371 16.206 6.55872H8.66016V9.63937H12.9813C12.802 10.6329 12.2258 11.5119 11.3822 12.0704V14.0693H13.9602C15.4741 12.6759 16.3442 10.6182 16.3442 8.18429Z" fill="#4285F4" />
                    <path d="M8.65974 16.0006C10.8174 16.0006 12.637 15.2922 13.9627 14.0693L11.3847 12.0704C10.6675 12.5584 9.7415 12.8347 8.66268 12.8347C6.5756 12.8347 4.80598 11.4266 4.17104 9.53357H1.51074V11.5942C2.86882 14.2956 5.63494 16.0006 8.65974 16.0006Z" fill="#34A853" />
                    <path d="M4.16852 9.53356C3.83341 8.53999 3.83341 7.46411 4.16852 6.47054V4.40991H1.51116C0.376489 6.67043 0.376489 9.33367 1.51116 11.5942L4.16852 9.53356Z" fill="#FBBC04" />
                    <path d="M8.65974 3.16644C9.80029 3.1488 10.9026 3.57798 11.7286 4.36578L14.0127 2.08174C12.5664 0.72367 10.6469 -0.0229773 8.65974 0.000539111C5.63494 0.000539111 2.86882 1.70548 1.51074 4.40987L4.1681 6.4705C4.8001 4.57449 6.57266 3.16644 8.65974 3.16644Z" fill="#EA4335" />
                  </g>
                  <defs>
                    <clipPath id="clip0_1156_824">
                      <rect width="16" height="16" fill="white" transform="translate(0.5)" />
                    </clipPath>
                  </defs>
                </svg>

                <span>Sign Up With Google</span>
              </Button>
            </Link>
            <Link to={`${backendURL}/signup-microsoft`}>
              <Button
                size="lg"
                color="white"
                className="flex items-center gap-2 justify-center shadow-md border"
                fullWidth
              >
                {/* Microsoft Icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16">
                  <g transform="scale(0.7391, 0.6957)">
                    <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </g>
                </svg>

                <span>Sign Up With Microsoft</span>
              </Button>
            </Link>
          </div>
          <Typography
            variant="paragraph"
            className="text-center text-blue-gray-500 font-medium mt-4"
          >
            Already have an account?
            <Link to="/login" className="text-gray-900 ml-1">
              Sign in
            </Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;
