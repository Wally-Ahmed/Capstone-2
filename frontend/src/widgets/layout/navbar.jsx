import React from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import {
  Navbar as MTNavbar,
  MobileNav,
  Typography,
  Button,
  IconButton,
} from "@material-tailwind/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { backendURL } from '@/config';

export function Navbar({ brandName, routes, authorized }) {

  const { pathname } = useLocation();

  const [openNav, setOpenNav] = React.useState(false);

  const doLogout = async () => {
    const res = await fetch(`${backendURL}/logout`, {
      method: 'GET',
      credentials: 'include', // Include cookies in the request
    });

    if (res.ok) {
      window.location.reload();
    }
  }

  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setOpenNav(false)
    );
  }, []);

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
    <MTNavbar color="transparent" className="p-3">
      <div className="container mx-auto flex items-center justify-between text-white">
        <Link to="/">
          <Typography className="mr-4 ml-2 cursor-pointer py-1.5 font-bold">
            {brandName}
          </Typography>
        </Link>
        <div className="hidden lg:block">{navList}</div>
        <div className="hidden gap-2 lg:flex">

          {authorized == true && <>
            <Button variant="text" size="sm" color="white" onClick={doLogout} fullWidth>
              Logout
            </Button>
            {pathname === '/app'
              ? <></>
              : (
                <Link
                  to="/app"

                >
                  <Button variant="gradient" size="sm" fullWidth>
                    Dashboard
                  </Button>
                </Link>
              )}

          </>}
          {authorized == false && <>
            <Link
              to="/login"

            >
              <Button variant="text" size="sm" color="white" fullWidth>
                Login
              </Button>
            </Link>
            <Link
              to="/sign-up"
            >
              <Button variant="gradient" size="sm" fullWidth>
                Sign-Up
              </Button>
            </Link>
          </>}

        </div>
        <IconButton
          variant="text"
          size="sm"
          color="white"
          className="ml-auto text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
          onClick={() => setOpenNav(!openNav)}
        >
          {openNav ? (
            <XMarkIcon strokeWidth={2} className="h-6 w-6" />
          ) : (
            <Bars3Icon strokeWidth={2} className="h-6 w-6" />
          )}
        </IconButton>
      </div>
      <MobileNav
        className="rounded-xl bg-white px-4 pt-2 pb-4 text-blue-gray-900"
        open={openNav}
      >
        <div className="container mx-auto">
          {navList}

          {authorized === true && <>
            <Button variant="text" size="sm" className="mb-2 border" onClick={doLogout} fullWidth>
              Logout
            </Button>
            {pathname === "/app"
              ? <></>
              : (
                <Link
                  to="/app"

                  className="mb-2 block"
                >
                  <Button variant="gradient" size="sm" fullWidth>
                    Dashboard
                  </Button>
                </Link>
              )}
          </>}
          {authorized === false && <>
            <Link
              to="/login"

              className="mb-2 block"
            >
              <Button variant="text" size="sm" fullWidth>
                Login
              </Button>
            </Link>
            <Link
              to="/sign-up"
            >
              <Button variant="gradient" size="sm" fullWidth>
                Sign-Up
              </Button>
            </Link>
          </>}
        </div>
      </MobileNav>
    </MTNavbar>
  );
}

Navbar.defaultProps = {
  brandName: "TeamShyft",
  authorized: null,
};

Navbar.propTypes = {
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  action: PropTypes.node,
};

Navbar.displayName = "/src/widgets/layout/navbar.jsx";

export default Navbar;
