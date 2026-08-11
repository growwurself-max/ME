import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <p className="text-6xl font-black text-brand-600">404</p>
        <h1 className="mt-3 text-xl font-bold">This page does not exist</h1>
        <Link to="/" className="btn-primary mt-6">Back to the student portal</Link>
      </div>
    </div>
  );
}
