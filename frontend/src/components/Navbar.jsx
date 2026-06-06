import Link from "next/link";

const Navbar = ({ isAuthPage = false, hideSignIn = false }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-white sm:text-lg">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.75)]" />
          CodeReview AI
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {!hideSignIn && (
            <Link href="/login" className="btn-secondary px-4 py-1.5 text-sm font-medium">
              Sign In
            </Link>
          )}
          {isAuthPage ? (
            <Link href="/" className="btn-primary px-4 py-1.5">
              Home
            </Link>
          ) : (
            <Link href="/register" className="btn-primary px-4 py-1.5">
              Get Started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
