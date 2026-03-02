"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, FileText, Cpu, Settings } from "lucide-react"; // Page icons

interface NavItem {
  href: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/posts", label: "Posts", Icon: FileText },
  { href: "/ai", label: "AI Writer", Icon: Cpu },
  { href: "/settings", label: "Settings", Icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const renderLinks = (collapseLabels: boolean) => (
    <ul className="mt-6 flex flex-col space-y-2 px-3">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                ${
                  active
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              onClick={() => {
                if (open) onClose(); // close mobile overlay after navigation
              }}
            >
              {/* Page icon */}
              <item.Icon
                className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              {!collapseLabels && <span className="truncate">{item.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.aside
            className="fixed inset-0 z-40 flex flex-col w-64 bg-white shadow-xl md:hidden"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="h-16 flex items-center justify-center font-bold text-lg bg-indigo-50 border-b border-gray-200">
              AI Planner
            </div>
            {renderLinks(false)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200
          ${open ? "w-64" : "w-20"} transition-all duration-300 ease-in-out shadow-sm`}
      >
        <div
          className={`h-16 flex items-center justify-center font-bold text-lg ${
            open ? "text-gray-900" : "text-indigo-500"
          }`}
        >
          {open ? "AI Planner" : "AP"}
        </div>
        {renderLinks(!open)}
      </aside>
    </>
  );
}