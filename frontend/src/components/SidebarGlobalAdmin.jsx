import { Link } from "react-router-dom";

export default function SidebarGlobalAdmin() {
  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <h2 className="text-xl mb-6 font-bold">Admin Global</h2>

      <ul className="flex flex-col gap-3">
        <li>
          <Link to="/global-admin">Empresas</Link>
        </li>
        <li>
          <Link to="/admin">Usuarios</Link>
        </li>
        <li>
          <Link to="/admin">Fichajes</Link>
        </li>
      </ul>
    </div>
  );
}
