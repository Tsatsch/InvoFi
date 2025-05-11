import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="" className="text-sm text-gray-600 hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <Link href="" className="text-sm text-gray-600 hover:text-gray-900">
                  Careers
                </Link>
              </li>
              <li>
                <a href="mailto:mail.invofi@gmail.com" className="text-sm text-gray-600 hover:text-gray-900">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="" className="text-sm text-gray-600 hover:text-gray-900">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="" className="text-sm text-gray-600 hover:text-gray-900">
                  Documentation
                </Link>
              </li>
              <li>
                <a href="mailto:mail.invofi@gmail.com" className="text-sm text-gray-600 hover:text-gray-900">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="" className="text-sm text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="" className="text-sm text-gray-600 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Connect</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="https://x.com/invo_fi" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">
                  X (former Twitter)
                </a>
              </li>
              <li>
                <a href="https://github.com/Tsatsch/InvoFi/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">
                  GitHub
                </a>
              </li>
              <li>
                <a href="" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Built at <a href="https://www.colosseum.org/breakout" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline">Solana Breakout Hackathon</a>
            </p>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} InvoFi. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 