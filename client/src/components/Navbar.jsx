import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-white shadow px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-y-3">
      <Link to="/" className="text-lg font-semibold text-gray-800 hover:text-blue-600">
        Kota Tuition Hub
      </Link>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 ml-auto text-sm sm:text-base justify-end">
        <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
        <Link to="/browse-teachers" className="text-gray-600 hover:text-blue-600">Browse Teachers</Link>
        <Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;
