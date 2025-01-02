import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ProfileTab } from "./ProfileTab";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Navbar as MTNavbar,
  MobileNav,
  Typography,
  Button,
  IconButton,
  Avatar,
} from "@material-tailwind/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { backendURL } from '@/config';

export function Navbar({ brandName, routes, user, authorized }) {
  const { pathname } = useLocation();
  const [openNav, setOpenNav] = useState(false);
  const [showProfileTab, setShowProfileTab] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotificationsAvailable, setNewNotificationsAvailable] = useState(false);

  const navigate = useNavigate();

  const doLogout = async () => {
    try {
      const res = await fetch(`${backendURL}/logout`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (res.ok) {
        window.location.reload();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    const handleResize = () => window.innerWidth >= 960 && setOpenNav(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getNotifications = async () => {
    try {
      const notificationRes = await fetch(`${backendURL}/user/notifications`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!notificationRes.ok) {
        window.location.reload();
      }

      const data = await notificationRes.json();
      setNotifications(data.notifications);
      setNewNotificationsAvailable(data.unread_notifications.length > 0);

      // If the profile tab is open when notifications are polled, mark messages as read and repoll

      if (!showProfileTab) { return };
      if (!newNotificationsAvailable) { return };

      const readMessageRes = await fetch(`${backendURL}/user/notifications/read-all`, {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
      });

      if (!readMessageRes.ok) { setShowProfileTab(false); return };

      const refreshNotificationRes = await fetch(`${backendURL}/user/notifications`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!refreshNotificationRes.ok) {
        window.location.reload();
        setShowProfileTab(false);
      }


    } catch (error) {
      console.error('Session Expired', error);
      alert('Your login session has expired, please refresh your credentials.');
    }
  };

  useEffect(() => {

    // If user is authorized, get notifications and poll every 30 seconds
    if (authorized) {
      getNotifications();
      const intervalId = setInterval(getNotifications, 30000);
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [authorized]);

  const navList = (
    <ul className="mb-4 mt-2 flex flex-col gap-2 text-inherit lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      {routes.map(({ name, path, icon, href, target }) => (
        <Typography
          key={name}
          as="li"
          variant="small"
          color="inherit"
          className="capitalize"
        >
          {href ? (
            <a
              href={href}
              target={target}
              className="flex items-center gap-1 p-1 font-bold"
            >
              {icon &&
                React.createElement(icon, {
                  className: "w-[18px] h-[18px] opacity-75 mr-1",
                })}
              {name}
            </a>
          ) : (
            <Link
              to={path}
              target={target}
              className="flex items-center gap-1 p-1 font-bold"
            >
              {icon &&
                React.createElement(icon, {
                  className: "w-[18px] h-[18px] opacity-75 mr-1",
                })}
              {name}
            </Link>
          )}
        </Typography>
      ))}
    </ul>
  );

  return (
    <>
      <MTNavbar color="transparent" className="p-3">
        <div className="container mx-auto flex items-center justify-between text-white">
          <Link to="/">
            <Typography className="mr-4 ml-2 cursor-pointer py-1.5 font-bold">
              {brandName}
            </Typography>
          </Link>
          <div className="hidden lg:block">{navList}</div>
          <div className="hidden lg:flex items-center gap-4">
            {authorized === true && (
              <>
                {/* Profile Icon and Username */}
                <button type="button" onClick={() => { setShowProfileTab(true); }}>
                  {pathname === '/app' &&
                    < div className="flex items-center gap-2 mr-4">
                      {/* Avatar with Red Dot Indicator */}
                      <div className="relative">
                        <Avatar
                          src="/img/profile.webp" // Placeholder image path
                          alt="Profile"
                          size="lg"
                        />
                        {newNotificationsAvailable && (
                          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-1 ring-black bg-red-500"></span>
                        )}
                      </div>
                      <Typography variant="small" className="font-bold">
                        {user?.username || 'Username'}
                      </Typography>
                    </div>}
                </button>
                <Button
                  variant="text"
                  size="sm"
                  color="white"
                  onClick={doLogout}
                >
                  Logout
                </Button>
                {pathname !== '/app' && (
                  <Link to="/app">
                    <Button variant="gradient" size="sm" fullWidth>
                      Dashboard
                    </Button>
                  </Link>
                )}
              </>
            )}
            {authorized === false && (
              <>
                <Link to="/login">
                  <Button variant="text" size="sm" color="white" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="gradient" size="sm" fullWidth>
                    Sign-Up
                  </Button>
                </Link>
              </>
            )}
          </div>
          {/* Mobile View: Profile Icon next to Hamburger Menu */}
          <div className="flex items-center lg:hidden">
            {authorized === true && (
              <button type="button" onClick={() => { setShowProfileTab(true); }}>
                {pathname === '/app' &&
                  <div className="flex items-center gap-2 mr-4">
                    {/* Avatar with Red Dot Indicator */}
                    <div className="relative">
                      <Avatar
                        src="/img/profile.webp"
                        alt="Profile"
                        size="lg"
                      />
                      {newNotificationsAvailable && (
                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-1 ring-black bg-red-500"></span>
                      )}
                    </div>
                    <Typography variant="small" className="font-bold">
                      {user?.username || 'Username'}
                    </Typography>
                  </div>}
              </button>
            )}
            <IconButton
              variant="text"
              size="sm"
              color="white"
              className="text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
              onClick={() => setOpenNav(!openNav)}
            >
              {openNav ? (
                <XMarkIcon strokeWidth={2} className="h-10 w-10" />
              ) : (
                <Bars3Icon strokeWidth={2} className="h-10 w-10" />
              )}
            </IconButton>
          </div>
        </div>

        <MobileNav
          className="rounded-xl bg-white px-4 pt-2 pb-4 mt-6 text-blue-gray-900"
          open={openNav}
        >
          <div className="container mx-auto">
            {navList}
            {authorized === true && (
              <>
                <Button
                  variant="text"
                  size="sm"
                  className="mb-2 border"
                  onClick={doLogout}
                  fullWidth
                >
                  Logout
                </Button>
                {pathname !== '/app' && (
                  <Link to="/app" className="mb-2 block">
                    <Button variant="gradient" size="sm" fullWidth>
                      Dashboard
                    </Button>
                  </Link>
                )}
              </>
            )}
            {authorized === false && (
              <>
                <Link to="/login" className="mb-2 block">
                  <Button variant="text" size="sm" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="gradient" size="sm" fullWidth>
                    Sign-Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </MobileNav>
      </MTNavbar >

      {/* Render the ProfileTab component when showProfileTab is true */}
      {
        showProfileTab && (
          <ProfileTab
            user={user}
            notifications={notifications}
            closeProfileTab={() => setShowProfileTab(false)}
            getNotifications={getNotifications}
            showProfileTab={showProfileTab}
          />
        )
      }
    </>
  );
}

Navbar.defaultProps = {
  brandName: "TeamShyft",
  authorized: null,
  user: null, // Default user prop
};

Navbar.propTypes = {
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  authorized: PropTypes.bool,
  user: PropTypes.shape({
    username: PropTypes.string,
    // Add other user properties as needed
  }),
};

Navbar.displayName = "/src/widgets/layout/navbar.jsx";

export default Navbar;
