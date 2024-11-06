import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Navbar } from "@/widgets/layout";
import routes from "@/routes";
import { Home, Profile, SignIn, SignUp, Contact } from "@/pages";


function App() {
  const { pathname } = useLocation();

  return (
    <>
      {!(pathname == '/login' || pathname == '/sign-up') && (
        <div className="container absolute left-2/4 z-10 mx-auto -translate-x-2/4 p-4">
          <Navbar routes={routes} />
        </div>
      )
      }
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/blog" element={<Profile />} />
        <Route path="/support" element={<Contact />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

export default App;
